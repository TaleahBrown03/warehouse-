from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db, create_tables, User, Item, ActivityLog
from auth import verify_password, get_password_hash, create_access_token, get_current_user

app = FastAPI(title="Warehouse Inventory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str

class ItemCreate(BaseModel):
    name: str
    sku: str
    quantity: int
    low_stock_threshold: int = 10
    category: str
    aisle: str
    bin: str
    supplier: str
    unit_price: float = 0.0

class ItemUpdate(BaseModel):
    name: Optional[str]
    quantity: Optional[int]
    low_stock_threshold: Optional[int]
    category: Optional[str]
    aisle: Optional[str]
    bin: Optional[str]
    supplier: Optional[str]
    unit_price: Optional[float]

class StockAdjust(BaseModel):
    quantity_change: int
    reason: str


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    create_tables()
    db = next(get_db())
    # Seed demo user and items if empty
    if not db.query(User).first():
        admin = User(username="admin", hashed_password=get_password_hash("admin123"))
        db.add(admin)
        db.commit()
        db.refresh(admin)

        demo_items = [
            Item(name="Steel Bolts M8", sku="BOLT-M8-001", quantity=450, category="Fasteners", aisle="A", bin="12", supplier="MetalCo", unit_price=0.15, low_stock_threshold=50),
            Item(name="Packing Tape 50m", sku="TAPE-50M-002", quantity=8, category="Packaging", aisle="B", bin="03", supplier="PackSupply", unit_price=2.50, low_stock_threshold=20),
            Item(name="Forklift Battery", sku="BATT-FL-003", quantity=3, category="Equipment", aisle="C", bin="01", supplier="PowerParts", unit_price=850.00, low_stock_threshold=5),
            Item(name="Safety Gloves L", sku="GLOV-L-004", quantity=120, category="Safety", aisle="D", bin="07", supplier="SafeGear", unit_price=4.99, low_stock_threshold=30),
            Item(name="Stretch Wrap Roll", sku="WRAP-001-005", quantity=6, category="Packaging", aisle="B", bin="05", supplier="PackSupply", unit_price=12.00, low_stock_threshold=15),
            Item(name="Hydraulic Pallet Jack", sku="JACK-HYD-006", quantity=2, category="Equipment", aisle="C", bin="02", supplier="LiftCo", unit_price=1200.00, low_stock_threshold=2),
            Item(name="Cardboard Boxes 12x12", sku="BOX-12-007", quantity=340, category="Packaging", aisle="B", bin="01", supplier="BoxWorld", unit_price=0.75, low_stock_threshold=100),
            Item(name="Hard Hat Yellow", sku="HHAT-Y-008", quantity=25, category="Safety", aisle="D", bin="02", supplier="SafeGear", unit_price=18.00, low_stock_threshold=10),
        ]
        for item in demo_items:
            db.add(item)
        db.commit()


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(username=user.username, hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(Item).all()
    total_items = len(items)
    low_stock = [i for i in items if i.quantity <= i.low_stock_threshold]
    total_value = sum(i.quantity * i.unit_price for i in items)
    recent_logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    categories = {}
    for item in items:
        categories[item.category] = categories.get(item.category, 0) + 1
    return {
        "total_items": total_items,
        "low_stock_count": len(low_stock),
        "total_value": round(total_value, 2),
        "category_breakdown": categories,
        "low_stock_items": [{"id": i.id, "name": i.name, "sku": i.sku, "quantity": i.quantity, "threshold": i.low_stock_threshold} for i in low_stock],
        "recent_activity": [
            {"action": l.action, "detail": l.detail, "username": l.username, "timestamp": l.timestamp.isoformat()}
            for l in recent_logs
        ]
    }


# ── Items ─────────────────────────────────────────────────────────────────────

@app.get("/items")
def get_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Item)
    if search:
        query = query.filter(or_(Item.name.ilike(f"%{search}%"), Item.sku.ilike(f"%{search}%"), Item.supplier.ilike(f"%{search}%")))
    if category:
        query = query.filter(Item.category == category)
    if low_stock_only:
        query = query.filter(Item.quantity <= Item.low_stock_threshold)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": i.id, "name": i.name, "sku": i.sku, "quantity": i.quantity,
                "low_stock_threshold": i.low_stock_threshold, "category": i.category,
                "aisle": i.aisle, "bin": i.bin, "supplier": i.supplier,
                "unit_price": i.unit_price, "is_low_stock": i.quantity <= i.low_stock_threshold,
                "updated_at": i.updated_at.isoformat() if i.updated_at else None
            } for i in items
        ]
    }

@app.post("/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Item).filter(Item.sku == item.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    new_item = Item(**item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    log = ActivityLog(item_id=new_item.id, action="created", detail=f"Added {new_item.name} (SKU: {new_item.sku})", quantity_change=new_item.quantity, username=current_user.username)
    db.add(log)
    db.commit()
    return new_item

@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    old_qty = db_item.quantity
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db_item.updated_at = datetime.utcnow()
    db.commit()
    qty_change = (db_item.quantity or old_qty) - old_qty
    log = ActivityLog(item_id=item_id, action="updated", detail=f"Updated {db_item.name}", quantity_change=qty_change, username=current_user.username)
    db.add(log)
    db.commit()
    return db_item

@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    log = ActivityLog(item_id=item_id, action="deleted", detail=f"Deleted {db_item.name} (SKU: {db_item.sku})", quantity_change=-db_item.quantity, username=current_user.username)
    db.add(log)
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}

@app.post("/items/{item_id}/adjust")
def adjust_stock(item_id: int, adjust: StockAdjust, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item.quantity += adjust.quantity_change
    if db_item.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot go below 0")
    db_item.updated_at = datetime.utcnow()
    action = "restock" if adjust.quantity_change > 0 else "removed"
    log = ActivityLog(item_id=item_id, action=action, detail=f"{adjust.reason} — qty change: {adjust.quantity_change:+d}", quantity_change=adjust.quantity_change, username=current_user.username)
    db.add(log)
    db.commit()
    return db_item


# ── Export ────────────────────────────────────────────────────────────────────

@app.get("/export/csv")
def export_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(Item).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "SKU", "Quantity", "Low Stock Threshold", "Category", "Aisle", "Bin", "Supplier", "Unit Price", "Total Value"])
    for i in items:
        writer.writerow([i.id, i.name, i.sku, i.quantity, i.low_stock_threshold, i.category, i.aisle, i.bin, i.supplier, i.unit_price, round(i.quantity * i.unit_price, 2)])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=inventory.csv"})


# ── Categories ────────────────────────────────────────────────────────────────

@app.get("/categories")
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(Item.category).distinct().all()
    return [i[0] for i in items if i[0]]
