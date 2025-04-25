import axios from 'axios';

const axiosInstance = axios.create({
  // Reads the base URL from the environment variable
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  withCredentials: true, // Rely on this to send the httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove the interceptor - it's not suitable for httpOnly cookies
/*
declare module 'axios' {
  export interface AxiosRequestConfig {
    useAuthToken?: boolean;
  }
}
axiosInstance.interceptors.request.use((config) => {
  if (config.useAuthToken === true) {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  //delete config.useAuthToken; 
  return config;
});
*/

export default axiosInstance; 