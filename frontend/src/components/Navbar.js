import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Divider,
  Box,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  CardGiftcard,
  Settings,
  Logout,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navigateTo = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Determine if user is admin (superuser)
  const isAdmin = user && user.is_superuser;
  // Determine if user is a business owner 
  const isBusinessOwner = user && user.is_business_owner;

  const drawerItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      onClick: () => navigateTo('/dashboard'),
      roles: ['admin', 'business', 'user']
    },
    {
      text: 'All Businesses',
      icon: <Business />,
      onClick: () => navigateTo('/businesses'),
      roles: ['admin']
    },
    {
      text: 'My Business',
      icon: <Business />,
      onClick: () => navigateTo('/my-business'),
      roles: ['business']
    },
    {
      text: 'Rewards Management',
      icon: <CardGiftcard />,
      onClick: () => navigateTo('/rewards'),
      roles: ['business']
    },
    {
      text: 'Admin Panel',
      icon: <AdminPanelSettings />,
      onClick: () => navigateTo('/admin'),
      roles: ['admin']
    }
  ];

  // Filter items based on user role
  const filteredDrawerItems = drawerItems.filter(item => {
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isBusinessOwner && item.roles.includes('business')) return true;
    if (!isAdmin && !isBusinessOwner && item.roles.includes('user')) return true;
    return false;
  });

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="primary"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 'bold' }}>
            Redeemr
          </Typography>
          
          {user && user.is_superuser && (
            <Button 
              color="primary"
              variant="contained"
              onClick={() => navigate('/admin')}
              startIcon={<AdminPanelSettings />}
              sx={{ mr: 2, fontWeight: 'bold' }}
            >
              Admin
            </Button>
          )}
          
          {user ? (
            <div>
              <Button 
                color="primary"
                onClick={handleMenu}
                sx={{ fontWeight: 'bold' }}
                startIcon={
                  <Avatar 
                    sx={{ width: 32, height: 32, bgcolor: isAdmin ? 'secondary.main' : 'primary.main' }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                }
              >
                {user.name || user.email}
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button color="primary" variant="contained" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {isAdmin ? 'Admin Dashboard' : 'Business Dashboard'}
              </Typography>
            </ListItem>
            <Divider />
            {filteredDrawerItems.map((item, index) => (
              <ListItem button key={index} onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => { navigateTo('/profile'); }}>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar; 