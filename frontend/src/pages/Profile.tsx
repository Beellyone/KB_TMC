import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ROLES: Record<number, string> = {
  1: 'Разработчик', 2: 'Админ', 3: 'Инженер', 4: 'Оператор ТМЦ', 5: 'СТ Склада', 6: 'Подрядчик', 7: 'СТ',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (newPw !== confirm) { setErr('Пароли не совпадают'); return; }
    if (newPw.length < 4) { setErr('Минимум 4 символа'); return; }
    try {
      await api.post('/auth/change-password', { old_password: oldPw, new_password: newPw });
      setMsg('Пароль изменён. Войдите заново.');
      setTimeout(() => logout(), 1500);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const card: React.CSSProperties = { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 };
  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: theme.inputBg, color: theme.text, outline: 'none' };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px' }}>Профиль</h2>

      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Информация</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><span style={{ color: theme.textSecondary, fontSize: 13 }}>Логин</span><br /><strong>{user?.username}</strong></div>
          <div><span style={{ color: theme.textSecondary, fontSize: 13 }}>ФИО</span><br /><strong>{user?.fio || '—'}</strong></div>
          <div><span style={{ color: theme.textSecondary, fontSize: 13 }}>Роль</span><br /><strong>{ROLES[user?.role ?? 0] || '—'}</strong></div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Тема оформления</h3>
        <button onClick={toggle} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, cursor: 'pointer', fontSize: 14 }}>
          {mode === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
        </button>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Смена пароля</h3>
        {msg && <div style={{ color: theme.success, marginBottom: 12, padding: '10px 14px', background: `${theme.success}15`, borderRadius: 6, fontSize: 14 }}>{msg}</div>}
        {err && <div style={{ color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 }}>{err}</div>}
        <form onSubmit={changePw}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: theme.textSecondary }}>Текущий пароль</label>
            <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required style={input} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: theme.textSecondary }}>Новый пароль</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required style={input} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: theme.textSecondary }}>Подтвердите пароль</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={input} />
          </div>
          <button type="submit" style={{ padding: '10px 24px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Сменить пароль
          </button>
        </form>
      </div>
    </div>
  );
}
