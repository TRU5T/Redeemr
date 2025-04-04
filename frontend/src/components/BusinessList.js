import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/businesses/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
        console.log('Fetched businesses:', data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch businesses:', errorData);
        setError(errorData.detail || 'Failed to fetch businesses');
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('An error occurred while fetching businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (businessId) => {
    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/businesses/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the deleted business from the state
        setBusinesses(businesses.filter(business => business.id !== businessId));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete business:', errorData);
        alert(errorData.detail || 'Failed to delete business');
      }
    } catch (err) {
      console.error('Error deleting business:', err);
      alert('An error occurred while deleting the business');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Businesses
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '/dashboard'}
        >
          Create New Business
        </Button>
      </Box>

      {businesses.length === 0 ? (
        <Alert severity="info">No businesses found. Create one to get started!</Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {businesses.map((business) => (
            <Card key={business.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {business.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Business ID: {business.id}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small" color="primary">
                  View Rewards
                </Button>
                {user && user.is_superuser && (
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteBusiness(business.id)}
                  >
                    Delete
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BusinessList;
