import React, { useState } from 'react';
import axios from 'axios';

const RewardForm = ({ businessId }) => {
  const [name, setName] = useState('');
  const [pointsRequired, setPointsRequired] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/rewards/', {
        name,
        points_required: pointsRequired,
        business_id: businessId,
      });
      alert('Reward added successfully');
      setName('');
      setPointsRequired(0);
    } catch (error) {
      alert('Error adding reward');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter reward name"
        required
      />
      <input
        type="number"
        value={pointsRequired}
        onChange={(e) => setPointsRequired(Number(e.target.value))}
        placeholder="Enter points required"
        required
      />
      <button type="submit">Add Reward</button>
    </form>
  );
};

export default RewardForm;
