import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, Snackbar, CircularProgress, Paper, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BusinessRegistrationPage = () => {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasRegisteredBusiness, setHasRegisteredBusiness] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user already has a registered business
    const checkUserBusiness = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) return;
        
        const response = await fetch('http://localhost:8000/businesses/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setHasRegisteredBusiness(true);
          navigate('/my-business');
        } else if (response.status !== 404) {
          console.error('Error checking user business:', await response.json());
        }
      } catch (err) {
        console.error('Failed to check user business:', err);
      }
    };
    
    checkUserBusiness();
  }, [navigate]);

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
      
      // Register business using the business registration endpoint
      const response = await fetch('http://localhost:8000/businesses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: businessName })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setBusinessName('');
        console.log('Business registered:', data);
        
        // Show success message for a moment before redirecting
        setTimeout(() => {
          navigate('/my-business');
        }, 2000);
      } else {
        console.error('Failed to register business:', data);
        setError(data.detail || 'Failed to register business');
      }
    } catch (err) {
      console.error('Error registering business:', err);
      setError('An error occurred while registering the business');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMyBusiness = () => {
    navigate('/my-business');
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
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Register Your Business
            </Typography>
            
            {hasRegisteredBusiness ? (
              <Alert severity="info" sx={{ marginBottom: 2 }}>
                You already have a registered business. You can manage it from the business page.
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ marginBottom: 2 }}>
                  Register your business to start offering rewards to your customers. 
                  Your registration will be reviewed by an administrator.
                </Alert>
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  fullWidth
                >
                  {loading ? 'Registering...' : 'Register Business'}
                </Button>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Manage Your Business
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleViewMyBusiness}
                size="large"
                sx={{ mb: 2 }}
              >
                Go to My Business
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Manage your business, create rewards, and track customer activity.
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
          Business registration submitted successfully! It will be reviewed by an administrator.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BusinessRegistrationPage;
