import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const PasswordReset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');
  
  // Determine which step we're on based on URL params
  const initialStep = token && email ? 1 : 0;
  
  const [activeStep, setActiveStep] = useState(initialStep);
  const [emailInput, setEmailInput] = useState(email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!emailInput) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/request-password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput }),
      });
      
      if (response.ok) {
        setSuccess('Password reset link has been sent to your email');
        // In a real application, we'd wait for the user to click the link
        // For this demo, we'll just simulate moving to the next step after 3 seconds
        setTimeout(() => {
          setActiveStep(1);
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/reset-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          new_password: password
        }),
      });
      
      if (response.ok) {
        setSuccess('Your password has been successfully reset');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Reset Password
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Request Reset</StepLabel>
            </Step>
            <Step>
              <StepLabel>Set New Password</StepLabel>
            </Step>
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          {activeStep === 0 ? (
            <Box component="form" onSubmit={handleEmailSubmit}>
              <Typography paragraph>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePasswordReset}>
              <Typography paragraph>
                Enter your new password below.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Back to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PasswordReset; 