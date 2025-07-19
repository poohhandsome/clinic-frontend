import React, { useState, useEffect, useRef } from 'react';
import authorizedFetch from '../api';

// --- Helper Functions & Constants ---

const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

// **IMPROVED**: Hour labels now show a range, e.g., "8:00 - 9:00"
const hourLabels = Array.from({ length: 12 }, (_, i) => {
    const startHour = i + 8;
    return `${startHour}:00 - ${startHour + 1}:00`;
});

const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, 'name': 'Saturday' }, { id: 0, name: 'Sunday' }
];

const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md mb-4 font-medium";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

// --- Main Component ---

export default function DoctorSchedulesPage({ doctors: allDoctors = [] }) {
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlots, setSelectedSlots] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    
    const isDragging = useRef(false);
    const selectionMode = useRef('add');

    useEffect(() => {
        if (allDoctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(allDoctors[0].id);
        }
    }, [allDoctors, selectedDoctor]);

    // This correctly fetches the existing schedule for the selected doctor
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
            if (selectionMode.current === 'add' && !isSelected) daySlots.push(time);
            else if (selectionMode.current === 'remove' && isSelected) daySlots.splice(daySlots.indexOf(time), 1);
            return { ...prev, [dayId]: daySlots };
        });
    };

    const handleClearDay = (dayId) => {
        setSelectedSlots(prev => ({ ...prev, [dayId]: [] }));
    };
    
    // This logic correctly overrides the old schedule with the new one on save
    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });
        const availabilityPayload = [];
        Object.keys(selectedSlots).forEach(dayId => {
            const slots = [...selectedSlots[dayId]].sort();
            if (slots.length === 0) return;
            let currentBlock = { day_of_week: parseInt(dayId), start_time: slots[0] };
            for (let i = 1; i <= slots.length; i++) {
                const prevTime = new Date(`1970-01-01T${slots[i-1]}`);
                const currentTime = i < slots.length ? new Date(`1970-01-01T${slots[i]}`) : null;
                if (!currentTime || (currentTime - prevTime) > (30 * 60 * 1000 + 1000)) {
                    const endTime = new Date(prevTime.getTime() + 30 * 60 * 1000);
                    availabilityPayload.push({ ...currentBlock, end_time: endTime.toTimeString().substring(0, 5) });
                    if (currentTime) currentBlock = { day_of_week: parseInt(dayId), start_time: slots[i] };
                }
            }
        });

        authorizedFetch(`/api/doctor-availability/${selectedDoctor}`, {
            method: 'POST',
            body: JSON.stringify({ availability: availabilityPayload }),
        })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to save schedule.'))
        .then(() => setStatus({ message: 'Schedule saved successfully!', type: 'success' }))
        .catch(err => setStatus({ message: 'Error saving schedule. Please try again.', type: 'error' }))
        .finally(() => setIsLoading(false));
    };

    return (
        <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2>
                <button 
                    className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50" 
                    onClick={handleSave} 
                    disabled={isLoading || !selectedDoctor}>
                    {isLoading ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>

            <div className="mb-6 max-w-xs">
                <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                <select 
                    id="doctor-select" 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    value={selectedDoctor} 
                    onChange={e => setSelectedDoctor(e.target.value)}>
                    <option value="" disabled>-- Select a Doctor --</option>
                    {allDoctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>
            
            <StatusMessage message={status.message} type={status.type} />
            
            <div className="grid border-t border-r border-slate-200" style={{ gridTemplateColumns: '120px repeat(24, 1fr)' }}>
                {/* Header Row */}
                <div className="font-semibold p-2 border-l border-b border-slate-200 bg-slate-50"></div>
                {hourLabels.map(hourLabel => (
                    <div key={hourLabel} className="text-center text-sm font-semibold p-2 border-l border-b border-slate-200 bg-slate-50" style={{ gridColumn: 'span 2' }}>
                        {hourLabel}
                    </div>
                ))}

                {/* Day Rows */}
                {daysOfWeek.map(day => (
                    <React.Fragment key={day.id}>
                        <div className="font-semibold p-2 border-l border-b border-r border-slate-200 bg-slate-50 flex items-center justify-between">
                            <span>{day.name}</span>
                            <button onClick={() => handleClearDay(day.id)} className="text-xs font-medium text-red-500 hover:text-red-700 px-1 rounded hover:bg-red-100" title={`Clear ${day.name}`}>
                                Clear
                            </button>
                        </div>
                        {timeSlots.map((time, index) => {
                            const isSelected = (selectedSlots[day.id] || []).includes(time);
                            const borderClass = index % 2 === 0 ? 'border-l-slate-300' : 'border-l-slate-200';
                            return (
                                <div
                                    key={`${day.id}-${time}`}
                                    onMouseDown={() => handleMouseDown(day.id, time)}
                                    onMouseEnter={() => handleMouseEnter(day.id, time)}
                                    className={`h-10 border-b ${borderClass} cursor-pointer transition-colors ${isSelected ? 'bg-green-300' : 'bg-white hover:bg-green-100'}`}
                                    title={`${day.name} - ${time}`}
                                ></div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}