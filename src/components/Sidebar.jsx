
/* -------------------------------------------------- */
/* FILE 4: src/components/Sidebar.jsx (NEW file)      */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';

const MiniCalendar = ({ currentDate, setCurrentDate }) => {
    const [activeMonth, setActiveMonth] = useState(currentDate);

    const firstDayOfMonth = startOfMonth(activeMonth);
    const lastDayOfMonth = endOfMonth(activeMonth);
    const firstDayOfCalendar = startOfWeek(firstDayOfMonth);
    const lastDayOfCalendar = endOfWeek(lastDayOfMonth);
    const days = eachDayOfInterval({ start: firstDayOfCalendar, end: lastDayOfCalendar });

    return (
        <div>
            <div className="mini-calendar-header">
                <button onClick={() => setActiveMonth(subMonths(activeMonth, 1))}>&lt;</button>
                <span>{format(activeMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setActiveMonth(addMonths(activeMonth, 1))}>&gt;</button>
            </div>
            <div className="mini-calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="day-name">{d}</div>)}
                {days.map(day => (
                    <div 
                        key={day.toString()} 
                        className={`day ${!isSameMonth(day, activeMonth) ? 'is-other-month' : ''} ${isSameDay(day, new Date()) ? 'is-today' : ''} ${isSameDay(day, currentDate) ? 'is-selected' : ''}`}
                        onClick={() => setCurrentDate(day)}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="settings-dropdown">
            {isOpen && (
                <div className="settings-dropdown-menu">
                    <a href="#pending">Pending Appointments</a>
                    <a href="#confirmed">Confirmed Appointments</a>
                    <a href="#schedules">Doctor Schedules</a>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)}>
                Settings
            </button>
        </div>
    );
};

export default function Sidebar({ currentDate, setCurrentDate }) {
    // This is placeholder data. In a real app, this would come from an API call
    // based on the selectedClinic and currentDate.
    const doctors = [
        { id: 1, name: 'Dr. Suwachai' },
        { id: 2, name: 'Dr. Usanee' },
        { id: 3, name: 'Dr. Sirassss' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </div>
            <div className="sidebar-today">
                Today: {format(new Date(), 'dd / MM / yyyy')}
            </div>
            <div className="sidebar-section">
                <h3>Doctor</h3>
                <ul className="doctor-list">
                    {doctors.map(doc => (
                        <li key={doc.id} className="doctor-item">
                            <input type="checkbox" id={`doc-${doc.id}`} defaultChecked />
                            <label htmlFor={`doc-${doc.id}`}>{doc.name}</label>
                        </li>
                    ))}
                     <li className="doctor-item">
                        <input type="checkbox" id="doc-all" />
                        <label htmlFor="doc-all">All</label>
                    </li>
                </ul>
            </div>
            <div style={{ marginTop: 'auto' }}>
                <SettingsDropdown />
            </div>
        </aside>
    );
}
