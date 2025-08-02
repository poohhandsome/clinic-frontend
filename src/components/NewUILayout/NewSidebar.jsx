import React from 'react';
import { LayoutDashboard, Stethoscope, CalendarDays, UserMd, Syringe, FileInvoiceDollar, FlaskConical, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const NavItem = ({ icon, text, active, isSidebarOpen }) => (
    <li className={`relative flex items-center py-3 px-4 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? 'bg-gradient-to-tr from-sky-200 to-sky-100 text-sky-800' : 'hover:bg-slate-200 text-slate-600'}`}>
        {icon}
        <span className={`overflow-hidden transition-all ${isSidebarOpen ? 'w-40 ml-3' : 'w-0'}`}>{text}</span>
        {!isSidebarOpen && (
            <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-sky-100 text-sky-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                {text}
            </div>
        )}
    </li>
);

export default function NewSidebar({ isSidebarOpen, setIsSidebarOpen, currentPath }) {
    const navItems = [
        { id: '#dashboard', text: 'Doctor Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: '#clinic-dashboard', text: 'Clinic Dashboard', icon: <Stethoscope size={20} /> },
        { id: '#appointments', text: 'Appointments', icon: <CalendarDays size={20} /> },
        { id: '#doctors', text: 'Doctors Management', icon: <UserMd size={20} /> },
        { id: '#treatments', text: 'Treatments', icon: <Syringe size={20} /> },
        { id: '#billing', text: 'Billing', icon: <FileInvoiceDollar size={20} /> },
        { id: '#lab-costs', text: 'Lab Costs', icon: <FlaskConical size={20} /> },
        { id: '#summary', text: 'Summary', icon: <BarChart3 size={20} /> },
    ];

    return (
        <nav className={`h-screen flex flex-col bg-slate-100 border-r border-slate-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-60' : 'w-20'}`}>
            <div className="flex items-center justify-between p-4 h-16 border-b border-slate-200">
                <span className={`overflow-hidden font-bold text-lg ${isSidebarOpen ? 'w-32' : 'w-0'}`}>Newtrend</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-200">
                    {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                </button>
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