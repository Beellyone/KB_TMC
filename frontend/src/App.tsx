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
import SpecificationsPage from './pages/SpecificationsPage';
import SpecificationDetail from './pages/SpecificationDetail';
import SpecMotherTmcDetail from './pages/SpecMotherTmcDetail';
import ActsPage from './pages/ActsPage';
import ActDetailPage from './pages/ActDetailPage';
import { Home } from './pages/Stubs';
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
            <Route path="/acts" element={<ActsPage />} />
            <Route path="/acts/:id" element={<ActDetailPage />} />
            <Route path="/specifications" element={<SpecificationsPage />} />
            <Route path="/specifications/:id" element={<SpecificationDetail />} />
            <Route path="/specifications/:id/mother-tmc/:smtId" element={<SpecMotherTmcDetail />} />
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
