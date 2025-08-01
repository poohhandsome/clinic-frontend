// src/components/NewUILayout/NewSidebar.jsx (REPLACE)

import React, { useState } from 'react';
import { LayoutDashboard, Stethoscope, CalendarDays, UserRound, Syringe, Receipt, FlaskConical, BarChart3, User } from 'lucide-react'; // Added User icon
import clinicLogo from '../../assets/clinic-logo.png';

const NavItem = ({ icon, text, active, isSidebarOpen, href }) => (
    <li>
        <a 
            href={href}
            className={`flex items-center p-3 my-1 rounded-lg transition-colors group
                ${active 
                    ? 'bg-sky-100 text-sky-800 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-200'
                }
                ${!isSidebarOpen && 'justify-center'}`}
        >
            {icon}
            <span 
                className={`overflow-hidden transition-all whitespace-nowrap 
                    ${isSidebarOpen ? 'w-40 ml-3' : 'w-0'}`
                }
            >
                {text}
            </span>
            {!isSidebarOpen && (
                 <div className="absolute left-full rounded-md px-2 py-1 ml-4 bg-slate-800 text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                    {text}
                </div>
            )}
        </a>
    </li>
);

export default function NewSidebar({ isSidebarOpen, setIsSidebarOpen, currentPath }) {
    const [isHovering, setIsHovering] = useState(false);
    const showSidebar = isSidebarOpen || isHovering;

    const navItems = [
        { id: '#dashboard', text: 'Doctor Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: '#clinic-dashboard', text: 'Clinic Dashboard', icon: <Stethoscope size={20} /> },
        { id: '#appointments', text: 'Appointments', icon: <CalendarDays size={20} /> },
        { id: '#patients', text: 'Patients', icon: <User size={20} /> }, // <-- NEW PATIENTS LINK
        { id: '#doctors', text: 'Doctors', icon: <UserRound size={20} /> },
        { id: '#treatments', text: 'Treatments', icon: <Syringe size={20} /> },
        { id: '#billing', text: 'Billing', icon: <Receipt size={20} /> },
        { id: '#lab-costs', text: 'Lab Costs', icon: <FlaskConical size={20} /> },
        { id: '#summary', text: 'Summary', icon: <BarChart3 size={20} /> },
    ];

    return (
        <aside 
            className={`h-screen bg-white flex flex-col border-r border-slate-200
                transition-all duration-300 ease-in-out 
                ${showSidebar ? 'w-[280px]' : 'w-[64px]'}`
            }
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className={`flex items-center h-16 px-4 border-b border-slate-200 ${!showSidebar && 'justify-center'}`}>
                <img
                    src={clinicLogo}
                    alt="Clinic Logo"
                    className="h-10 w-10 rounded-md flex-shrink-0 object-contain"
                />
                {showSidebar && (
                    <span className="ml-3 font-bold text-xl whitespace-nowrap text-slate-800">
                        Newtrend
                    </span>
                )}
            </div>
            <nav className="flex-1 px-3 py-4">
                <ul>
                    {navItems.map(item => (
                        <NavItem 
                            key={item.id}
                            isSidebarOpen={showSidebar}
                            icon={item.icon}
                            text={item.text}
                            active={currentPath === item.id}
                            href={item.id}
                        />
                    ))}
                </ul>
            </nav>
        </aside>
    );
}