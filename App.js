import React, { useState } from 'react';
import './index.css';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import Inventory from './Inventory';

const s = {
  nav: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', height: 52, flexShrink: 0 },
  navTab: (active) => ({ padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', fontSize: 12, color: active ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', letterSpacing: 0.5, background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', fontFamily: 'var(--font)' }),
  btn: { background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11, padding: '4px 12px', cursor: 'pointer' },
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('wh_token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('wh_user') || '');
  const [tab, setTab] = useState('dashboard');

  const handleLogin = (t, u) => {
    setToken(t); setUsername(u);
    localStorage.setItem('wh_token', t);
    localStorage.setItem('wh_user', u);
  };

  const handleLogout = () => {
    setToken(''); setUsername('');
    localStorage.removeItem('wh_token');
    localStorage.removeItem('wh_user');
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={s.nav}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginRight: 24 }}>
          Warehouse OS
        </span>
        {['dashboard', 'inventory'].map(t => (
          <button key={t} style={s.navTab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{username}</span>
          <button style={s.btn} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 24, boxSizing: 'border-box' }}>
        {tab === 'dashboard' ? <Dashboard token={token} /> : <Inventory token={token} />}
      </main>
    </div>
  );
}
