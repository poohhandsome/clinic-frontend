// src/components/NewSidebar.jsx (CREATE NEW FILE)

import React, { useState } from 'react';
import { LuCalendarPlus, LuCalendarCheck, LuSettings } from 'lucide-react';

// Sub-component for each menu item for cleaner code
const NavItem = ({ icon, text, hasDropdown, isOpen, onClick, children }) => {
    return (
        <li className="relative">
            <a
                href={hasDropdown ? '#' : text.replace(/\s+/g, '-').toLowerCase()}
                onClick={onClick}
                className="flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-sky-100 transition-colors duration-200"
            >
                {icon}
                <span className="ml-4 font-semibold transition-opacity duration-200">{text}</span>
                {hasDropdown && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}><path d="m9 18 6-6-6-6"/></svg>
                )}
            </a>
            {hasDropdown && isOpen && (
                <ul className="pl-8 pt-1 transition-all duration-300">
                    {children}
                </ul>
            )}
        </li>
    );
};

const DropdownLink = ({ href, text }) => (
    <li>
        <a href={href} className="flex items-center p-2 text-sm rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            {text}
        </a>
    </li>
);

export default function NewSidebar() {
    const [openDropdown, setOpenDropdown] = useState(''); // To control which dropdown is open

    const handleDropdownClick = (menuName) => {
        setOpenDropdown(prev => (prev === menuName ? '' : menuName));
    };

    return (
        <aside className="fixed top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-sm z-40">
            <nav className="h-full flex flex-col">
                {/* Placeholder for Logo if needed, aligned with header height */}
                <div className="h-16 shrink-0"></div> 
                
                <ul className="p-3">
                    {/* Add Manual Appointment */}
                    <NavItem
                        icon={<LuCalendarPlus size={24} className="text-sky-600" />}
                        text="Add Appointment"
                        href="#add-manual-appointment"
                        onClick={(e) => {
                            e.preventDefault(); 
                            window.location.hash = '#add-manual-appointment';
                        }}
                    />

                    {/* Online Appointment Dropdown */}
                    <NavItem
                        icon={<LuCalendarCheck size={24} className="text-sky-600" />}
                        text="Online Appointment"
                        hasDropdown
                        isOpen={openDropdown === 'online'}
                        onClick={(e) => {
                            e.preventDefault();
                            handleDropdownClick('online');
                        }}
                    >
                        <DropdownLink href="#pending" text="Pending List" />
                        <DropdownLink href="#confirmed" text="Confirmed List" />
                    </NavItem>

                    {/* Settings Dropdown */}
                    <NavItem
                        icon={<LuSettings size={24} className="text-sky-600" />}
                        text="Settings"
                        hasDropdown
                        isOpen={openDropdown === 'settings'}
                        onClick={(e) => {
                            e.preventDefault();
                            handleDropdownClick('settings');
                        }}
                    >
                        <DropdownLink href="#profile" text="Profile" />
                        <DropdownLink href="#schedules" text="Manage Schedules" />
                    </NavItem>
                </ul>
            </nav>
        </aside>
    );
}