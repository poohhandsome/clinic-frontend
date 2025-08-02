
import React from 'react';
import { LayoutDashboard, Stethoscope, CalendarDays, UserRound, Syringe, Receipt, FlaskConical, BarChart3 } from 'lucide-react';
import clinicLogo from '../../assets/clinic-logo.png'; // Import the logo

const NavItem = ({ icon, text, active, isSidebarOpen }) => (
    <li>
        <a 
            href="#" 
            className={`flex items-center p-3 my-1 rounded-lg transition-colors
                ${active 
                    ? 'bg-sky-800 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
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
        </a>
    </li>
);

export default function NewSidebar({ isSidebarOpen, setIsSidebarOpen, currentPath }) {
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
        <aside 
            className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'w-[280px]' : 'w-20'}`}
        >
            {/* Logo and Clinic Name Section */}
            <div className="flex items-center justify-between h-16 p-4 border-b border-gray-700">
                <div className={`flex items-center overflow-hidden ${isSidebarOpen ? 'w-auto' : 'w-full'}`}>
                    <img src={clinicLogo} alt="Clinic Logo" className="h-10 w-auto rounded-md" />
                    <span 
                        className={`font-bold text-xl ml-3 whitespace-nowrap transition-opacity duration-300 
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Newtrend
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <ul>
                    {navItems.map(item => (
                        <NavItem 
                            key={item.id}
                            isSidebarOpen={isSidebarOpen}
                            icon={item.icon}
                            text={item.text}
                            active={currentPath === item.id}
                        />
                    ))}
                </ul>
            </nav>

            {/* User Profile / Footer Section */}
            <div className="p-4 border-t border-gray-700">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full p-2 text-gray-400 rounded-lg hover:bg-gray-700">
                    {isSidebarOpen ? 'Collapse' : 'Expand'}
                </button>
            </div>
        </aside>
    );
}
