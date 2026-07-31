import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../theme';
import { lightTheme, darkTheme } from '../theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('theme') as ThemeMode) || 'dark');

  useEffect(() => { localStorage.setItem('theme', mode); }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme: mode === 'dark' ? darkTheme : lightTheme, mode, toggle: () => setMode(m => m === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
