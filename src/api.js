// src/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = () => localStorage.getItem('authToken');

const authorizedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (response.status === 401) {
        // Token is invalid or expired, log the user out
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.hash = '#login';
        window.location.reload();
        throw new Error('Session expired. Please log in again.');
    }

    return response;
};

export default authorizedFetch;