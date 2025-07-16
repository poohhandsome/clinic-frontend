// src/components/LoginPage.jsx (Updated)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth(); // <-- Get the login function from context

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // We use authorizedFetch here for consistency, though it's not strictly needed for login
            const response = await authorizedFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }
            // The login function from context handles everything
            login(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Worker Login</h2>
                {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
                <div>
                    <label htmlFor="username">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="primary" style={{width: '100%'}} disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}