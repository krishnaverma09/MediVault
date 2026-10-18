import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import { API_URL, apiFetch } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('medivault_token', data.token || data.data?.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'white',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 40,
        width: 400,
        maxWidth: '90vw',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--blue)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5.5" y="1" width="5" height="14" rx="2" fill="white" />
              <rect x="1" y="5.5" width="14" height="5" rx="2" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MediVault</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-50)', color: 'var(--red)', borderRadius: 8,
            padding: '12px 14px', fontSize: 13, marginBottom: 20,
            border: '0.5px solid var(--red-200)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', border: '0.5px solid var(--border)', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, outline: 'none',
                fontFamily: 'var(--font)', color: 'var(--text-primary)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(26,86,219,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', border: '0.5px solid var(--border)', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, outline: 'none',
                fontFamily: 'var(--font)', color: 'var(--text-primary)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(26,86,219,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: 'var(--blue)', color: 'white', fontSize: 15,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {loading && (
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
            )}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Trust badges */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 20, marginTop: 24, flexWrap: 'wrap',
        }}>
          {[
            { icon: <Lock size={13} />, label: 'Encrypted' },
            { icon: <ShieldCheck size={13} />, label: 'HIPAA-aligned' },
            { icon: <CheckCircle size={13} />, label: 'Patient-controlled' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--green)' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
