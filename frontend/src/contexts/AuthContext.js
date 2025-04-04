import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create a custom axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      console.log('Fetching user profile with token:', token);
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User profile response:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe) => {
    try {
      setError(null);
      console.log('Attempting login with:', { email, rememberMe });
      
      // Check if backend server is running
      try {
        await api.get('/');
      } catch (connectionError) {
        console.error('Backend connection error:', connectionError);
        setError('Cannot connect to the backend server. Please ensure it is running.');
        return false;
      }
      
      const response = await api.post('/auth/login', {
        email,
        password,
        remember_me: rememberMe
      });
      
      console.log('Login response:', response.data);
      
      const { access_token } = response.data;
      if (rememberMe) {
        localStorage.setItem('token', access_token);
      } else {
        sessionStorage.setItem('token', access_token);
      }
      
      await fetchUserProfile(access_token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Safe error handling that won't crash if response is undefined
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
        setError(error.response.data.detail || 'An error occurred during login');
      } else if (error.request) {
        console.error('Error request:', error.request);
        setError('No response from server. Please check your connection and ensure the backend is running.');
      } else {
        console.error('Error message:', error.message);
        setError('An unexpected error occurred. Please try again later.');
      }
      return false;
    }
  };

  const register = async (email, password, name, isBusinessOwner = false, businessName = '') => {
    try {
      setError(null);
      console.log('Attempting registration with:', { email, name, isBusinessOwner, businessName });
      
      // Check if backend server is running
      try {
        await api.get('/');
      } catch (connectionError) {
        console.error('Backend connection error:', connectionError);
        setError('Cannot connect to the backend server. Please ensure it is running.');
        return false;
      }
      
      // Step 1: Register the user
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        is_business_owner: isBusinessOwner
      });
      
      console.log('Registration response:', response.data);
      
      // Step 2: If this is a business owner, create the business
      if (isBusinessOwner && businessName) {
        try {
          // First, login to get a token
          const loginResponse = await api.post('/auth/login', {
            email,
            password,
            remember_me: false
          });
          
          const { access_token } = loginResponse.data;
          
          // Create the business with the token
          const businessResponse = await api.post('/businesses/register', 
            { name: businessName },
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          
          console.log('Business creation response:', businessResponse.data);
        } catch (businessError) {
          console.error('Error creating business during registration:', businessError);
          // We still consider registration successful even if business creation fails
          // The user can create a business later
        }
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Safe error handling that won't crash if response is undefined
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
        setError(error.response.data.detail || 'An error occurred during registration');
      } else if (error.request) {
        console.error('Error request:', error.request);
        setError('No response from server. Please check your connection and ensure the backend is running.');
      } else {
        console.error('Error message:', error.message);
        setError('An unexpected error occurred. Please try again later.');
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await api.post('/auth/password-reset', { email });
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Safe error handling 
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'An error occurred');
      } else {
        setError('An error occurred during password reset');
      }
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await api.post(
        '/auth/change-password',
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      
      // Safe error handling
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'An error occurred');
      } else {
        setError('An error occurred while changing your password');
      }
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    resetPassword,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 