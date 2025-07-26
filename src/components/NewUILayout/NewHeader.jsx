// src/components/NewUILayout/NewHeader.jsx (REPLACE)

import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Settings, HelpCircle, Menu, CalendarCheck2, CalendarArrowDown } from 'lucide-react';
import { CgMenuGridO } from 'react-icons/cg';
import { FaUserDoctor } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';

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
                    <a href="#schedules" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <FaUserDoctor className="text-slate-500" size={18} />
                        Doctor Schedule
                    </a>
                </li>
                <li>
                    <a href="#pending" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <CalendarArrowDown className="text-slate-500" size={18} />
                        <span className="flex-1">Pending List</span>
                        {/* THE FIX: Badge with count inside the menu */}
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </a>
                </li>
                <li>
                    <a href="#confirmed" className={menuLinkClass} onClick={() => setIsAppMenuOpen(false)}>
                        <CalendarCheck2 className="text-slate-500" size={18} />
                        Confirmed List
                    </a>
                </li>
            </ul>
        </div>
    );
};


export default function NewHeader({ currentDate, setCurrentDate, isSidebarOpen, setIsSidebarOpen, pendingCount }) {
    const { user } = useAuth();
    const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
    
    return (
        <header className="relative bg-slate-50 flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 z-40">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-600"
                >
                    <Menu size={22} />
                </button>
                <a href="#dashboard" className="hidden sm:block text-xl font-bold text-slate-800 no-underline">
                    Newtrend <span className="text-sky-600">Dental</span>
                </a>
                <div className="hidden md:flex items-center gap-2">
                    <div className="w-px h-6 bg-slate-300 ml-2"></div>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-1.5 border border-slate-300 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                        Today
                    </button>
                    <button 
                        onClick={() => setCurrentDate(subDays(currentDate, 1))}
                        className="p-2 rounded-md hover:bg-slate-200 text-slate-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentDate(addDays(currentDate, 1))}
                        className="p-2 rounded-md hover:bg-slate-200 text-slate-500"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <h2 className="text-lg font-medium text-slate-600 ml-2">
                        {format(currentDate, 'MMMM d, yyyy')}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Search size={20} /></button>
                <button className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Settings size={20} /></button>
                
                <button 
                    onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-200 text-slate-500"
                >
                    <CgMenuGridO size={20} />
                    {/* THE FIX: Red dot notification on the grid icon */}
                    {pendingCount > 0 && (
                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-50"></span>
                    )}
                </button>

                <div className="w-px h-6 bg-slate-300 mx-2"></div>
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>
            
            {isAppMenuOpen && <AppMenu setIsAppMenuOpen={setIsAppMenuOpen} pendingCount={pendingCount} />}
        </header>
    );
}