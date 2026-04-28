import React, { useState, useEffect, useCallback } from 'react';
import { api, apiRaw } from './api';
import { s, Badge, Modal, SectionTitle } from './components';

const FIELDS = [
  { key: 'name', label: 'Item name', type: 'text', full: true },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'low_stock_threshold', label: 'Low stock threshold', type: 'number' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'aisle', label: 'Aisle', type: 'text' },
  { key: 'bin', label: 'Bin', type: 'text' },
  { key: 'supplier', label: 'Supplier', type: 'text' },
  { key: 'unit_price', label: 'Unit price ($)', type: 'number' },
];

function ItemModal({ item, token, onSave, onClose }) {
  const [form, setForm] = useState(item || { name: '', sku: '', quantity: 0, low_stock_threshold: 10, category: '', aisle: '', bin: '', supplier: '', unit_price: 0 });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      if (item) await api(`/items/${item.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      else await api('/items', { method: 'POST', body: JSON.stringify(form) }, token);
      onSave();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal title={item ? 'Edit item' : 'Add item'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {FIELDS.map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
            <label style={s.label}>{f.label}</label>
            <input
              style={s.input}
              type={f.type}
              value={form[f.key]}
              step={f.key === 'unit_price' ? '0.01' : '1'}
              onChange={e => set(f.key, f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            />
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button style={s.btn} onClick={onClose}>Cancel</button>
        <button style={s.btnPrimary} onClick={handleSave}>Save item</button>
      </div>
    </Modal>
  );
}

function AdjustModal({ item, token, onSave, onClose }) {
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!reason.trim()) { setError('Please provide a reason.'); return; }
    try {
      await api(`/items/${item.id}/adjust`, { method: 'POST', body: JSON.stringify({ quantity_change: parseInt(change), reason }) }, token);
      onSave();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal title={`Adjust stock — ${item.name}`} onClose={onClose} width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Current quantity: <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{item.quantity}</strong>
        </div>
        <div>
          <label style={s.label}>Quantity change (negative to remove)</label>
          <input style={s.input} type="number" value={change} onChange={e => setChange(e.target.value)} />
        </div>
        <div>
          <label style={s.label}>Reason</label>
          <input style={s.input} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Restock from supplier, Damaged goods..." />
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={s.btn} onClick={onClose}>Cancel</button>
          <button style={s.btnPrimary} onClick={handleSave}>Adjust stock</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Inventory({ token }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const PAGE_SIZE = 15;

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (lowOnly) params.append('low_stock_only', 'true');
    const data = await api(`/items?${params}`, {}, token);
    setItems(data.items);
    setTotal(data.total);
  }, [token, page, search, category, lowOnly]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { api('/categories', {}, token).then(setCategories).catch(() => {}); }, [token]);

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api(`/items/${id}`, { method: 'DELETE' }, token);
    fetchItems();
  };

  const exportCSV = async () => {
    const res = await apiRaw('/export/csv', token);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory.csv'; a.click();
  };

  const closeModal = () => { setModal(null); setSelected(null); };
  const afterSave = () => { closeModal(); fetchItems(); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const thStyle = { padding: '8px 10px', textAlign: 'left', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, fontFamily: 'var(--mono)' };
  const tdStyle = { padding: '10px 10px', borderBottom: '1px solid var(--border)', fontSize: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...s.input, width: 220 }}
          placeholder="Search name, SKU, supplier..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={{ ...s.input, width: 160 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--muted)' }}>
          <input type="checkbox" checked={lowOnly} onChange={e => { setLowOnly(e.target.checked); setPage(1); }} />
          Low stock only
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={s.btn} onClick={exportCSV}>Export CSV</button>
          <button style={s.btnPrimary} onClick={() => { setSelected(null); setModal('add'); }}>+ Add item</button>
        </div>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border2)' }}>
              {['Name', 'SKU', 'Qty', 'Location', 'Category', 'Supplier', 'Unit price', 'Status', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No items found</td></tr>
            )}
            {items.map(item => (
              <tr key={item.id} style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.name}</td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{item.sku}</td>
                <td style={{ ...tdStyle, color: item.is_low_stock ? 'var(--danger)' : 'var(--text)', fontWeight: item.is_low_stock ? 500 : 400 }}>{item.quantity}</td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>Aisle {item.aisle}-{item.bin}</td>
                <td style={tdStyle}><Badge>{item.category}</Badge></td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{item.supplier}</td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)' }}>${item.unit_price.toFixed(2)}</td>
                <td style={tdStyle}><Badge variant={item.is_low_stock ? 'low' : 'ok'}>{item.is_low_stock ? 'Low stock' : 'OK'}</Badge></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...s.btn, ...s.btnSm }} onClick={() => { setSelected(item); setModal('adjust'); }}>Adjust</button>
                    <button style={{ ...s.btn, ...s.btnSm }} onClick={() => { setSelected(item); setModal('edit'); }}>Edit</button>
                    <button style={{ ...s.btn, ...s.btnSm, ...s.btnDanger }} onClick={() => deleteItem(item.id, item.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button style={s.btn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Page {page} of {totalPages} — {total} items</span>
          <button style={s.btn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {modal === 'add' && <ItemModal token={token} onSave={afterSave} onClose={closeModal} />}
      {modal === 'edit' && <ItemModal token={token} item={selected} onSave={afterSave} onClose={closeModal} />}
      {modal === 'adjust' && <AdjustModal token={token} item={selected} onSave={afterSave} onClose={closeModal} />}
    </div>
  );
}
