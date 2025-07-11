
/* -------------------------------------------------- */
/* FILE 3: src/components/LoginPage.jsx (No Changes)  */
/* -------------------------------------------------- */

import React from 'react';

export default function LoginPage({ onLogin }) {
    const handleLogin = (e) => {
        e.preventDefault();
        // In a real app, you'd verify username/password
        onLogin();
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Worker Login</h2>
                <div>
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" defaultValue="worker" />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" defaultValue="password" />
                </div>
                <button type="submit" className="primary" style={{width: '100%'}}>Login</button>
            </form>
        </div>
    );
}