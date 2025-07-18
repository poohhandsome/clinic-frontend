// src/components/DoctorSchedulesPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';

const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }, { id: 0, name: 'Sunday' }
];

const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = 'p-3 rounded-md font-medium mb-4 ';
    const typeClasses = type === 'success' 
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    return <div className={baseClasses + typeClasses}>{message}</div>;
};

export default function DoctorSchedulesPage({ selectedClinic, doctors: allDoctors }) {
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [availability, setAvailability] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        if (allDoctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(allDoctors[0].id);
        }
    }, [allDoctors, selectedDoctor]);

    useEffect(() => {
        if (selectedDoctor) {
            authorizedFetch(`/doctor-availability/${selectedDoctor}`)
                .then(res => res.json())
                .then(data => {
                    const newAvail = daysOfWeek.map(day => {
                        const saved = data.find(d => d.day_of_week === day.id);
                        return { 
                            day_of_week: day.id, 
                            start_time: saved ? saved.start_time.substring(0,5) : '', 
                            end_time: saved ? saved.end_time.substring(0,5) : ''
                        };
                    });
                    setAvailability(newAvail);
                });
        }
    }, [selectedDoctor]);

    const handleTimeChange = (dayId, field, value) => {
        setAvailability(prev => prev.map(day => 
            day.day_of_week === dayId ? { ...day, [field]: value } : day
        ));
    };

    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });

        const formattedAvailability = availability.filter(day => day.start_time && day.end_time);

        authorizedFetch(`/doctor-availability/${selectedDoctor}`, {
            method: 'POST',
            body: JSON.stringify({ availability: formattedAvailability }),
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save schedule.');
            return res.json();
        })
        .then(() => {
            setStatus({ message: 'Schedule saved successfully!', type: 'success' });
        })
        .catch(err => {
            console.error(err);
            setStatus({ message: 'Error saving schedule.', type: 'error' });
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div>
            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2></div>
            <div className="mb-4 max-w-sm">
                <label htmlFor="doctor-schedule-select">Select Doctor</label>
                <select id="doctor-schedule-select" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
                    {allDoctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>
            
            <StatusMessage message={status.message} type={status.type} />

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 w-1/3 text-left font-semibold text-slate-600">Day</th>
                            <th className="p-3 w-1/3 text-left font-semibold text-slate-600">Start Time</th>
                            <th className="p-3 w-1/3 text-left font-semibold text-slate-600">End Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {availability.map((day) => (
                            <tr key={day.day_of_week} className="hover:bg-slate-50">
                                <td className="p-3 font-medium">{daysOfWeek.find(d => d.id === day.day_of_week).name}</td>
                                <td className="p-3"><input type="time" value={day.start_time || ''} onChange={e => handleTimeChange(day.day_of_week, 'start_time', e.target.value)} /></td>
                                <td className="p-3"><input type="time" value={day.end_time || ''} onChange={e => handleTimeChange(day.day_of_week, 'end_time', e.target.value)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-right">
                <button className="primary" onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>
        </div>
    );
}