import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import authorizedFetch from '../api';

// --- Helper Functions & Constants ---

const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

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

const AddScheduleModal = ({ doctor, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [error, setError] = useState('');
    const [activeMonth, setActiveMonth] = useState(new Date());

    const handleSubmit = () => {
        if (new Date(`1970-01-01T${endTime}`) <= new Date(`1970-01-01T${startTime}`)) { setError('End time must be after start time.'); return; }
        setError('');
        authorizedFetch('/api/special-schedules', {
            method: 'POST', body: JSON.stringify({ doctor_id: doctor.id, clinic_id: doctor.clinic_id, schedule_date: format(selectedDate, 'yyyy-MM-dd'), start_time: startTime, end_time: endTime, is_available: true }),
        }).then(res => res.ok ? onClose(true) : setError('Failed to add schedule.'));
    };

    const calendarStart = startOfWeek(startOfMonth(activeMonth), { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(endOfMonth(activeMonth), { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Special Schedule for {doctor.name}</h3><button onClick={() => onClose(false)} className="text-2xl">&times;</button></div>
                <div>
                    <div className="flex justify-between items-center mb-2"><button onClick={() => setActiveMonth(subMonths(activeMonth, 1))}>&lt;</button><span className="font-semibold">{format(activeMonth, 'MMMM yyyy')}</span><button onClick={() => setActiveMonth(addMonths(activeMonth, 1))}>&gt;</button></div>
                    <div className="grid grid-cols-7 gap-1 text-center"><div className="text-xs">Mo</div><div className="text-xs">Tu</div><div className="text-xs">We</div><div className="text-xs">Th</div><div className="text-xs">Fr</div><div className="text-xs">Sa</div><div className="text-xs">Su</div>{calendarDays.map(d => (<button key={d.toString()} onClick={() => setSelectedDate(d)} className={`p-2 rounded-full text-sm ${isSameDay(d, selectedDate) ? 'bg-sky-600 text-white' : ''} ${!isSameMonth(d, activeMonth) ? 'text-slate-400' : ''} ${isToday(d) ? 'border border-sky-500' : ''}`}>{format(d, 'd')}</button>))}</div>
                    <div className="flex gap-4 mt-4"><div className="flex-1"><label className="block text-sm">Start Time</label><select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div className="flex-1"><label className="block text-sm">End Time</label><select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div></div>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
                <div className="flex justify-end gap-2 mt-6"><button className="px-4 py-2 bg-slate-200 rounded" onClick={() => onClose(false)}>Cancel</button><button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={handleSubmit}>Add Day</button></div>
            </div>
        </div>
    );
};

const RemoveScheduleModal = ({ doctor, onClose }) => {
    const [removableDates, setRemovableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    useEffect(() => { authorizedFetch(`/api/removable-schedules/${doctor.id}`).then(res => res.json()).then(setRemovableDates); }, [doctor.id]);
    const handleRemove = () => {
        if (!selectedDate) return;
        authorizedFetch('/api/special-schedules', { method: 'POST', body: JSON.stringify({ doctor_id: doctor.id, clinic_id: doctor.clinic_id, schedule_date: selectedDate, is_available: false, start_time: null, end_time: null }) }).then(res => res.ok && onClose(true));
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Remove a Scheduled Day for {doctor.name}</h3><button onClick={() => onClose(false)} className="text-2xl">&times;</button></div>
                <div><label>Select an upcoming work day to mark as unavailable:</label><select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-2 border rounded mt-2">{removableDates.length === 0 ? <option>No upcoming work days found</option> : <><option value="">-- Select a date --</option>{removableDates.map(d => <option key={d.schedule_date} value={d.schedule_date}>{d.display_text}</option>)}</>}</select></div>
                <div className="flex justify-end gap-2 mt-6"><button className="px-4 py-2 bg-slate-200 rounded" onClick={() => onClose(false)}>Cancel</button><button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleRemove} disabled={!selectedDate}>Remove Day</button></div>
            </div>
        </div>
    );
};
// --- Main Component ---

export default function DoctorSchedulesPage({ doctors: allDoctors = [] }) {
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlots, setSelectedSlots] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const isDragging = useRef(false);
    const selectionMode = useRef('add');

    useEffect(() => {
        if (allDoctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(allDoctors[0].id);
        }
    }, [allDoctors, selectedDoctor]);

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
    const selectedDoctorInfo = allDoctors.find(d => d.id === parseInt(selectedDoctor, 10));

    return (
        <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50" disabled={!selectedDoctor}>Add Special Day</button>
                    <button onClick={() => setIsRemoveModalOpen(true)} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50" disabled={!selectedDoctor}>Remove Scheduled Day</button>
                    <button className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50" onClick={handleSave} disabled={isLoading || !selectedDoctor}>Save Weekly Schedule</button>
                </div>
                
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
                            {/* **THE FIX IS HERE**: Replaced text with an SVG icon */}
                            <button 
                                onClick={() => handleClearDay(day.id)} 
                                className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors" 
                                title={`Clear ${day.name}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
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
        {isAddModalOpen && selectedDoctorInfo && <AddScheduleModal doctor={selectedDoctorInfo} onClose={() => setIsAddModalOpen(false)} />}
            {isRemoveModalOpen && selectedDoctorInfo && <RemoveScheduleModal doctor={selectedDoctorInfo} onClose={() => setIsRemoveModalOpen(false)} />}
        </div>
    );
}