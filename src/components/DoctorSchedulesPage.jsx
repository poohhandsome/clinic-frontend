import React, { useState, useEffect, useRef, useMemo } from 'react';
import authorizedFetch from '../api';
import { FaTag } from 'react-icons/fa';

// --- Helper Components & Constants ---

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

// Define colors for the clinics. You can change these colors.
const clinicColors = {
    1: { bg: 'bg-sky-200', border: 'border-sky-500', text: 'text-sky-800' },
    2: { bg: 'bg-green-200', border: 'border-green-500', text: 'text-green-800' },
    3: { bg: 'bg-indigo-200', border: 'border-indigo-500', text: 'text-indigo-800' },
    default: { bg: 'bg-slate-200', border: 'border-slate-500', text: 'text-slate-800' }
};

const getClinicColor = (clinicId) => clinicColors[clinicId] || clinicColors.default;


const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md mb-4 font-medium";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

const ClinicSelectionModal = ({ doctor, onSave, onCancel }) => {
    const [selectedClinicId, setSelectedClinicId] = useState(doctor.clinics[0]?.id || '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Assign to Clinic</h3>
                <p className="text-sm text-slate-600 mb-4">Select a clinic for the new schedule for <span className="font-bold">{doctor.name}</span>.</p>
                <div className="space-y-2">
                    {doctor.clinics.map(clinic => (
                        <label key={clinic.id} className="flex items-center p-3 rounded-md hover:bg-slate-100 cursor-pointer border">
                            <input
                                type="radio"
                                name="clinic-selection"
                                value={clinic.id}
                                checked={selectedClinicId === clinic.id}
                                onChange={() => setSelectedClinicId(clinic.id)}
                                className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                            />
                            <span className="ml-3 text-sm font-medium text-slate-700">{clinic.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200" onClick={onCancel}>Cancel</button>
                    <button className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700" onClick={() => onSave(selectedClinicId)}>Assign Schedule</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function DoctorSchedulesPage() {
    const [allDoctors, setAllDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [schedules, setSchedules] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
    const [tempScheduleData, setTempScheduleData] = useState(null); // { dayId, slots }

    const isDragging = useRef(false);
    const selectionMode = useRef('add'); // 'add' or 'remove'
    const dragData = useRef({ dayId: null, slots: [] });

    // Fetch the unique list of all doctors on component mount
    useEffect(() => {
        authorizedFetch('/api/doctors/unique')
            .then(res => res.json())
            .then(data => {
                setAllDoctors(data);
                if (data.length > 0) {
                    setSelectedDoctorId(data[0].id);
                }
            })
            .catch(err => console.error("Failed to fetch unique doctors:", err));
    }, []);

    // Fetch schedules when a doctor is selected
    useEffect(() => {
        if (selectedDoctorId) {
            authorizedFetch(`/api/doctor-availability/${selectedDoctorId}`)
                .then(res => res.json())
                .then(data => {
                    const newSchedules = {};
                    daysOfWeek.forEach(day => {
                        newSchedules[day.id] = [];
                        const dayAvailability = data.filter(d => d.day_of_week === day.id);
                        dayAvailability.forEach(avail => {
                            const start = new Date(`1970-01-01T${avail.start_time}`);
                            const end = new Date(`1970-01-01T${avail.end_time}`);
                            for (let d = start; d < end; d.setMinutes(d.getMinutes() + 30)) {
                                newSchedules[day.id].push({
                                    time: d.toTimeString().substring(0, 5),
                                    clinic_id: avail.clinic_id
                                });
                            }
                        });
                    });
                    setSchedules(newSchedules);
                });
        }
    }, [selectedDoctorId]);

    const selectedDoctor = useMemo(() => allDoctors.find(doc => doc.id === selectedDoctorId), [allDoctors, selectedDoctorId]);

    const handleMouseDown = (dayId, time) => {
        isDragging.current = true;
        const currentSlots = schedules[dayId] || [];
        const existingSlot = currentSlots.find(s => s.time === time);
        selectionMode.current = existingSlot ? 'remove' : 'add';
        dragData.current = { dayId, slots: [{ time, clinic_id: existingSlot?.clinic_id }] }; // Start tracking drag
        toggleSlot(dayId, time, existingSlot?.clinic_id);
    };

    const handleMouseEnter = (dayId, time) => {
        if (isDragging.current && dragData.current.dayId === dayId) {
            const isAlreadyDragged = dragData.current.slots.some(s => s.time === time);
            if (!isAlreadyDragged) {
                const existingSlot = (schedules[dayId] || []).find(s => s.time === time);
                 dragData.current.slots.push({ time, clinic_id: existingSlot?.clinic_id });
                toggleSlot(dayId, time, existingSlot?.clinic_id);
            }
        }
    };

    const handleMouseUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        if (selectionMode.current === 'add' && selectedDoctor) {
            if (selectedDoctor.clinics.length > 1) {
                // If doctor works at multiple clinics, open modal
                setTempScheduleData({ dayId: dragData.current.dayId, slots: dragData.current.slots.map(s => s.time) });
                setIsClinicModalOpen(true);
            } else if (selectedDoctor.clinics.length === 1) {
                // If only one clinic, assign it automatically
                const clinicId = selectedDoctor.clinics[0].id;
                handleClinicSelection(clinicId);
            }
        }
        // Reset drag data
        dragData.current = { dayId: null, slots: [] };
    };

    const toggleSlot = (dayId, time, clinicIdToRemove) => {
        setSchedules(prev => {
            const daySlots = prev[dayId] ? [...prev[dayId]] : [];
            const isSelected = daySlots.some(s => s.time === time);

            if (selectionMode.current === 'add' && !isSelected) {
                // Temporarily add with a null clinic_id for visual feedback
                daySlots.push({ time, clinic_id: null });
            } else if (selectionMode.current === 'remove' && isSelected) {
                const index = daySlots.findIndex(s => s.time === time && s.clinic_id === clinicIdToRemove);
                if (index > -1) {
                    daySlots.splice(index, 1);
                }
            }
            return { ...prev, [dayId]: daySlots };
        });
    };
    
    const handleClinicSelection = (clinicId) => {
        // Apply the selected clinicId to the temporary slots
        setSchedules(prev => {
            const dayId = tempScheduleData.dayId;
            const newSlots = tempScheduleData.slots;
            const daySchedule = [...prev[dayId]];
            newSlots.forEach(time => {
                const index = daySchedule.findIndex(s => s.time === time && s.clinic_id === null);
                if (index !== -1) {
                    daySchedule[index].clinic_id = clinicId;
                }
            });
            return { ...prev, [dayId]: daySchedule };
        });
        setIsClinicModalOpen(false);
        setTempScheduleData(null);
    };

    const cancelClinicSelection = () => {
        // Revert the temporary visual change
         if (tempScheduleData) {
            setSchedules(prev => {
                const dayId = tempScheduleData.dayId;
                const daySchedule = prev[dayId].filter(s => s.clinic_id !== null);
                return { ...prev, [dayId]: daySchedule };
            });
        }
        setIsClinicModalOpen(false);
        setTempScheduleData(null);
    };


    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });
        
        const availabilityPayload = [];
        Object.keys(schedules).forEach(dayId => {
            const slotsForDay = [...schedules[dayId]].sort((a, b) => a.time.localeCompare(b.time));
            if (slotsForDay.length === 0) return;

            // Group by clinic
            const slotsByClinic = slotsForDay.reduce((acc, slot) => {
                if (!acc[slot.clinic_id]) acc[slot.clinic_id] = [];
                acc[slot.clinic_id].push(slot.time);
                return acc;
            }, {});

            // Process each clinic's schedule for the day
            for (const clinicId in slotsByClinic) {
                const slots = slotsByClinic[clinicId];
                if (slots.length === 0) continue;

                let currentBlock = { start_time: slots[0] };
                for (let i = 1; i <= slots.length; i++) {
                    const prevTime = new Date(`1970-01-01T${slots[i-1]}`);
                    const currentTime = i < slots.length ? new Date(`1970-01-01T${slots[i]}`) : null;

                    if (!currentTime || (currentTime - prevTime) > (30 * 60 * 1000 + 1000)) {
                        const endTime = new Date(prevTime.getTime() + 30 * 60 * 1000);
                        availabilityPayload.push({
                            day_of_week: parseInt(dayId),
                            clinic_id: parseInt(clinicId),
                            ...currentBlock,
                            end_time: endTime.toTimeString().substring(0, 5)
                        });
                        if (currentTime) currentBlock = { start_time: slots[i] };
                    }
                }
            }
        });

        authorizedFetch(`/api/doctor-availability/${selectedDoctorId}`, {
            method: 'POST',
            body: JSON.stringify({ availability: availabilityPayload }),
        })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to save schedule.'))
        .then(() => setStatus({ message: 'Schedule saved successfully!', type: 'success' }))
        .catch(err => setStatus({ message: `Error saving schedule: ${err.message}`, type: 'error' }))
        .finally(() => setIsLoading(false));
    };


    return (
        <div className="p-6 h-full overflow-y-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {isClinicModalOpen && selectedDoctor && (
                <ClinicSelectionModal
                    doctor={selectedDoctor}
                    onSave={handleClinicSelection}
                    onCancel={cancelClinicSelection}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Doctor Schedules</h2>
                <div className="flex items-center gap-4">
                    <button
                        className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50"
                        onClick={handleSave}
                        disabled={isLoading || !selectedDoctorId}>
                        {isLoading ? 'Saving...' : 'Save Weekly Schedule'}
                    </button>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-4">
                <div className="max-w-xs">
                    <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                    <select
                        id="doctor-select"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                        value={selectedDoctorId}
                        onChange={e => setSelectedDoctorId(parseInt(e.target.value, 10))}>
                        <option value="" disabled>-- Select a Doctor --</option>
                        {allDoctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                    </select>
                </div>
                {selectedDoctor && (
                     <div className="pt-6">
                        <span className="text-sm font-medium text-slate-500 mr-2">Works at:</span>
                        {selectedDoctor.clinics.map(clinic => {
                            const color = getClinicColor(clinic.id);
                            return (
                                <span key={clinic.id} className={`inline-flex items-center gap-1.5 mr-2 px-2 py-1 text-xs font-medium rounded-full ${color.bg} ${color.text}`}>
                                    <FaTag/> {clinic.name}
                                </span>
                            );
                        })}
                    </div>
                )}
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
                        </div>
                        {timeSlots.map((time, index) => {
                            const slotData = (schedules[day.id] || []).find(s => s.time === time);
                            const color = slotData ? getClinicColor(slotData.clinic_id) : { bg: 'bg-white hover:bg-green-100' };
                            const tempColor = slotData?.clinic_id === null ? 'bg-yellow-200' : '';
                            const borderClass = index % 2 === 0 ? 'border-l-slate-300' : 'border-l-slate-200';
                            
                            return (
                                <div
                                    key={`${day.id}-${time}`}
                                    onMouseDown={() => handleMouseDown(day.id, time)}
                                    onMouseEnter={() => handleMouseEnter(day.id, time)}
                                    className={`h-10 border-b ${borderClass} cursor-pointer transition-colors ${tempColor || color.bg}`}
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