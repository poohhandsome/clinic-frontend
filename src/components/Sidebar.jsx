// src/components/Sidebar.jsx (REPLACE)

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth, isToday } from 'date-fns';

const MiniCalendar = ({ currentDate, setCurrentDate }) => {
    const [activeMonth, setActiveMonth] = useState(currentDate);

    const firstDayOfMonth = startOfMonth(activeMonth);
    const lastDayOfMonth = endOfMonth(activeMonth);
    const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Monday
    const lastDayOfCalendar = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: firstDayOfCalendar, end: lastDayOfCalendar });

    const dayClasses = (day) => {
        let classes = 'flex items-center justify-center h-8 w-8 rounded-full cursor-pointer transition-colors duration-200 ';
        if (!isSameMonth(day, activeMonth)) classes += 'text-slate-400 ';
        else classes += 'text-slate-600 hover:bg-sky-100 ';
        if (isToday(day)) classes += 'border-2 border-sky-500 ';
        if (isSameDay(day, currentDate)) classes += '!bg-sky-600 !text-white ';
        return classes;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => setActiveMonth(subMonths(activeMonth, 1))} className="p-1 rounded-full hover:bg-slate-200">&lt;</button>
                <span className="font-semibold text-sm">{format(activeMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setActiveMonth(addMonths(activeMonth, 1))} className="p-1 rounded-full hover:bg-slate-200">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} className="text-xs font-bold text-slate-500">{d}</div>)}
                {days.map(day => (
                    <div key={day.toString()} className={dayClasses(day)} onClick={() => setCurrentDate(day)}>
                        {format(day, 'd')}
                    </div>
                ))}
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
        <aside className="bg-white border-r border-slate-200 p-4 flex flex-col gap-6">
            <div className="space-y-4">
                <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} />
                 <div className="text-center font-semibold text-slate-700 text-sm border-t pt-4">
                    Today: {format(new Date(), 'dd MMMM yyyy')}
                </div>
            </div>
            <div className="border-t pt-4">
                <h3 className="text-base font-semibold mb-3">Doctors</h3>
                <ul className="space-y-2">
                    {doctors.map(doc => (
                        <li key={doc.id} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={`doc-${doc.id}`}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                checked={filteredDoctorIds.includes(doc.id)}
                                onChange={() => handleDoctorFilterChange(doc.id)}
                            />
                            <label htmlFor={`doc-${doc.id}`} className="ml-3 block text-sm font-medium text-slate-700">{doc.name}</label>
                        </li>
                    ))}
                     <li className="flex items-center border-t pt-2 mt-2">
                        <input 
                            type="checkbox" 
                            id="doc-all"
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            checked={areAllSelected}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="doc-all" className="ml-3 block text-sm font-medium text-slate-700">Select All</label>
                    </li>
                </ul>
            </div>
        </aside>
    );
}