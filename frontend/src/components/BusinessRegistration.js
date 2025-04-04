import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

const BusinessRegistrationPage = () => {
  const [businessName, setBusinessName] = useState('');

  const handleInputChange = (event) => {
    setBusinessName(event.target.value);
  };

  const handleRegisterBusiness = async () => {
    const response = await fetch('http://localhost:8000/businesses/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: businessName,
      }),
    });

    if (response.ok) {
      alert('Business created successfully!');
      // Optionally redirect to the business management page
    } else {
      alert('Failed to create business');
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Register a New Business
      </Typography>
      <TextField
        label="Business Name"
        variant="outlined"
        fullWidth
        value={businessName}
        onChange={handleInputChange}
        sx={{ marginBottom: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleRegisterBusiness}
      >
        Register Business
      </Button>
    </Box>
  );
};

export default BusinessRegistrationPage;
