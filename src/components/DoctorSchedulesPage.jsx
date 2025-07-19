import React, { useState, useEffect, useRef } from 'react';
import authorizedFetch from '../api';

// --- Helper Functions & Constants ---

// **FIXED**: This function now correctly generates time slots from 08:00 to 19:30.
const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30; // Start at 8:00 AM (480 mins)
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }, { id: 0, name: 'Sunday' }
];

const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md mb-4 font-medium";
    const typeClasses = type === 'success' 
        ? "bg-green-100 text-green-800" 
        : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};


// --- Main Component ---

export default function DoctorSchedulesPage({ selectedClinic, doctors: allDoctors, allDoctors: allDoctorsProp }) {
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlots, setSelectedSlots] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    
    const isDragging = useRef(false);
    const selectionMode = useRef('add');

    const doctors = allDoctors || allDoctorsProp || [];

    useEffect(() => {
        if (doctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(doctors[0].id);
        }
    }, [doctors, selectedDoctor]);

    useEffect(() => {
        if (selectedDoctor) {
            authorizedFetch(`/api/doctor-availability/${selectedDoctor}`)
                .then(res => res.json())
                .then(data => {
                    const newSelectedSlots = {};
                    daysOfWeek.forEach(day => {
                        newSelectedSlots[day.id] = [];
                        const dayAvailability = data.filter(d => d.day_of_week === day.id);
                        dayAvailability.forEach(avail => {
                            const start = new Date(`1970-01-01T${avail.start_time}`);
                            const end = new Date(`1970-01-01T${avail.end_time}`);
                            for (let d = start; d < end; d.setMinutes(d.getMinutes() + 30)) {
                                newSelectedSlots[day.id].push(d.toTimeString().substring(0, 5));
                            }
                        });
                    });
                    setSelectedSlots(newSelectedSlots);
                });
        }
    }, [selectedDoctor]);

    const handleMouseDown = (dayId, time) => {
        isDragging.current = true;
        const currentSlots = selectedSlots[dayId] || [];
        selectionMode.current = currentSlots.includes(time) ? 'remove' : 'add';
        toggleSlot(dayId, time);
    };

    const handleMouseEnter = (dayId, time) => {
        if (isDragging.current) {
            toggleSlot(dayId, time);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };
    
    const toggleSlot = (dayId, time) => {
        setSelectedSlots(prev => {
            const daySlots = prev[dayId] ? [...prev[dayId]] : [];
            const isSelected = daySlots.includes(time);
            
            if (selectionMode.current === 'add' && !isSelected) {
                daySlots.push(time);
            } else if (selectionMode.current === 'remove' && isSelected) {
                const index = daySlots.indexOf(time);
                daySlots.splice(index, 1);
            }
            
            return { ...prev, [dayId]: daySlots };
        });
    };
    
    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });

        const availabilityPayload = [];
        for (const dayId in selectedSlots) {
            const slots = [...selectedSlots[dayId]].sort();
            if (slots.length === 0) continue;

            let currentBlock = {
                day_of_week: parseInt(dayId, 10),
                start_time: slots[0],
                end_time: null
            };

            for (let i = 0; i < slots.length; i++) {
                const currentTime = new Date(`1970-01-01T${slots[i]}`);
                const nextTimeInBlock = new Date(`1970-01-01T${currentBlock.start_time}`);
                const diff = (currentTime - nextTimeInBlock) / (1000 * 60);

                if (diff / 30 > i) {
                    const lastSlotTime = new Date(`1970-01-01T${slots[i-1]}`);
                    lastSlotTime.setMinutes(lastSlotTime.getMinutes() + 30);
                    currentBlock.end_time = lastSlotTime.toTimeString().substring(0, 5);
                    availabilityPayload.push(currentBlock);

                    currentBlock = { day_of_week: parseInt(dayId, 10), start_time: slots[i], end_time: null };
                }
            }
            const finalSlotTime = new Date(`1970-01-01T${slots[slots.length - 1]}`);
            finalSlotTime.setMinutes(finalSlotTime.getMinutes() + 30);
            currentBlock.end_time = finalSlotTime.toTimeString().substring(0, 5);
            availabilityPayload.push(currentBlock);
        }

        authorizedFetch(`/api/doctor-availability/${selectedDoctor}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability: availabilityPayload }),
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
            setStatus({ message: 'Error saving schedule. Please try again.', type: 'error' });
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div onMouseUp={handleMouseUp}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2>
                <div className="flex items-center gap-4">
                     <button className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>
            </div>

            <div className="mb-6 max-w-xs">
                <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                <select 
                    id="doctor-select" 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    value={selectedDoctor} 
                    onChange={e => setSelectedDoctor(e.target.value)}
                >
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>
            
            <StatusMessage message={status.message} type={status.type} />

            <div className="space-y-6">
                {daysOfWeek.map(day => (
                    <div key={day.id}>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">{day.name}</h3>
                        {/* **FIXED**: The grid is now correctly set to 24 columns */}
                        <div className="grid grid-cols-24 gap-px bg-slate-200 border border-slate-200 rounded-lg p-px" onMouseLeave={handleMouseUp}>
                            {timeSlots.map((time, index) => {
                                const isSelected = (selectedSlots[day.id] || []).includes(time);
                                const isHourMark = index % 2 === 0;
                                return (
                                    <div
                                        key={time}
                                        onMouseDown={() => handleMouseDown(day.id, time)}
                                        onMouseEnter={() => handleMouseEnter(day.id, time)}
                                        className={`h-12 flex items-end justify-center cursor-pointer transition-colors ${isSelected ? 'bg-sky-500' : 'bg-white hover:bg-sky-100'}`}
                                        title={time}
                                    >
                                        {isHourMark && <span className={`text-xs ${isSelected ? 'text-sky-200' : 'text-slate-400'}`}>{time.split(':')[0]}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}