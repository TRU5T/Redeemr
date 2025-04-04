import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // This is your FastAPI backend
});

export default api;
