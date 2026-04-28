import React from 'react';

export const s = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px' },
  metricCard: { background: 'var(--surface2)', borderRadius: 8, padding: '16px' },
  btn: { background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12, padding: '6px 14px', cursor: 'pointer' },
  btnPrimary: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, padding: '7px 16px', cursor: 'pointer' },
  btnSm: { padding: '3px 10px', fontSize: 11 },
  btnDanger: { borderColor: 'rgba(255,92,92,0.3)', color: 'var(--danger)' },
  input: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, padding: '8px 10px', outline: 'none' },
  label: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5, display: 'block', fontFamily: 'var(--mono)' },
};

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { background: 'var(--surface2)', color: 'var(--muted)' },
    ok: { background: 'var(--accent-dim)', color: 'var(--accent)' },
    low: { background: 'var(--danger-dim)', color: 'var(--danger)' },
    warn: { background: 'var(--warn-dim)', color: 'var(--warn)' },
    info: { background: 'rgba(92,169,255,0.1)', color: 'var(--info)' },
  };
  return (
    <span style={{ ...styles[variant], fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--mono)' }}>
      {children}
    </span>
  );
}

export function Modal({ title, children, onClose, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ ...s.card, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{title}</span>
          <button onClick={onClose} style={{ ...s.btn, ...s.btnSm }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 12 }}>{children}</div>;
}
