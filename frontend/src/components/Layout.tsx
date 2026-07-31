import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { path: '/tmc', label: 'ТМЦ', icon: '📦' },
  { path: '/contractors', label: 'Подрядчики', icon: '🏗️' },
  { path: '/acts', label: 'Акты', icon: '📋' },
  { path: '/specifications', label: 'Спецификации', icon: '📑' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const s = {
    wrapper: { minHeight: '100vh', background: theme.bg, color: theme.text } as React.CSSProperties,
    header: { background: theme.headerBg, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 } as React.CSSProperties,
    logo: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', position: 'relative' as const } as React.CSSProperties,
    logoText: { color: '#FFFFFF', fontSize: 18, fontWeight: 700, userSelect: 'none' as const } as React.CSSProperties,
    dropdown: { position: 'absolute' as const, top: '100%', left: 0, marginTop: 8, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: theme.shadow, minWidth: 200, zIndex: 20, overflow: 'hidden' } as React.CSSProperties,
    dropItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: theme.text, textDecoration: 'none', transition: 'background 0.1s' } as React.CSSProperties,
    right: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
    themeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' } as React.CSSProperties,
    avatar: { width: 34, height: 34, borderRadius: '50%', background: theme.accent, color: theme.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
    content: { maxWidth: 1200, margin: '0 auto', padding: 24 } as React.CSSProperties,
  };

  return (
    <div style={s.wrapper}>
      <header style={s.header}>
        <div style={s.logo} ref={menuRef} onClick={() => setMenuOpen(!menuOpen)}>
          <span style={{ fontSize: 24 }}>⚙️</span>
          <span style={s.logoText}>TMC Control</span>
          {menuOpen && (
            <div style={s.dropdown}>
              {NAV.map(n => (
                <Link key={n.path} to={n.path} style={s.dropItem}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setMenuOpen(false)}>
                  <span>{n.icon}</span> {n.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={s.right}>
          <button onClick={toggle} style={s.themeBtn} title="Сменить тему">{mode === 'dark' ? '☀️' : '🌙'}</button>
          <div style={{ position: 'relative' }} ref={profileRef}>
            <div style={s.avatar} onClick={() => setProfileOpen(!profileOpen)}>
              {(user?.fio || user?.username || '?')[0].toUpperCase()}
            </div>
            {profileOpen && (
              <div style={{ ...s.dropdown, left: 'auto', right: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.fio || user?.username}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>Роль #{user?.role}</div>
                </div>
                <button style={{ ...s.dropItem, width: '100%', border: 'none', background: 'none', fontFamily: 'inherit' }}
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                  ⚙️ Профиль
                </button>
                <button style={{ ...s.dropItem, width: '100%', border: 'none', background: 'none', fontFamily: 'inherit', color: theme.danger }}
                  onClick={logout}>
                  🚪 Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={s.content}>
        <Outlet />
      </main>
    </div>
  );
}
