// src/components/LoginPage.jsx (Updated)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';

const EyeIcon = ({ closed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={closed ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"} />
        <circle cx="12" cy="12" r="3" style={{ display: closed ? 'none' : 'block' }} />
        <line x1="1" y1="1" x2="23" y2="23" style={{ display: closed ? 'block' : 'none' }} />
    </svg>
);

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await authorizedFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }
            login(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/30 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-2">Newtrend Admin</h2>
                <p className="text-center text-indigo-100 mb-8">Please sign in to continue</p>
                
                {error && <p className="bg-red-500/50 text-white text-center p-3 rounded-lg mb-4">{error}</p>}
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-indigo-100 mb-2">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-indigo-100 mb-2">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                id="password" 
                                className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button" 
                                className="absolute inset-y-0 right-0 px-4 flex items-center text-indigo-200"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <EyeIcon closed={showPassword} />
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-indigo-600 transition-all duration-300" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
