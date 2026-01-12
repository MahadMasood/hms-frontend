import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', // Your Node.js Backend URL
});

// Interceptor: Add Token to every request automatically
API.interceptors.request.use((req) => {
  const token = Cookies.get('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;