import axios from 'axios';

// Cliente HTTP genérico para tu futura API en IONOS
// Cambia esta URL cuando tengas tu VPS listo
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de Clerk en cada request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('clerk-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
