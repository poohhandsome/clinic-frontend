// src/components/NewUILayout/NewHeader.jsx (REPLACE)

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Search, Settings, Menu, Home, ChevronsUpDown, LogOut } from 'lucide-react'; // Import LogOut icon
import { useAuth } from '../../context/AuthContext';
import authorizedFetch from '../../api';

// --- Custom Clinic Dropdown ---
const ClinicSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [allClinics, setAllClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const selectedClinicId = Number(localStorage.getItem('selectedClinic'));
        authorizedFetch('/api/clinics')
            .then(res => res.json())
            .then(clinics => {
                setAllClinics(clinics);
                setSelectedClinic(clinics.find(c => c.id === selectedClinicId) || null);
            });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClinicChange = (clinicId) => {
        localStorage.setItem('selectedClinic', clinicId);
        window.location.reload();
    };

    if (!selectedClinic) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
                <span>{selectedClinic.name}</span>
                <ChevronsUpDown size={16} className="text-slate-500" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50">
                    {allClinics.map(clinic => (
                        <button
                            key={clinic.id}
                            onClick={() => handleClinicChange(clinic.id)}
                            className="w-full text-left p-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            {clinic.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function NewHeader({ isSidebarOpen, setIsSidebarOpen }) {
    const { user, logout } = useAuth(); // Get the logout function from the context
    
    return (
        <header className="relative bg-white flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 z-30 border-b border-slate-200">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                >
                    <Menu size={22} />
                </button>

                <ClinicSwitcher />
                <a href="/#/" className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Home">
                    <Home size={20} />
                </a>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Search">
                    <Search size={20} />
                </button>
                <a href="#/nurse/settings" className="p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Settings">
                    <Settings size={20} />
                </a>
                
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                
                {/* --- NEW LOGOUT BUTTON --- */}
                <button onClick={logout} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}