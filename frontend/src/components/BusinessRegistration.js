import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Snackbar, CircularProgress, Paper, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BusinessRegistrationPage = () => {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setBusinessName(event.target.value);
  };

  const handleRegisterBusiness = async () => {
    if (!businessName.trim()) {
      setError('Please enter a business name');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to create a business');
        setLoading(false);
        return;
      }
      
      // Include the token in the Authorization header
      const response = await fetch('http://localhost:8000/businesses/?name=' + encodeURIComponent(businessName), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setBusinessName('');
        console.log('Business created:', data);
      } else {
        console.error('Failed to create business:', data);
        setError(data.detail || 'Failed to create business');
      }
    } catch (err) {
      console.error('Error creating business:', err);
      setError('An error occurred while creating the business');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBusinesses = () => {
    navigate('/businesses');
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Business Management
        </Typography>
        
        {user && !user.is_superuser && (
          <Alert severity="warning" sx={{ marginBottom: 2 }}>
            You need superuser privileges to create a business.
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Register a New Business
            </Typography>
            
            <TextField
              label="Business Name"
              variant="outlined"
              fullWidth
              value={businessName}
              onChange={handleInputChange}
              sx={{ marginBottom: 2 }}
              disabled={loading}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegisterBusiness}
              disabled={loading || (user && !user.is_superuser)}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              fullWidth
            >
              {loading ? 'Creating...' : 'Register Business'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Manage Existing Businesses
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleViewBusinesses}
                size="large"
                sx={{ mb: 2 }}
              >
                View All Businesses
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                View, manage, and delete your registered businesses.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Business created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BusinessRegistrationPage;
