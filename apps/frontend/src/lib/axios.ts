import axios from 'axios';

const axiosInstance = axios.create({
  // Reads the base URL from the environment variable
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  withCredentials: true, // Rely on this to send the httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});


export default axiosInstance; 