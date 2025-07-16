// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import authorizedFetch from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Your backend doesn't have a /profile endpoint, so we will get the user from localStorage
            // In a real-world scenario, you would add a /profile endpoint to verify the token
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // If no user but token exists, something is wrong. Log out.
                localStorage.removeItem('authToken');
                setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const login = (userData, authToken) => {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData)); // Also store user info
        setToken(authToken);
        setUser(userData);
        window.location.hash = '#dashboard';
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        window.location.hash = '#login';
    };

    const value = { user, token, login, logout, isAuthenticated: !!user };

    if (isLoading) {
        return <div>Loading application...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}