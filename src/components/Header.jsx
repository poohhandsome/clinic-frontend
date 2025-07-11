
import React from 'react';

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
            </div>
            <div className="header-right">
                <div className="header-profile">W</div>
            </div>
        </header>
    );
}
