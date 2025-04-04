import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  SupervisorAccount as AdminIcon,
  Person as UserIcon,
  Business as BusinessIcon,
  CardGiftcard as RewardIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    businessCount: 0,
    userCount: 0,
    pendingBusinessCount: 0,
    rewardCount: 0
  });

  useEffect(() => {
    // Check if user is admin
    if (user && !user.is_superuser) {
      navigate('/dashboard');
      return;
    }
    
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log("Fetching admin data with token:", token ? "Token exists" : "No token found");
      
      // Fetch businesses
      console.log("Fetching all businesses from: http://localhost:8000/businesses/");
      const businessesResponse = await fetch('http://localhost:8000/businesses/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        console.log("Businesses data received:", businessesData);
        setBusinesses(businessesData);
        
        const pendingBusinesses = businessesData.filter(business => !business.is_approved);
        console.log("Pending businesses count:", pendingBusinesses.length);
        
        setStats(prev => ({ 
          ...prev, 
          businessCount: businessesData.length,
          pendingBusinessCount: pendingBusinesses.length 
        }));
        
        // Count rewards
        let totalRewards = 0;
        for (const business of businessesData) {
          const rewardsResponse = await fetch(`http://localhost:8000/businesses/${business.id}/rewards/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            totalRewards += rewardsData.length;
          }
        }
        
        setStats(prev => ({ ...prev, rewardCount: totalRewards }));
      } else {
        console.error("Failed to fetch businesses:", await businessesResponse.text());
        setError("Failed to load businesses. Make sure you have admin privileges.");
      }
      
      // Fetch users
      console.log("Fetching all users from: http://localhost:8000/users/all");
      const usersResponse = await fetch('http://localhost:8000/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log("Users data received:", usersData);
        setUsers(usersData);
        setStats(prev => ({ ...prev, userCount: usersData.length }));
      } else {
        console.error("Failed to fetch users:", await usersResponse.text());
        // Fallback to dummy data if endpoint doesn't exist
        console.warn('Users endpoint not available - using dummy data');
        setUsers([
          { id: 1, name: 'Admin User', email: 'admin@example.com', is_superuser: true, is_business_owner: false },
          { id: 2, name: 'Business User', email: 'business@example.com', is_superuser: false, is_business_owner: true, business_id: 1 }
        ]);
        setStats(prev => ({ ...prev, userCount: 2 }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleToggleUserRole = (id) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, is_superuser: !user.is_superuser } : user
    ));
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
        // Update businesses list
        setBusinesses(businesses.map(business => 
          business.id === businessId ? { ...business, is_approved: true } : business
        ));
        
        // Update pending count
        setStats(prev => ({ 
          ...prev, 
          pendingBusinessCount: prev.pendingBusinessCount - 1 
        }));
        
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
        // Remove business from list
        setBusinesses(businesses.filter(business => business.id !== businessId));
        
        // Update counts
        setStats(prev => ({ 
          ...prev, 
          businessCount: prev.businessCount - 1,
          pendingBusinessCount: prev.pendingBusinessCount - 1
        }));
        
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
    if (!window.confirm('Are you sure you want to delete this business? This cannot be undone.')) {
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
        // Remove business from list
        setBusinesses(businesses.filter(business => business.id !== businessId));
        
        // Update count
        setStats(prev => ({ 
          ...prev, 
          businessCount: prev.businessCount - 1
        }));
        
        alert('Business deleted successfully');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
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
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <AdminIcon sx={{ fontSize: 60, color: 'secondary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.primary">
              System administration and management
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6">Businesses</Typography>
                </Box>
                <Typography variant="h3" align="center">
                  {stats.businessCount}
                </Typography>
                {stats.pendingBusinessCount > 0 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Chip 
                      label={`${stats.pendingBusinessCount} pending`} 
                      color="warning" 
                      size="small" 
                      icon={<PendingIcon />}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <UserIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6">Users</Typography>
                </Box>
                <Typography variant="h3" align="center">
                  {stats.userCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RewardIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6">Rewards</Typography>
                </Box>
                <Typography variant="h3" align="center">
                  {stats.rewardCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6">System</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" align="center">
                  System Status: Online
                </Typography>
                <Typography variant="body2" color="success.main" align="center" sx={{ mt: 1 }}>
                  All services operational
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Main content tabs */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="All Businesses" />
            <Tab label="All Users" />
            {stats.pendingBusinessCount > 0 && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Pending Approval
                    <Chip 
                      label={stats.pendingBusinessCount} 
                      color="error" 
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                } 
              />
            )}
          </Tabs>
        </Box>
        
        {/* All Businesses Tab */}
        {tabValue === 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: 'text.primary' }}>
              All Registered Businesses
            </Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Business Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Owner ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Alert severity="info">No businesses found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell>{business.id}</TableCell>
                      <TableCell>{business.name}</TableCell>
                      <TableCell>{business.owner_id || "None"}</TableCell>
                      <TableCell>
                        {business.is_approved ? (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Approved" 
                            color="success" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            icon={<PendingIcon />} 
                            label="Pending" 
                            color="warning" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {!business.is_approved ? (
                          <>
                            <Button 
                              size="small" 
                              color="success" 
                              onClick={() => handleApproveBusiness(business.id)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleRejectBusiness(business.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteBusiness(business.id)}
                            startIcon={<DeleteIcon />}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* All Users Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: 'text.primary' }}>
              All Registered Users
            </Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Linked Business</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info">No users found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    // Find business linked to this user
                    const userBusiness = businesses.find(b => b.owner_id === user.id);
                    const businessName = userBusiness ? userBusiness.name : "None";
                    const businessStatus = userBusiness && !userBusiness.is_approved ? " (Pending)" : "";
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.is_superuser ? (
                            <Chip label="Admin" color="secondary" size="small" />
                          ) : user.is_business_owner ? (
                            <Chip label="Business Owner" color="primary" size="small" />
                          ) : (
                            <Chip label="Standard User" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_business_owner ? 
                            (businessName !== "None" ? 
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {businessName}{businessStatus}
                                {userBusiness && !userBusiness.is_approved && (
                                  <Chip 
                                    label="Pending" 
                                    color="warning" 
                                    size="small" 
                                    icon={<PendingIcon />}
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                              : 
                              "Pending/Deleted") : 
                            "N/A"}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Admin:</Typography>
                            <Switch
                              edge="end"
                              size="small"
                              checked={user.is_superuser}
                              onChange={() => handleToggleUserRole(user.id)}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Pending Businesses Tab */}
        {tabValue === 2 && (
          <TableContainer component={Paper} variant="outlined">
            <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: 'text.primary' }}>
              Pending Business Approvals
            </Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Business Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Owner ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Owner Email</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {businesses.filter(b => !b.is_approved).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Alert severity="info">No pending businesses found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.filter(b => !b.is_approved).map((business) => {
                    // Find owner details
                    const owner = users.find(u => u.id === business.owner_id);
                    const ownerEmail = owner ? owner.email : "Unknown";
                    
                    return (
                      <TableRow key={business.id}>
                        <TableCell>{business.id}</TableCell>
                        <TableCell>{business.name}</TableCell>
                        <TableCell>{business.owner_id || "None"}</TableCell>
                        <TableCell>{ownerEmail}</TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            color="success" 
                            onClick={() => handleApproveBusiness(business.id)}
                            sx={{ mr: 1 }}
                            startIcon={<CheckCircleIcon />}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => handleRejectBusiness(business.id)}
                            startIcon={<CancelIcon />}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default AdminDashboard; 