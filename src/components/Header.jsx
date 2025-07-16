// src/components/Header.jsx (Updated)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth(); // <-- Get logout from context

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        setIsOpen(false);
    }

    return (
        <div className="header-nav-dropdown">
            <button onClick={() => setIsOpen(!isOpen)}>
                Menu &#9662;
            </button>
            {isOpen && (
                <div className="header-nav-dropdown-menu">
                    <a href="#dashboard" onClick={() => setIsOpen(false)}>Dashboard</a>
                    <a href="#pending" onClick={() => setIsOpen(false)}>Unconfirmed List</a>
                    <a href="#confirmed" onClick={() => setIsOpen(false)}>Confirmed List</a>
                    <a href="#schedules" onClick={() => setIsOpen(false)}>Doctor Schedule Setting</a>
                    <a href="#login" onClick={handleLogout}>Logout</a>
                </div>
            )}
        </div>
    );
};

export default function Header({ clinics, selectedClinic, onClinicChange }) {
    const { user } = useAuth(); // <-- Get user from context

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-logo">Newtrend <span>Dental</span></div>
                <div className="header-user">| &nbsp; {user.username}</div>
                <div className="header-clinic-select">
                    | &nbsp; Clinic:
                    <select value={selectedClinic} onChange={e => onClinicChange(e.target.value)}>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                        ))}
                    </select>
                </div>
                <div className="header-nav-dropdown">
                    | <NavDropdown />
                </div>
            </div>
            <div className="header-right">
                <div className="header-profile">{user.username.charAt(0).toUpperCase()}</div>
            </div>
        </header>
    );
}
