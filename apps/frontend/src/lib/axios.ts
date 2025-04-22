import axios from 'axios';

const axiosInstance = axios.create({
  // Reads the base URL from the environment variable
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // Example: Get token from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance; 