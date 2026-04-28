import React, { useState, useEffect } from 'react';
import { api } from './api';
import { s, SectionTitle } from './components';

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard', {}, token).then(setData).catch(e => setError(e.message));
  }, [token]);

  if (error) return <div style={{ padding: 32, color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  const catEntries = Object.entries(data.category_breakdown);
  const maxCat = Math.max(...catEntries.map(([, v]) => v));

  const actionColor = { created: 'var(--accent)', restock: 'var(--accent)', removed: 'var(--warn)', deleted: 'var(--danger)', updated: 'var(--info)' };
  const actionBg = { created: 'var(--accent-dim)', restock: 'var(--accent-dim)', removed: 'var(--warn-dim)', deleted: 'var(--danger-dim)', updated: 'rgba(92,169,255,0.1)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total SKUs', value: data.total_items, color: 'var(--accent)' },
          { label: 'Low stock alerts', value: data.low_stock_count, color: data.low_stock_count > 0 ? 'var(--danger)' : 'var(--text)' },
          { label: 'Total value', value: `$${data.total_value.toLocaleString()}`, color: 'var(--text)' },
          { label: 'Categories', value: catEntries.length, color: 'var(--text)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={s.metricCard}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--mono)' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color }}>{value}</div>
          </div>
        ))}
      </div>

      {data.low_stock_count > 0 && (
        <div style={{ ...s.card, border: '1px solid rgba(255,92,92,0.25)' }}>
          <SectionTitle>Low stock alerts</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.low_stock_items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--danger-dim)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 6 }}>
                <span style={{ fontSize: 13 }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--danger)' }}>{item.quantity} / {item.threshold} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.card}>
          <SectionTitle>By category</SectionTitle>
          {catEntries.map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', width: 100, flexShrink: 0 }}>{cat}</span>
              <div style={{ flex: 1, margin: '0 12px', height: 3, background: 'var(--surface2)', borderRadius: 2 }}>
                <div style={{ width: `${Math.round(count / maxCat * 100)}%`, height: 3, background: 'var(--accent)', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <SectionTitle>Recent activity</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.recent_activity.map((log, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ background: actionBg[log.action] || 'var(--surface2)', color: actionColor[log.action] || 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
                  {log.action}
                </span>
                <span style={{ color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{log.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
