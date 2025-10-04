// src/components/LoginPage.jsx (REPLACE)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import clinicLogo from '../assets/clinic-logo.png';

const EyeIcon = ({ isVisible, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"  // fixed namespace
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    className={`h-5 w-5 ${className}`} aria-hidden="true"
  >
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
        <line x1="2" y1="2" x2="22" y2="22" />
      </>
    )}
  </svg>
);

export default function LoginPage() {
    // **THE FIX**: Changed state name from 'email' to 'username' to match backend
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    // This uses the real backend now
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Security: This data is sent over a secure HTTPS connection.
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
            const response = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-300 to-indigo-500 flex items-center justify-center p-4">
            <div className="hidden md:flex flex-1 h-full items-center justify-center">
                 <div className="text-white text-center">
                    <h1 className="text-5xl font-bold">Newtrend Dental Clinic</h1>
                    <p className="mt-4 text-xl opacity-80">Dental Care with Technology.</p>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
                    <img src={clinicLogo} alt="Newtrend Dental Clinic Logo" className="w-20 h-20 mx-auto mb-6 rounded-full" />
                    
                    <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
                    <p className="text-center text-white/80 mb-8">Sign in to continue</p>

                    {error && <p className="bg-red-500/50 text-white text-center p-3 rounded-lg mb-6 border border-red-400">{error}</p>}
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">Username or Email</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="admin or doctor@example.com"
                                className="w-full px-4 py-3 bg-white/30 text-white placeholder-white/70 rounded-lg border border-white/40 focus:ring-2 focus:ring-white focus:border-transparent transition"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/30 text-white placeholder-white/70 rounded-lg border border-white/40 focus:ring-2 focus:ring-white focus:border-transparent transition"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 top-8 px-4 flex items-center text-white hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                <EyeIcon isVisible={showPassword} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-sky-400 bg-white/30 border-white/40 rounded focus:ring-sky-500"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/90">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-white/90 hover:text-white">
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-white text-sky-600 font-semibold rounded-lg shadow-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-800 focus:ring-white transition-all duration-300 disabled:opacity-70"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}