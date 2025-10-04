// src/layouts/DoctorLayout.jsx

import React, { useState } from 'react';
import NewHeader from '../components/NewUILayout/NewHeader';

export default function DoctorLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            <NewHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
}