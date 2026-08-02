import { useState } from 'react';
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

const DRAWER_WIDTH = 260;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initial = (user?.fio || user?.username || '?')[0].toUpperCase();

  const handleNavClick = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.bg }}>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: theme.sidebarBg,
            color: theme.sidebarText,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 2.5 }}>
          <span style={{ fontSize: 28 }}>⚙️</span>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18 }}>
            TMC Control
          </Typography>
        </Box>
        <Divider sx={{ borderColor: `${theme.sidebarText}22` }} />
        <List sx={{ pt: 1 }}>
          {NAV.map(n => (
            <ListItemButton
              key={n.path}
              selected={isActive(n.path)}
              onClick={() => handleNavClick(n.path)}
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
              <ListItemText
                primary={n.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(n.path) ? 600 : 400 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <AppBar
        position="sticky"
        elevation={0}
        sx={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <span style={{ fontSize: 24 }}>⚙️</span>
            <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18, userSelect: 'none' }}>
              TMC Control
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggle} sx={{ color: '#FFFFFF' }}>
              {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
            <Avatar
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                width: 34, height: 34, cursor: 'pointer',
                background: theme.accent, color: theme.accentText,
                fontSize: 14, fontWeight: 700,
              }}
            >
              {initial}
            </Avatar>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {user?.fio || user?.username}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    Роль #{user?.role}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                ⚙️ Профиль
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: theme.danger }}>
                🚪 Выйти
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
