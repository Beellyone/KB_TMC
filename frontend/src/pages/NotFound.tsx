import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function NotFound() {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ fontSize: 72, fontWeight: 700, color: theme.accent }}>404</div>
      <h2 style={{ color: theme.text, margin: '8px 0' }}>Страница не найдена</h2>
      <p style={{ color: theme.textSecondary, marginBottom: 24 }}>Запрошенная страница не существует</p>
      <Link to="/" style={{ padding: '10px 24px', background: theme.accent, color: theme.accentText, borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
        На главную
      </Link>
    </div>
  );
}
