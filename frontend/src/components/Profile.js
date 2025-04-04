import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent
} from '@mui/material';
import { Person, Edit, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (editing) {
      if (formData.newPassword && !formData.currentPassword) {
        errors.currentPassword = 'Current password is required to set a new password';
      }
      
      if (formData.newPassword && formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // For now, just handle password change
      // In a real app, you would also update user profile
      if (formData.newPassword) {
        await changePassword(formData.currentPassword, formData.newPassword);
      }
      
      setSuccess(true);
      setEditing(false);
      
      // Clear sensitive data
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: user?.is_superuser ? 'secondary.main' : 'primary.main',
              mr: 2
            }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              User Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account information and security
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant={editing ? "outlined" : "contained"}
            startIcon={editing ? <Save /> : <Edit />}
            onClick={() => {
              if (editing) {
                handleSubmit({ preventDefault: () => {} });
              } else {
                setEditing(true);
              }
            }}
            disabled={loading}
          >
            {editing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>

        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing || loading}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing || loading}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Account Type
                    </Typography>
                    <Alert severity={user?.is_superuser ? "warning" : "info"}>
                      {user?.is_superuser 
                        ? "Administrator Account" 
                        : "Business User Account"}
                    </Alert>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                  {editing && (
                    <>
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        disabled={loading}
                        error={!!formErrors.currentPassword}
                        helperText={formErrors.currentPassword}
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        error={!!formErrors.newPassword}
                        helperText={formErrors.newPassword}
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                      />
                    </>
                  )}
                  {!editing && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Password
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        ••••••••••••
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Last login
                      </Typography>
                      <Typography variant="body1">
                        {user?.last_login 
                          ? new Date(user.last_login).toLocaleString() 
                          : 'Never'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar 
        open={!!error || success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || "Profile updated successfully!"}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 