import React from 'react';
import { LayoutDashboard, Stethoscope, CalendarDays, UserRound, Syringe, Receipt, FlaskConical, BarChart3 } from 'lucide-react';

const NavItem = ({ icon, text, active, isSidebarOpen }) => (
    <li className={`relative flex items-center py-3 px-4 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? 'bg-gradient-to-tr from-sky-200 to-sky-100 text-sky-800' : 'hover:bg-slate-200 text-slate-600'}`}>
        {icon}
        <span className={`overflow-hidden transition-all whitespace-nowrap ${isSidebarOpen ? 'w-40 ml-3' : 'w-0'}`}>{text}</span>
        {!isSidebarOpen && (
            <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-sky-100 text-sky-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap">
                {text}
            </div>
        )}
    </li>
);

export default function NewSidebar({ isSidebarOpen, setIsSidebarOpen, currentPath }) {
    // 1. Icons are now size 16 (approx 30% smaller than 20)
    // 2. "Doctors Management" is now "Doctors"
    const navItems = [
        { id: '#dashboard', text: 'Doctor Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: '#clinic-dashboard', text: 'Clinic Dashboard', icon: <Stethoscope size={16} /> },
        { id: '#appointments', text: 'Appointments', icon: <CalendarDays size={16} /> },
        { id: '#doctors', text: 'Doctors', icon: <UserRound size={16} /> },
        { id: '#treatments', text: 'Treatments', icon: <Syringe size={16} /> },
        { id: '#billing', text: 'Billing', icon: <Receipt size={16} /> },
        { id: '#lab-costs', text: 'Lab Costs', icon: <FlaskConical size={16} /> },
        { id: '#summary', text: 'Summary', icon: <BarChart3 size={16} /> },
    ];

    return (
        <nav className={`h-screen flex flex-col bg-slate-100 border-r border-slate-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-60' : 'w-20'}`}>
            {/* 3. Header of sidebar now contains the logo and branding */}
            <div className="flex items-center p-4 h-16 border-b border-slate-200">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-lg hover:bg-slate-200">
                    <img src="http://googleusercontent.com/file_content/4" alt="Clinic Logo" className="w-9 h-9 rounded-full" />
                </button>
                <div className={`overflow-hidden transition-all ${isSidebarOpen ? 'w-auto ml-2' : 'w-0'}`}>
                    <a href="#dashboard" className="font-bold text-lg text-slate-800 no-underline whitespace-nowrap">
                        Newtrend <span className="text-sky-600">Dental</span>
                    </a>
                </div>
            </div>
            <ul className="flex-1 px-3 py-4">
                {navItems.map(item => (
                    <a href={item.id} key={item.id}>
                        <NavItem 
                            isSidebarOpen={isSidebarOpen}
                            icon={item.icon}
                            text={item.text}
                            active={currentPath === item.id}
                        />
                    </a>
                ))}
            </ul>
        </nav>
    );
}