import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Box, Avatar, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  ListAlt as ListAltIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 240;

const NAV = [
  { path: '/', label: 'Главная', icon: <InventoryIcon /> },
  { path: '/tmc', label: 'ТМЦ', icon: <InventoryIcon /> },
  { path: '/warehouses', label: 'Склады', icon: <WarehouseIcon /> },
  { path: '/contractors', label: 'Подрядчики', icon: <BusinessIcon /> },
  { path: '/acts', label: 'Акты', icon: <ListAltIcon /> },
  { path: '/specifications', label: 'Спецификации', icon: <DescriptionIcon /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initial = (user?.fio || user?.username || '?')[0].toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: theme.sidebarBg,
            color: theme.sidebarText,
            borderRight: `1px solid ${theme.border}`,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', gap: 1, py: 2 }}>
          <span style={{ fontSize: 28 }}>⚙️</span>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18 }}>
            TMC Control
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: `${theme.sidebarText}22` }} />
        <List sx={{ pt: 1 }}>
          {NAV.map(n => (
            <ListItemButton
              key={n.path}
              component={Link}
              to={n.path}
              selected={isActive(n.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                color: theme.sidebarText,
                '&.Mui-selected': {
                  color: theme.sidebarActive,
                  background: `${theme.sidebarActive}18`,
                  '&:hover': { background: `${theme.sidebarActive}25` },
                },
                '&:hover': { background: `${theme.sidebarText}12` },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {n.icon}
              </ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(n.path) ? 600 : 400 }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', gap: 1 }}>
            <IconButton onClick={toggle} sx={{ color: '#FFFFFF' }}>
              {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
            <div style={{ position: 'relative' }} ref={profileRef}>
              <Avatar
                onClick={() => setProfileOpen(!profileOpen)}
                sx={{
                  width: 34, height: 34, cursor: 'pointer',
                  background: theme.accent, color: theme.accentText,
                  fontSize: 14, fontWeight: 700,
                }}
              >
                {initial}
              </Avatar>
              {profileOpen && (
                <Box sx={{
                  position: 'absolute', top: '100%', right: 0, mt: 1,
                  background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: 1, boxShadow: theme.shadow, minWidth: 200, zIndex: 20, overflow: 'hidden',
                }}>
                  <Box sx={{ p: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: theme.text }}>
                      {user?.fio || user?.username}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: theme.textSecondary }}>
                      Роль #{user?.role}
                    </Typography>
                  </Box>
                  <Menu
                    open={profileOpen}
                    anchorEl={profileRef.current}
                    onClose={() => setProfileOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
                  >
                    <MenuItem onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                      ⚙️ Профиль
                    </MenuItem>
                    <MenuItem onClick={() => { setProfileOpen(false); logout(); }} sx={{ color: theme.danger }}>
                      🚪 Выйти
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </div>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, maxWidth: 1200, width: '100%', mx: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
