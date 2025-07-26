// src/components/Header.jsx (REPLACE)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        setIsOpen(false);
    };

    const linkClass = "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 font-semibold text-gray-600 hover:text-sky-700"
            >
                Menu
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1 z-30">
                    <a href="#dashboard" onClick={() => setIsOpen(false)} className={linkClass}>Dashboard</a>
                    <a href="#pending" onClick={() => setIsOpen(false)} className={linkClass}>Unconfirmed List</a>
                    <a href="#confirmed" onClick={() => setIsOpen(false)} className={linkClass}>Confirmed List</a>
                    <a href="#schedules" onClick={() => setIsOpen(false)} className={linkClass}>Doctor Schedules</a>
                    <div className="my-1 h-px bg-gray-200" />
                    <a href="#login" onClick={handleLogout} className={linkClass}>Logout</a>
                </div>
            )}
        </div>
    );
};

export default function Header({ clinics, selectedClinic, onClinicChange }) {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-slate-200 flex items-center justify-between px-6 h-16 z-20 shrink-0">
            <div className="flex items-center gap-6">
                {/* THIS IS THE FIX: Wrapped the logo in an <a> tag */}
                <a href="#dashboard" className="text-xl font-bold text-slate-800 no-underline">
                    Newtrend <span className="text-sky-600">Dental</span>
                </a>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                    <div className="border-l border-slate-200 pl-6 flex items-center gap-2">
                        <span>Clinic:</span>
                        <select
                            value={selectedClinic}
                            onChange={e => onClinicChange(e.target.value)}
                            className="border-none font-semibold text-slate-700 bg-transparent cursor-pointer p-1 -ml-1 focus:ring-2 focus:ring-sky-500 rounded-md"
                        >
                            {clinics.map(clinic => (
                                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="border-l border-slate-200 pl-6">
                        <NavDropdown />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}