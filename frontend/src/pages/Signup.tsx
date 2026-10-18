import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';
import { API_URL, apiFetch } from '../config/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font)', color: 'var(--text-primary)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--blue)';
    e.target.style.boxShadow = '0 0 0 3px rgba(26,86,219,0.1)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
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
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Join MediVault today</p>
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

        {/* Role selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            I am a…
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              { value: 'patient', icon: <User size={22} />, title: 'Patient', desc: 'Manage my health records' },
              { value: 'doctor',  icon: <Stethoscope size={22} />, title: 'Doctor', desc: 'Access shared patient records' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: role === opt.value ? '2px solid var(--blue)' : '0.5px solid var(--border)',
                  background: role === opt.value ? 'var(--blue-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font)',
                }}
              >
                <div style={{ color: role === opt.value ? 'var(--blue)' : 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                  {opt.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: role === opt.value ? 'var(--blue)' : 'var(--text-primary)', marginBottom: 3 }}>
                  {opt.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Full name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
