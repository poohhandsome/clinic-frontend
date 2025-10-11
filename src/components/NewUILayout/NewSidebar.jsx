// src/components/NewUILayout/NewSidebar.jsx (REPLACE)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForUser, getUserNavigationRole, getRoleDisplayName } from '../../config/rolePermissions';
import clinicLogo from '../../assets/clinic-logo.png';

const NavItem = ({ icon: Icon, text, active, isSidebarOpen, href }) => (
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
            <Icon size={20} />
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
    const { user } = useAuth();

    // Get navigation items based on user's role
    // Super admins see ALL items, doctors/nurses see only their items
    const navItems = getNavigationForUser(user);
    const userRole = getUserNavigationRole(user);
    const roleDisplayName = getRoleDisplayName(user);

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
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
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

            {/* Role Badge at bottom */}
            <div className={`px-3 py-4 border-t border-slate-200 ${!showSidebar && 'flex justify-center'}`}>
                {userRole === 'superAdmin' && (
                    <div className={`${showSidebar ? 'flex items-center' : 'flex justify-center'}`}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white ${!showSidebar && 'w-8 h-8 justify-center'}`}>
                            {showSidebar ? '👑 Super Admin' : '👑'}
                        </span>
                    </div>
                )}
                {userRole === 'doctor' && showSidebar && (
                    <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                            🩺 Doctor
                        </span>
                    </div>
                )}
                {userRole === 'nurse' && showSidebar && (
                    <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                            💼 Staff
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}