import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        console.log('Submitting login form with:', formData);
        const success = await login(formData.email, formData.password, formData.rememberMe);
        if (success) {
          console.log('Login successful, navigating to dashboard');
          navigate('/dashboard');
        } else {
          console.log('Login failed with error:', error);
        }
      } catch (err) {
        console.error('Exception during login:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // For testing purposes
  const loginWithTestAccount = async () => {
    setFormData({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true
    });
    setIsLoading(true);
    try {
      const success = await login('test@example.com', 'password123', true);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Welcome back
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  color="primary"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
              }
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/reset-password')}
              >
                Forgot password?
              </Link>
              <Link href="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={loginWithTestAccount}
                disabled={isLoading}
              >
                Use Test Account
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 