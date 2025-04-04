import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/businesses/')
      .then(response => response.json())
      .then(data => setBusinesses(data));
  }, []);

  const handleDeleteBusiness = async (businessId) => {
    const response = await fetch(`http://localhost:8000/businesses/${businessId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Business deleted successfully!');
      setBusinesses(businesses.filter(business => business.id !== businessId));
    } else {
      alert('Failed to delete business');
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Registered Businesses
      </Typography>
      {businesses.length === 0 ? (
        <Typography>No businesses available.</Typography>
      ) : (
        businesses.map((business) => (
          <Box
            key={business.id}
            sx={{
              padding: 2,
              marginBottom: 2,
              border: '1px solid #ccc',
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6">{business.name}</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 1 }}
              onClick={() => alert(`Viewing rewards for ${business.name}`)}
            >
              View Rewards
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ marginTop: 1, marginLeft: 1 }}
              onClick={() => handleDeleteBusiness(business.id)}
            >
              Delete Business
            </Button>
          </Box>
        ))
      )}
    </Box>
  );
};

export default BusinessList;
