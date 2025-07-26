// src/components/NewUILayout/NewHeader.jsx (REPLACE)

import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Settings, HelpCircle, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NewHeader({ currentDate, setCurrentDate, isSidebarOpen, setIsSidebarOpen }) {
    const { user } = useAuth();
    
    return (
        <header className="relative bg-slate-50 flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 z-40">
            {/* Left Side: Logo and Date Navigation */}
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

            {/* Right Side: Actions and User */}
            <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Search size={20} /></button>
                <button className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><HelpCircle size={20} /></button>
                <button className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Settings size={20} /></button>
                <div className="w-px h-6 bg-slate-300 mx-2"></div>
                <span className="text-sm font-medium text-slate-600">{user.username}</span>
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}