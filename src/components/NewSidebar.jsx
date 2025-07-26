// src/components/NewSidebar.jsx (REPLACE)

import React, { useState } from 'react';
// THE FIX IS HERE: Corrected the icon names from LuCalendarPlus to CalendarPlus, etc.
import { CalendarPlus, CalendarCheck, Settings } from 'lucide-react';

// Sub-component for each menu item for cleaner code
const NavItem = ({ icon, text, href, hasDropdown, isOpen, onClick, children }) => {
    return (
        <li className="relative">
            <a
                href={href}
                onClick={onClick}
                className="flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-sky-100 transition-colors duration-200 group"
            >
                <span className="text-sky-700 group-hover:text-sky-800">{icon}</span>
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

    const handleDropdownClick = (e, menuName) => {
        e.preventDefault();
        setOpenDropdown(prev => (prev === menuName ? '' : menuName));
    };

    return (
        <aside className="fixed top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-sm z-40 w-[6.5rem] hover:w-64 transition-all duration-300 group overflow-hidden">
             <nav className="h-full flex flex-col">
                <div className="h-16 shrink-0 flex items-center px-6">
                    {/* You can add a small icon/logo here for the collapsed state */}
                </div> 
                
                <ul className="p-3">
                    {/* Add Manual Appointment */}
                    <NavItem
                        icon={<CalendarPlus size={24} />}
                        text="Add Appointment"
                        href="#add-manual-appointment"
                    />

                    {/* Online Appointment Dropdown */}
                    <NavItem
                        icon={<CalendarCheck size={24} />}
                        text="Online Appointment"
                        href="#"
                        hasDropdown
                        isOpen={openDropdown === 'online'}
                        onClick={(e) => handleDropdownClick(e, 'online')}
                    >
                        <DropdownLink href="#pending" text="Pending List" />
                        <DropdownLink href="#confirmed" text="Confirmed List" />
                    </NavItem>

                    {/* Settings Dropdown */}
                    <NavItem
                        icon={<Settings size={24} />}
                        text="Settings"
                        href="#"
                        hasDropdown
                        isOpen={openDropdown === 'settings'}
                        onClick={(e) => handleDropdownClick(e, 'settings')}
                    >
                        <DropdownLink href="#profile" text="Profile" />
                        <DropdownLink href="#schedules" text="Manage Schedules" />
                    </NavItem>
                </ul>
            </nav>
        </aside>
    );
}