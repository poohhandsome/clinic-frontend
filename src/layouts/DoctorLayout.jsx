// src/layouts/DoctorLayout.jsx (NEW FILE)

import React from 'react';

// This is a simple layout wrapper for pages that DON'T need the main sidebar and header.
export default function DoctorLayout({ children }) {
    return (
        <div className="h-screen bg-slate-50">
            {children}
        </div>
    );
}