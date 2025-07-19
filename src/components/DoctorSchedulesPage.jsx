import React, { useState, useEffect, useRef } from 'react';
import authorizedFetch from '../api';

// --- Helper Functions & Constants ---

// Generates 30-minute time slots from 8:00 AM to 7:30 PM
const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30; // Start at 8:00 AM
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

// Generates hour labels for the grid header
const hourLabels = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }, { id: 0, name: 'Sunday' }
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

    // Set the initial doctor when the list loads
    useEffect(() => {
        if (allDoctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(allDoctors[0].id);
        }
    }, [allDoctors, selectedDoctor]);

    // Fetch and format the doctor's availability
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

    // --- Event Handlers for Drag-to-Select ---
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
    
    // --- Save Logic (No changes needed here) ---
    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });

        const availabilityPayload = [];
        for (const dayId in selectedSlots) {
            const slots = [...selectedSlots[dayId]].sort();
            if (slots.length === 0) continue;

            let currentBlock = { day_of_week: parseInt(dayId, 10), start_time: slots[0] };
            for (let i = 1; i <= slots.length; i++) {
                const prevTime = new Date(`1970-01-01T${slots[i-1]}`);
                const currentTime = i < slots.length ? new Date(`1970-01-01T${slots[i]}`) : null;
                
                // If the block is broken (not contiguous) or it's the last slot
                if (!currentTime || (currentTime - prevTime) > (30 * 60 * 1000)) {
                    const endTime = new Date(prevTime.getTime() + 30 * 60 * 1000);
                    availabilityPayload.push({
                        ...currentBlock,
                        end_time: endTime.toTimeString().substring(0, 5)
                    });
                    if (currentTime) {
                       currentBlock = { day_of_week: parseInt(dayId, 10), start_time: slots[i] };
                    }
                }
            }
        }

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
        // Add onMouseUp and onMouseLeave to the main container to catch mouse releases anywhere
        <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2>
                <button 
                    className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50" 
                    onClick={handleSave} 
                    disabled={isLoading || !selectedDoctor}
                >
                    {isLoading ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>

            <div className="mb-6 max-w-xs">
                <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                <select 
                    id="doctor-select" 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    value={selectedDoctor} 
                    onChange={e => setSelectedDoctor(e.target.value)}
                >
                    <option value="" disabled>-- Select a Doctor --</option>
                    {allDoctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>
            
            <StatusMessage message={status.message} type={status.type} />
            
            {/* The new weekly grid layout */}
            <div className="grid border border-slate-200 rounded-lg" style={{ gridTemplateColumns: '80px repeat(24, 1fr)' }}>
                {/* Header Row */}
                <div className="font-semibold p-2 border-r border-b border-slate-200"></div>
                {hourLabels.map(hour => (
                    <div key={hour} className="text-center font-semibold p-2 border-b border-slate-200 bg-slate-50" style={{ gridColumn: 'span 2' }}>
                        {hour}:00
                    </div>
                ))}

                {/* Day Rows */}
                {daysOfWeek.map(day => (
                    <React.Fragment key={day.id}>
                        <div className="font-semibold p-2 border-r border-slate-200 flex items-center justify-center">
                            {day.name}
                        </div>
                        {timeSlots.map(time => {
                            const isSelected = (selectedSlots[day.id] || []).includes(time);
                            return (
                                <div
                                    key={`${day.id}-${time}`}
                                    onMouseDown={() => handleMouseDown(day.id, time)}
                                    onMouseEnter={() => handleMouseEnter(day.id, time)}
                                    className={`h-12 border-l border-slate-200 cursor-pointer transition-colors ${isSelected ? 'bg-green-300' : 'bg-white hover:bg-green-100'}`}
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