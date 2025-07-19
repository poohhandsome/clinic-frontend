// src/components/LoginPage.jsx (REPLACE)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';

const EyeIcon = ({ isVisible }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        {isVisible ? (
            <>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ) : (
            <>
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
            </>
        )}
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
            // **THE FIX IS HERE**: The path is now correctly set to '/api/login'
            const response = await authorizedFetch('/api/login', {
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
                    <p className="text-gray-500 mt-2">Please enter your credentials to access the admin dashboard.</p>
                </div>

                {error && <p className="bg-red-100 text-red-700 text-center p-3 rounded-md mb-4 border border-red-200">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-gray-700 sr-only">Username</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Username"
                            className="w-full px-4 py-3 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 sr-only">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 px-4 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            <EyeIcon isVisible={showPassword} />
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     {/* Note: These are for display purposes. Backend integration is needed for them to work. */}
                    <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.403 5.584A8.02 8.02 0 0012.02 4C7.59 4 4 7.59 4 12c0 1.96.713 3.75 1.88 5.118a7.994 7.994 0 01-1.35-3.668c0-1.838.648-3.535 1.72-4.87C7.29 7.132 8.944 6.22 10.887 6.012a8.03 8.03 0 005.516-.428z" clipRule="evenodd" /><path d="M12.02 4a8.002 8.002 0 017.98 7.5h.002c0 .285-.015.568-.043.847l-1.803-1.803A6.014 6.014 0 0012.02 6c-2.3 0-4.28 1.29-5.32 3.195l-1.84-1.84A7.962 7.962 0 0112.02 4z" /><path fillRule="evenodd" d="M10.12 17.118a7.993 7.993 0 01-4.79-1.35c-1.332-1.332-2-3.08-2-4.912 0-1.07.25-2.08.7-2.96L2.22 6.104A7.96 7.96 0 004.02 12c0 4.41 3.59 8 8 8 .92 0 1.802-.16 2.625-.453l-2.05-2.05a5.98 5.98 0 01-2.475.621z" clipRule="evenodd" /></svg>
                        <span className="ml-2">Google</span>
                    </button>
                    <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.165 6.737 9.535.49.09.667-.213.667-.472 0-.233-.008-.85-.013-1.667-2.782.605-3.369-1.343-3.369-1.343-.446-1.133-1.09-1.435-1.09-1.435-.89-.608.067-.595.067-.595.984.069 1.503 1.01 1.503 1.01.874 1.498 2.295 1.065 2.855.815.089-.633.342-1.065.62-1.31-2.18-.248-4.467-1.09-4.467-4.853 0-1.07.383-1.947 1.01-2.633-.101-.25-.438-1.246.096-2.6 0 0 .824-.264 2.7 1.007a9.42 9.42 0 014.912 0c1.876-1.271 2.7-1.007 2.7-1.007.535 1.354.2 2.35.096 2.6.627.686 1.01 1.563 1.01 2.633 0 3.773-2.29 4.605-4.475 4.845.352.305.665.91.665 1.832 0 1.31-.012 2.37-.012 2.693 0 .26.175.565.67.47C17.135 18.165 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
                        <span className="ml-2">GitHub</span>
                    </button>
                </div>

            </div>
        </div>
    );
}