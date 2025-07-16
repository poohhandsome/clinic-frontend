// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // On initial load, try to get user data from localStorage
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // If there's a token but no user, the state is inconsistent. Log out.
                localStorage.removeItem('authToken');
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false);
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
