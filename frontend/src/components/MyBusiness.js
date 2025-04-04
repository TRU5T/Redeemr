import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Business, CardGiftcard, Store, BarChart, HourglassEmpty } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyBusiness = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [business, setBusiness] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReward, setNewReward] = useState({
    name: '',
    points_required: 100
  });
  const [rewardErrors, setRewardErrors] = useState({});

  // Fetch the user's business
  useEffect(() => {
    const fetchUserBusiness = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Get the user's business
        const response = await fetch('http://localhost:8000/businesses/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 404) {
          // No business found for this user
          setBusiness(null);
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch business data');
        }
        
        const businessData = await response.json();
        setBusiness(businessData);
        
        // Fetch rewards for this business
        const rewardsResponse = await fetch(`http://localhost:8000/businesses/${businessData.id}/rewards/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          setRewards(rewardsData);
        }
      } catch (err) {
        console.error('Error fetching business data:', err);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserBusiness();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenRewardDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseRewardDialog = () => {
    setDialogOpen(false);
    setNewReward({ name: '', points_required: 100 });
    setRewardErrors({});
  };

  const handleRewardInputChange = (e) => {
    const { name, value } = e.target;
    setNewReward(prev => ({
      ...prev,
      [name]: name === 'points_required' ? parseInt(value, 10) : value
    }));
    
    // Clear error if any
    if (rewardErrors[name]) {
      setRewardErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateRewardForm = () => {
    const errors = {};
    
    if (!newReward.name.trim()) {
      errors.name = 'Reward name is required';
    }
    
    if (!newReward.points_required || newReward.points_required <= 0) {
      errors.points_required = 'Points required must be greater than 0';
    }
    
    setRewardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateReward = async () => {
    if (!validateRewardForm()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/rewards/?name=${encodeURIComponent(newReward.name)}&points_required=${newReward.points_required}&business_id=${business.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const createdReward = await response.json();
        setRewards(prev => [...prev, createdReward]);
        handleCloseRewardDialog();
      } else {
        const errorData = await response.json();
        console.error('Failed to create reward:', errorData);
        setRewardErrors({ form: errorData.detail || 'Failed to create reward' });
      }
    } catch (err) {
      console.error('Error creating reward:', err);
      setRewardErrors({ form: 'An error occurred' });
    }
  };

  // If no business exists, show creation UI
  const renderNoBusinessState = () => (
    <Box sx={{ padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
        <Business sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          No Business Found
        </Typography>
        <Typography variant="body1" paragraph>
          You don't have a business registered yet. Create one to start offering rewards to your customers.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<Add />}
          onClick={() => navigate('/dashboard')}
        >
          Register New Business
        </Button>
      </Paper>
    </Box>
  );

  // If business is pending approval, show waiting state
  const renderPendingApprovalState = () => (
    <Box sx={{ padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
        <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Business Pending Approval
        </Typography>
        <Typography variant="body1" paragraph>
          Your business "{business.name}" is pending approval from an administrator.
          You'll be able to manage your business once it's approved.
        </Typography>
        <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
          The approval process typically takes 1-2 business days. Please check back later.
        </Alert>
      </Paper>
    </Box>
  );

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // If no business is found, show creation UI
  if (!business) {
    return renderNoBusinessState();
  }

  // If business is not approved, show pending state
  if (!business.is_approved) {
    return renderPendingApprovalState();
  }

  // Business dashboard UI
  return (
    <Box sx={{ padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Store sx={{ fontSize: 60, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              {business.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Business Dashboard
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Overview" />
            <Tab label="Rewards" />
            <Tab label="Transactions" />
          </Tabs>
        </Box>
        
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Business Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Name:</strong> {business.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>ID:</strong> {business.id}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rewards
                  </Typography>
                  <Typography variant="h3" align="center" sx={{ mt: 2 }}>
                    {rewards.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => setTabValue(1)}
                  >
                    Manage Rewards
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h3" align="center" sx={{ mt: 2 }}>
                    0
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => setTabValue(2)}
                  >
                    View Transactions
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Analytics
                    </Typography>
                    <BarChart sx={{ color: 'primary.main' }} />
                  </Box>
                  <Alert severity="info">
                    Analytics features will be available soon.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Rewards Tab */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Rewards Management
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={handleOpenRewardDialog}
              >
                Create Reward
              </Button>
            </Box>
            
            {rewards.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No rewards found. Create your first reward to get started.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {rewards.map(reward => (
                  <Grid item xs={12} sm={6} md={4} key={reward.id}>
                    <Card>
                      <CardContent>
                        <CardGiftcard sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                          {reward.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Points Required:</strong> {reward.points_required}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" color="primary">
                          Edit
                        </Button>
                        <Button size="small" color="error">
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
        
        {/* Transactions Tab */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Recent Transactions
            </Typography>
            <Alert severity="info">
              No transactions found. Transactions will appear here when customers redeem rewards.
            </Alert>
          </Box>
        )}
      </Paper>
      
      {/* Create Reward Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseRewardDialog}>
        <DialogTitle>Create New Reward</DialogTitle>
        <DialogContent>
          {rewardErrors.form && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rewardErrors.form}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Reward Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newReward.name}
            onChange={handleRewardInputChange}
            error={!!rewardErrors.name}
            helperText={rewardErrors.name}
          />
          <TextField
            margin="dense"
            id="points_required"
            name="points_required"
            label="Points Required"
            type="number"
            fullWidth
            variant="outlined"
            value={newReward.points_required}
            onChange={handleRewardInputChange}
            error={!!rewardErrors.points_required}
            helperText={rewardErrors.points_required}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRewardDialog}>Cancel</Button>
          <Button onClick={handleCreateReward} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBusiness; 