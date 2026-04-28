# Warehouse Inventory Manager

A full-stack warehouse inventory management system built with React + FastAPI.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, IBM Plex fonts |
| Backend | Python 3.10+, FastAPI |
| Database | SQLite (via SQLAlchemy) |
| Auth | JWT tokens (python-jose) |

## Features

- JWT authentication (login/logout)
- Dashboard with live stats, low stock alerts, category breakdown, activity log
- Full inventory CRUD — add, edit, delete items
- Stock adjustments with reason logging
- Search, filter by category, low stock filter, pagination
- CSV export
- Auto-seeded demo data on first run

---

## Getting Started

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: http://localhost:3000

---

## Default Login

| Field | Value |
|-------|-------|
| Username | admin |
| Password | admin123 |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Get JWT token |
| POST | /auth/register | Create new user |
| GET | /dashboard | Stats + alerts + activity |
| GET | /items | List items (search, filter, paginate) |
| POST | /items | Create item |
| PUT | /items/{id} | Update item |
| DELETE | /items/{id} | Delete item |
| POST | /items/{id}/adjust | Adjust stock quantity |
| GET | /export/csv | Download inventory as CSV |
| GET | /categories | List all categories |

---

## Project Structure

```
warehouse-app/
├── backend/
│   ├── main.py          # FastAPI app, all routes
│   ├── database.py      # SQLAlchemy models + DB setup
│   ├── auth.py          # JWT auth utilities
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js       # Root component + routing
│   │   ├── LoginPage.js # Auth screen
│   │   ├── Dashboard.js # Stats + activity
│   │   ├── Inventory.js # Full CRUD table
│   │   ├── components.js # Shared UI + styles
│   │   └── api.js       # Fetch wrapper
│   └── package.json
└── README.md
```

---

## Deploying

**Backend** → Railway, Render, or any Python host. Set `DATABASE_URL` env var for PostgreSQL in production.

**Frontend** → Vercel or Netlify. Set `REACT_APP_API_URL` to your deployed backend URL.
