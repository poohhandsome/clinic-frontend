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
        // Check if this is a password verification error (not session expiry)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const clonedResponse = response.clone();
            try {
                const errorData = await clonedResponse.json();
                // If error is about incorrect password, don't log out
                if (errorData.message && errorData.message.toLowerCase().includes('password')) {
                    return response; // Return response, let component handle it
                }
            } catch (e) {
                // If can't parse JSON, continue with normal 401 handling
            }
        }

        // Session expired - log out
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.hash = '#login';
        window.location.reload();
        throw new Error('Session expired. Please log in again.');
    }

    return response;
};

export default authorizedFetch;