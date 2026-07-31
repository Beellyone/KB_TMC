import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(username, password); }
    catch { setError('Неверный логин или пароль'); }
    finally { setLoading(false); }
  };

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1px solid ${theme.inputBorder}`,
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: theme.inputBg, color: theme.text, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: theme.bg }}>
      <form onSubmit={submit} style={{ background: theme.surface, padding: 48, borderRadius: 12, boxShadow: theme.shadow, width: 400, border: `1px solid ${theme.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚙️</div>
          <h2 style={{ margin: 0, color: theme.text }}>TMC Control</h2>
          <p style={{ color: theme.textSecondary, margin: '4px 0 0', fontSize: 14 }}>Контроль ремонта ТМЦ</p>
        </div>
        {error && <div style={{ color: theme.danger, marginBottom: 16, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: theme.textSecondary }}>Логин</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={input} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: theme.textSecondary }}>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={input} />
        </div>
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 12, background: theme.accent, color: theme.accentText, border: 'none',
          borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
        }}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
