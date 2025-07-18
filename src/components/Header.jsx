// src/components/Header.jsx (REPLACE)

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();
    const dropdownRef = useRef(null);

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="font-semibold text-slate-600 hover:text-sky-600 flex items-center gap-1">
                Menu
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1">
                    <a href="#dashboard" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dashboard</a>
                    <a href="#pending" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Unconfirmed List</a>
                    <a href="#confirmed" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Confirmed List</a>
                    <a href="#schedules" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Doctor Schedules</a>
                    <div className="border-t my-1"></div>
                    <a href="#login" onClick={handleLogout} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Logout</a>
                </div>
            )}
        </div>
    );
};

export default function Header({ clinics, selectedClinic, onClinicChange }) {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-slate-200 flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-6">
                <div className="text-xl font-bold text-slate-800">
                    Newtrend<span className="text-sky-600">Dental</span>
                </div>
                <div className="flex items-center gap-6 border-l border-slate-200 pl-6 h-8">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Clinic:</span>
                        <select value={selectedClinic} onChange={e => onClinicChange(e.target.value)} className="w-auto border-none !py-1 !px-2 font-semibold !ring-0 focus:!ring-0">
                            {clinics.map(clinic => (
                                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                            ))}
                        </select>
                    </div>
                    <NavDropdown />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                <div className="w-10 h-10 bg-sky-100 text-sky-700 font-bold flex items-center justify-center rounded-full text-lg">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}