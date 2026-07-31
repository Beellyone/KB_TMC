import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TmcPage from './pages/TmcPage';
import MotherTmcDetail from './pages/MotherTmcDetail';
import WarehousesPage from './pages/WarehousesPage';
import ContractorsPage from './pages/ContractorsPage';
import { Home, Acts, Specifications } from './pages/Stubs';
import NotFound from './pages/NotFound';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { theme } = useTheme();
  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/" element={<Home />} />
            <Route path="/tmc" element={<TmcPage />} />
            <Route path="/tmc/mother/:id" element={<MotherTmcDetail />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/contractors" element={<ContractorsPage />} />
            <Route path="/acts" element={<Acts />} />
            <Route path="/specifications" element={<Specifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
