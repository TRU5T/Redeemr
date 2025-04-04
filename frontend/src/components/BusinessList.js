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
  Alert,
  Tabs,
  Tab,
  Chip,
  Grid
} from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
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

  const handleApproveBusiness = async (businessId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/businesses/${businessId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update business status in state
        setBusinesses(businesses.map(business => 
          business.id === businessId 
            ? { ...business, is_approved: true } 
            : business
        ));
        alert('Business approved successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to approve business:', errorData);
        alert(errorData.detail || 'Failed to approve business');
      }
    } catch (err) {
      console.error('Error approving business:', err);
      alert('An error occurred while approving the business');
    }
  };

  const handleRejectBusiness = async (businessId) => {
    if (!window.confirm('Are you sure you want to reject this business? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/businesses/${businessId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the rejected business from the state
        setBusinesses(businesses.filter(business => business.id !== businessId));
        alert('Business rejected and removed');
      } else {
        const errorData = await response.json();
        console.error('Failed to reject business:', errorData);
        alert(errorData.detail || 'Failed to reject business');
      }
    } catch (err) {
      console.error('Error rejecting business:', err);
      alert('An error occurred while rejecting the business');
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter businesses based on approval status
  const pendingBusinesses = businesses.filter(business => !business.is_approved);
  const approvedBusinesses = businesses.filter(business => business.is_approved);

  // Get the currently displayed businesses based on tab
  const displayedBusinesses = tabValue === 0 ? businesses : 
                             tabValue === 1 ? pendingBusinesses : 
                             approvedBusinesses;

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
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="business tabs">
          <Tab label="All Businesses" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Pending Approval
                {pendingBusinesses.length > 0 && (
                  <Chip 
                    label={pendingBusinesses.length} 
                    color="error" 
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            } 
          />
          <Tab label="Approved" />
        </Tabs>
      </Box>

      {displayedBusinesses.length === 0 ? (
        <Alert severity="info">
          {tabValue === 0 ? "No businesses found." : 
           tabValue === 1 ? "No pending businesses." : 
           "No approved businesses."}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {displayedBusinesses.map((business) => (
            <Grid item xs={12} sm={6} md={4} key={business.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="div">
                      {business.name}
                    </Typography>
                    {business.is_approved ? (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Approved" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        icon={<HourglassEmpty />} 
                        label="Pending" 
                        color="warning" 
                        size="small" 
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Business ID: {business.id}
                  </Typography>
                  {business.owner_id && (
                    <Typography variant="body2" color="text.secondary">
                      Owner ID: {business.owner_id}
                    </Typography>
                  )}
                </CardContent>
                <Divider />
                <CardActions>
                  {business.is_approved && (
                    <Button size="small" color="primary">
                      View Rewards
                    </Button>
                  )}
                  {user && user.is_superuser && !business.is_approved && (
                    <>
                      <Button 
                        size="small" 
                        color="success" 
                        onClick={() => handleApproveBusiness(business.id)}
                        startIcon={<CheckCircle />}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleRejectBusiness(business.id)}
                        startIcon={<Cancel />}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {user && user.is_superuser && business.is_approved && (
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
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BusinessList;
