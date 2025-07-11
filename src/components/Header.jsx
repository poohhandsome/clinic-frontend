
/* -------------------------------------------------- */
/* FILE 3: src/components/Header.jsx (REPLACE)        */
/* -------------------------------------------------- */

import React, { useState } from 'react';

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="header-nav-dropdown">
            <button onClick={() => setIsOpen(!isOpen)}>
                Menu &#9662;
            </button>
            {isOpen && (
                <div className="header-nav-dropdown-menu">
                    <a href="#pending" onClick={() => setIsOpen(false)}>Unconfirmed List</a>
                    <a href="#confirmed" onClick={() => setIsOpen(false)}>Confirmed List</a>
                    <a href="#schedules" onClick={() => setIsOpen(false)}>Doctor Schedule Setting</a>
                </div>
            )}
        </div>
    );
};

export default function Header({ clinics, selectedClinic, onClinicChange }) {
    return (
        <header className="header">
            <div className="header-left">
                <div className="header-logo">Newtrend <span>Dental</span></div>
                <div className="header-user">| &nbsp; Username</div>
                <div className="header-clinic-select">
                    | &nbsp; Clinic:
                    <select value={selectedClinic} onChange={e => onClinicChange(e.target.value)}>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                        ))}
                    </select>
                </div>
                <div className="header-nav-dropdown">
                    | <NavDropdown />
                </div>
            </div>
            <div className="header-right">
                <div className="header-profile">W</div>
            </div>
        </header>
    );
}