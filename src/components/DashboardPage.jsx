// src/components/DashboardPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import { format, getHours, getMinutes, isToday } from 'date-fns';
// THE FIX: Import the better modal and remove the old one
import AddNewAppointmentModal from './AddNewAppointmentModal.jsx'; 
import authorizedFetch from '../api.js';
import DashboardControls from './DashboardControls.jsx';

const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const CurrentTimeIndicator = ({ hourHeight, timelineStartHour, timelineEndHour }) => {
    const [topPosition, setTopPosition] = useState(null);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const currentHour = getHours(now);
            if (currentHour >= timelineStartHour && currentHour <= timelineEndHour) {
                const minutesSinceTimelineStart = (currentHour - timelineStartHour) * 60 + getMinutes(now);
                setTopPosition(minutesSinceTimelineStart * (hourHeight / 60));
            } else {
                setTopPosition(null);
            }
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, [hourHeight, timelineStartHour, timelineEndHour]);

    if (topPosition === null) return null;

    return (
        <div className="absolute left-16 right-0 z-20" style={{ top: `${topPosition}px` }}>
            <div className="relative h-px bg-red-500">
                <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
        </div>
    );
};

export default function DashboardPage({ selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, setFilteredDoctorIds, dailySchedule }) {
    const [dayAppointments, setDayAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const hourHeight = 80;

    const timelineStartHour = 8;
    const timelineEndHour = 20;
    const hours = Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_, i) => i + timelineStartHour);

    const displayedDoctors = useMemo(() => doctors.filter(doc => filteredDoctorIds.includes(doc.id)), [doctors, filteredDoctorIds]);

    const fetchAppointments = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json()).then(data => setDayAppointments(data.appointments || []))
                .catch(err => console.error("Failed to fetch day appointments:", err));
        }
    };
    useEffect(fetchAppointments, [selectedClinic, currentDate, filteredDoctorIds]);

    // THE FIX: This function now prepares data for the better modal
    const handleSlotClick = (time, doctorId) => {
        setModalData({ time, doctorId, date: currentDate });
        setIsModalOpen(true);
    };
    
    // THE FIX: This function, for the "+ Create" button, does the same
    const handleCreateClick = () => {
        setModalData({ time: '09:00', doctorId: null, date: currentDate });
        setIsModalOpen(true);
    };

    // THE FIX: The close handler is now simpler and refreshes appointments
    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalData(null);
        fetchAppointments(); // Refresh appointments after modal closes
    };
    
    const isSlotInWorkingHours = (slotHour, slotMinute, doctorId) => {
        const schedule = dailySchedule[doctorId];
        if (!schedule || !schedule.startTime || !schedule.endTime) return false;
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        const startTotalMinutes = timeToMinutes(schedule.startTime);
        const endTotalMinutes = timeToMinutes(schedule.endTime);
        return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
    };

    return (
        <div className="h-full w-full bg-white flex flex-row">
            {/* THE FIX: We are now calling the correct modal component */}
            {isModalOpen && <AddNewAppointmentModal 
                initialData={modalData} 
                clinicId={selectedClinic} 
                onClose={handleModalClose}
                onUpdate={fetchAppointments} 
            />}
            
            <DashboardControls 
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                doctors={doctors}
                filteredDoctorIds={filteredDoctorIds}
                setFilteredDoctorIds={setFilteredDoctorIds}
                dailySchedule={dailySchedule}
                onCreateClick={handleCreateClick}
            />

            <div className="flex-1 flex flex-col border-l border-slate-200">
                <div className="grid shrink-0" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                    <div className="p-2 border-r border-b border-slate-200 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-xs font-bold text-sky-600 uppercase">{format(currentDate, 'EEE')}</p>
                            <div className="w-9 h-9 flex items-center justify-center bg-sky-600 rounded-full text-white text-lg font-semibold mt-1">
                                {format(currentDate, 'd')}
                            </div>
                        </div>
                    </div>
                    {displayedDoctors.map(doc => (
                        <div key={doc.id} className="p-3 border-b border-r border-slate-200 text-center">
                            <span className="font-semibold text-slate-800">{doc.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto relative">
                    <div className="grid relative" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                        <div className="col-start-1 col-end-2 row-start-1 row-end-[-1]">
                            {hours.map(hour => (
                                <div key={hour} className="h-20 relative border-r border-slate-200">
                                    <span className="absolute -top-2.5 right-2 text-xs font-semibold text-slate-800">
                                        {format(new Date(0, 0, 0, hour), 'ha')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {displayedDoctors.map((doc, index) => (
                            <div key={doc.id} className="relative border-r border-slate-200" style={{ gridColumnStart: index + 2 }}>
                                {hours.map(hour => (
                                    <React.Fragment key={hour}>
                                        <div className={`h-10 border-b border-slate-200 ${isSlotInWorkingHours(hour, 0, doc.id) ? 'cursor-pointer' : 'bg-slate-50'}`} 
                                             onClick={() => isSlotInWorkingHours(hour, 0, doc.id) && handleSlotClick(`${String(hour).padStart(2, '0')}:00`, doc.id)} />
                                        <div className={`h-10 border-b border-slate-200 ${isSlotInWorkingHours(hour, 30, doc.id) ? 'cursor-pointer' : 'bg-slate-50'}`} 
                                             onClick={() => isSlotInWorkingHours(hour, 30, doc.id) && handleSlotClick(`${String(hour).padStart(2, '0')}:30`, doc.id)} />
                                    </React.Fragment>
                                ))}
                                
                                {dayAppointments.filter(app => app.doctor_id === doc.id).map(app => {
                                    const appointmentStartMinutes = timeToMinutes(app.appointment_time);
                                    const top = (appointmentStartMinutes - (timelineStartHour * 60)) * (hourHeight / 60);
                                    const height = (timeToMinutes(app.end_time) - appointmentStartMinutes) * (hourHeight / 60);
                                    if (top < 0 || appointmentStartMinutes > timelineEndHour * 60) return null;

                                    return (
                                        <div key={app.id} className="absolute w-[calc(100%-0.5rem)] left-1 p-2 rounded-lg bg-sky-500 text-white shadow-md z-10" style={{ top: `${top}px`, height: `${height}px`, minHeight: '20px' }}>
                                            <p className="font-bold text-xs leading-tight">{app.details || 'Appointment'}</p>
                                            <p className="text-xs opacity-80">{app.patient_name_at_booking}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        
                        {isToday(currentDate) && <CurrentTimeIndicator hourHeight={hourHeight} timelineStartHour={timelineStartHour} timelineEndHour={timelineEndHour} />}
                    </div>
                </div>
            </div>
        </div>
    );
}