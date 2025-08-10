// src/api.js (REPLACE)

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

    // **THE FIX IS HERE**: This line cleans up the URL to prevent any double slashes
    // and ensures there's always one slash between the base URL and the path.
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