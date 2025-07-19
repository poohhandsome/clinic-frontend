// src/components/Sidebar.jsx (REPLACE)

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';

const MiniCalendar = ({ currentDate, setCurrentDate }) => {
    const [activeMonth, setActiveMonth] = useState(currentDate);

    const firstDayOfMonth = startOfMonth(activeMonth);
    const lastDayOfMonth = endOfMonth(activeMonth);
    const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start week on Monday
    const lastDayOfCalendar = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: firstDayOfCalendar, end: lastDayOfCalendar });

    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <button
                    onClick={() => setActiveMonth(subMonths(activeMonth, 1))}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                    aria-label="Previous month"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <span className="text-sm font-semibold text-slate-800">{format(activeMonth, 'MMMM yyyy')}</span>
                <button
                    onClick={() => setActiveMonth(addMonths(activeMonth, 1))}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                    aria-label="Next month"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
                {dayNames.map(d => <div key={d} className="text-xs font-medium text-slate-500">{d}</div>)}
                {days.map((day, i) => {
                    const isTodayClass = isSameDay(day, new Date()) ? 'border-sky-500' : 'border-transparent';
                    const isSelectedClass = isSameDay(day, currentDate) ? 'bg-sky-600 text-white hover:bg-sky-700' : 'hover:bg-slate-100';
                    const isOtherMonthClass = !isSameMonth(day, activeMonth) ? 'text-slate-400' : 'text-slate-700';

                    return (
                        <div key={i} className="py-1">
                             <button
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors duration-150 border ${isTodayClass} ${isSelectedClass} ${isOtherMonthClass}`}
                                onClick={() => setCurrentDate(day)}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function Sidebar({ currentDate, setCurrentDate, doctors, filteredDoctorIds, setFilteredDoctorIds }) {
    const handleDoctorFilterChange = (doctorId) => {
        setFilteredDoctorIds(prevIds =>
            prevIds.includes(doctorId)
                ? prevIds.filter(id => id !== doctorId)
                : [...prevIds, doctorId]
        );
    };

    const handleSelectAll = (e) => {
        setFilteredDoctorIds(e.target.checked ? doctors.map(d => d.id) : []);
    };

    const areAllSelected = doctors.length > 0 && filteredDoctorIds.length === doctors.length;

    return (
        <aside className="bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0">
            <div className="sidebar-section">
                <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </div>
            <div className="text-center text-sm font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                Today: {format(new Date(), 'dd / MM / yyyy')}
            </div>
            <div className="sidebar-section">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Doctors</h3>
                <ul className="flex flex-col gap-2">
                    {doctors.map(doc => (
                        <li key={doc.id}>
                           <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    checked={filteredDoctorIds.includes(doc.id)}
                                    onChange={() => handleDoctorFilterChange(doc.id)}
                                />
                                <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                           </label>
                        </li>
                    ))}
                     <li className="mt-2 border-t border-slate-200 pt-3">
                        <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                checked={areAllSelected}
                                onChange={handleSelectAll}
                            />
                            <span className="text-sm font-semibold text-slate-800">Select All</span>
                        </label>
                    </li>
                </ul>
            </div>
        </aside>
    );
}