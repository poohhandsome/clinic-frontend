// src/components/NewUILayout/NewSidebar.jsx (CREATE NEW FILE)

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MiniCalendar = ({ currentDate, setCurrentDate }) => {
    const [activeMonth, setActiveMonth] = useState(currentDate);

    const firstDayOfMonth = startOfMonth(activeMonth);
    const lastDayOfMonth = endOfMonth(activeMonth);
    const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // Sunday
    const lastDayOfCalendar = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: firstDayOfCalendar, end: lastDayOfCalendar });
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div>
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm font-semibold text-slate-800">{format(activeMonth, 'MMMM yyyy')}</span>
                <div className="flex">
                    <button onClick={() => setActiveMonth(subMonths(activeMonth, 1))} className="p-1 rounded-full hover:bg-slate-100 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="m14 18l-6-6l6-6l1.4 1.4l-4.6 4.6l4.6 4.6L14 18Z"/></svg></button>
                    <button onClick={() => setActiveMonth(addMonths(activeMonth, 1))} className="p-1 rounded-full hover:bg-slate-100 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18l6-6l-6-6l-1.4 1.4l4.6 4.6l-4.6 4.6L10 18Z"/></svg></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
                {dayNames.map(d => <div key={d} className="text-xs font-medium text-slate-500 w-9 h-9 flex items-center justify-center">{d}</div>)}
                {days.map((day, i) => {
                    const isSelected = isSameDay(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const isOtherMonth = !isSameMonth(day, activeMonth);

                    return (
                        <button key={i} onClick={() => setCurrentDate(day)} className={`w-9 h-9 rounded-full text-sm transition-colors duration-150 ${isOtherMonth ? 'text-slate-300' : 'text-slate-700'} ${isSelected ? 'bg-sky-600 text-white hover:bg-sky-700' : 'hover:bg-slate-100'} ${isToday && !isSelected ? 'font-bold text-sky-600' : ''}`}>
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


export default function NewSidebar({ currentDate, setCurrentDate, doctors, filteredDoctorIds, setFilteredDoctorIds, dailySchedule }) {
    const [isDoctorsOpen, setIsDoctorsOpen] = useState(true);
    const workingDoctorIds = Object.keys(dailySchedule).map(id => parseInt(id, 10));

    const handleSelectAll = (e) => {
        setFilteredDoctorIds(e.target.checked ? workingDoctorIds : []);
    };
    
    const areAllWorkingSelected = workingDoctorIds.length > 0 && workingDoctorIds.every(id => filteredDoctorIds.includes(id));

    return (
        <aside className="bg-white border-r border-slate-200 p-4 flex flex-col gap-6 shrink-0 w-64">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg>
                Create
            </button>
            <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <div className="border-t border-slate-200 pt-4">
                <button onClick={() => setIsDoctorsOpen(!isDoctorsOpen)} className="w-full flex justify-between items-center py-2">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase">Doctors</h3>
                    {isDoctorsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isDoctorsOpen && (
                    <ul className="mt-2 flex flex-col gap-1">
                        {doctors.map(doc => {
                            const isWorking = workingDoctorIds.includes(doc.id);
                            return (
                                <li key={doc.id}>
                                   <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" checked={filteredDoctorIds.includes(doc.id)} onChange={() => setFilteredDoctorIds(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id])} />
                                        <span className={`text-sm font-medium ${isWorking ? 'text-slate-700' : 'text-slate-400'}`}>{doc.name}</span>
                                   </label>
                                </li>
                            );
                        })}
                         <li className="mt-2 border-t border-slate-200 pt-2">
                            <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" checked={areAllWorkingSelected} onChange={handleSelectAll} disabled={workingDoctorIds.length === 0} />
                                <span className="text-sm font-semibold text-slate-800">Select All Working</span>
                            </label>
                        </li>
                    </ul>
                )}
            </div>
        </aside>
    );
}