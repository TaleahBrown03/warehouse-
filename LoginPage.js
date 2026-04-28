import React, { useState } from 'react';
import { s } from './components';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('password', password);
      const res = await fetch(`${BASE}/auth/login`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      onLogin(data.access_token, data.username);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ ...s.card, width: 360 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: 'var(--accent)', marginBottom: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
            Warehouse OS
          </div>
          <div style={{ fontSize: 22, fontWeight: 300 }}>Sign in</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={s.label}>Username</label>
            <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

          <button style={{ ...s.btnPrimary, padding: '10px 0', marginTop: 4, width: '100%' }}
            onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            Demo credentials: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
