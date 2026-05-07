import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {/* ignore */}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Request failed';
    if (err.response?.status === 401) {
      localStorage.removeItem('auth');
      // Avoid infinite loops if already on login page
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => (window.location.href = '/login'), 800);
      }
    } else if (err.response?.status >= 400) {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export default api;
