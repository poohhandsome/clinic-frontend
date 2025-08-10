// src/components/NewUILayout/NewHeader.jsx (REPLACE)

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Search, Settings, Menu, CalendarCheck2, CalendarArrowDown } from 'lucide-react';
import { CgMenuGridO } from 'react-icons/cg';
import { FaUserDoctor } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import authorizedFetch from '../../api'; // Import authorizedFetch to get clinic list

const AppMenu = ({ setIsAppMenuOpen, pendingCount }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsAppMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsAppMenuOpen]);

    const menuLinkClass = "flex items-center gap-3 p-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100";

    return (
        <div ref={menuRef} className="absolute top-14 right-4 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50">
            <ul className="space-y-1">
                <li>
                    <a href="#/nurse/doctors" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <FaUserDoctor className="text-slate-500" size={18} />
                        Doctor Schedule
                    </a>
                </li>
                <li>
                    <a href="#/nurse/pending" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <CalendarArrowDown className="text-slate-500" size={18} />
                        <span className="flex-1">Pending List</span>
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </a>
                </li>
                <li>
                    <a href="#/nurse/confirmed" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <CalendarCheck2 className="text-slate-500" size={18} />
                        Confirmed List
                    </a>
                </li>
            </ul>
        </div>
    );
};

// --- Clinic Dropdown Component ---
const ClinicSwitcher = ({ selectedClinic }) => {
    const [allClinics, setAllClinics] = useState([]);

    useEffect(() => {
        authorizedFetch('/api/clinics')
            .then(res => res.json())
            .then(setAllClinics);
    }, []);

    const handleClinicChange = (e) => {
        const newClinicId = e.target.value;
        localStorage.setItem('selectedClinic', newClinicId);
        window.location.reload();
    };

    return (
        <select
            value={selectedClinic}
            onChange={handleClinicChange}
            className="border-none font-semibold text-slate-700 bg-transparent cursor-pointer p-2 -ml-2 focus:ring-2 focus:ring-sky-500 rounded-md appearance-none"
        >
            {allClinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
        </select>
    );
};


export default function NewHeader({ currentDate, setCurrentDate, pendingCount, selectedClinicName, isSidebarOpen, setIsSidebarOpen }) {
    const { user } = useAuth();
    const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
    
    // Get the selected clinic ID from localStorage for the switcher
    const selectedClinicId = Number(localStorage.getItem('selectedClinic'));

    return (
        <header className="relative bg-white flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 z-30 border-b border-slate-200">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                >
                    <Menu size={22} />
                </button>

                 <div className="hidden md:flex items-center gap-2">
                    {/* THE FIX IS HERE: Replaced the button with the ClinicSwitcher component */}
                    <ClinicSwitcher selectedClinic={selectedClinicId} />
                    
                    <h2 className="text-lg font-medium text-slate-600 ml-2">
                        {format(currentDate, 'MMMM d, yyyy')}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><Search size={20} /></button>
                <a href="#/nurse/settings" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                    <Settings size={20} />
                </a>
                
                <button 
                    onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                    <CgMenuGridO size={20} />
                    {pendingCount > 0 && (
                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                </button>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>
            
            {isAppMenuOpen && <AppMenu setIsAppMenuOpen={setIsAppMenuOpen} pendingCount={pendingCount} />}
        </header>
    );
}