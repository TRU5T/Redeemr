import React, { useState } from 'react';
import axios from 'axios';

const BusinessForm = () => {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/businesses/', { name });
      alert('Business added successfully');
      setName('');
    } catch (error) {
      alert('Error adding business');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter business name"
        required
      />
      <button type="submit">Add Business</button>
    </form>
  );
};

export default BusinessForm;
