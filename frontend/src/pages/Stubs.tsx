import { useTheme } from '../context/ThemeContext';

function Stub({ icon, title }: { icon: string; title: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ color: theme.text }}>{title}</h2>
      <p style={{ color: theme.textSecondary }}>Раздел в разработке</p>
    </div>
  );
}

export function Home() { return <Stub icon="🏠" title="Главная" />; }
export function Contractors() { return <Stub icon="🏗️" title="Подрядчики" />; }
export function Acts() { return <Stub icon="📋" title="Акты" />; }
export function Specifications() { return <Stub icon="📑" title="Спецификации" />; }
