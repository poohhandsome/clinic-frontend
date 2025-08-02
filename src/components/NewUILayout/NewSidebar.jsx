
import React from 'react';
import { LayoutDashboard, Stethoscope, CalendarDays, UserRound, Syringe, Receipt, FlaskConical, BarChart3 } from 'lucide-react';
import clinicLogo from '../../assets/clinic-logo.png'; // Import the logo

const NavItem = ({ icon, text, active, isSidebarOpen, href }) => (
    <li>
        <a 
            href={href}
            className={`flex items-center p-3 my-1 rounded-lg transition-colors group
                ${active 
                    ? 'bg-sky-100 text-sky-800 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
        >
            {icon}
            <span 
                className={`overflow-hidden transition-all whitespace-nowrap 
                    ${isSidebarOpen ? 'w-40 ml-3' : 'w-0'}`
                }
            >
                {text}
            </span>
            {/* Tooltip for when sidebar is collapsed */}
            {!isSidebarOpen && (
                 <div className="absolute left-full rounded-md px-2 py-1 ml-4 bg-slate-800 text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                    {text}
                </div>
            )}
        </a>
    </li>
);

export default function NewSidebar({ isSidebarOpen, currentPath }) {
    const navItems = [
        { id: '#dashboard', text: 'Doctor Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: '#clinic-dashboard', text: 'Clinic Dashboard', icon: <Stethoscope size={20} /> },
        { id: '#appointments', text: 'Appointments', icon: <CalendarDays size={20} /> },
        { id: '#doctors', text: 'Doctors', icon: <UserRound size={20} /> },
        { id: '#treatments', text: 'Treatments', icon: <Syringe size={20} /> },
        { id: '#billing', text: 'Billing', icon: <Receipt size={20} /> },
        { id: '#lab-costs', text: 'Lab Costs', icon: <FlaskConical size={20} /> },
        { id: '#summary', text: 'Summary', icon: <BarChart3 size={20} /> },
    ];

    return (
        // 1. Reverted to light theme, keeping the responsive width
        <aside 
            className={`h-screen bg-white flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200
                ${isSidebarOpen ? 'w-[280px]' : 'w-20'}`}
        >
            {/* Logo and Clinic Name Section */}
            <div className="flex items-center h-16 px-4 border-b border-slate-200">
                <div className="flex items-center overflow-hidden">
                    <img src={clinicLogo} alt="Clinic Logo" className="h-10 w-10 flex-shrink-0 rounded-md" />
                    <span 
                        className={`font-bold text-xl ml-3 whitespace-nowrap transition-opacity duration-300 text-slate-800
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Newtrend
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4">
                <ul>
                    {navItems.map(item => (
                        <NavItem 
                            key={item.id}
                            isSidebarOpen={isSidebarOpen}
                            icon={item.icon}
                            text={item.text}
                            active={currentPath === item.id}
                            href={item.id} // Passing the href for the anchor tag
                        />
                    ))}
                </ul>
            </nav>

            {/* 2. The expand/collapse button at the bottom has been removed */}
        </aside>
    );
}
