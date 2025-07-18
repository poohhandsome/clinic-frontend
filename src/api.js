// src/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

    // **THIS IS THE FINAL FIX**: This line cleans up the URL to prevent any double slashes.
    // It takes the base URL, removes any slash from the end, and then safely adds the path.
    const finalUrl = `${API_BASE_URL.replace(/\/$/, '')}${url}`;
    
    const response = await fetch(finalUrl, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.hash = '#login';
        window.location.reload();
        throw new Error('Session expired. Please log in again.');
    }

    return response;
};

export default authorizedFetch;