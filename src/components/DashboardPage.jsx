// src/components/DashboardPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, getHours, getMinutes, isToday } from 'date-fns';
import AppointmentModal from './AppointmentModal.jsx';
import authorizedFetch from '../api.js';

const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const CurrentTimeIndicator = ({ hourHeight }) => {
    const [topPosition, setTopPosition] = useState(0);
    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const minutes = getHours(now) * 60 + getMinutes(now);
            setTopPosition((minutes / 60) * hourHeight);
        };
        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, [hourHeight]);
    return (
        <div className="absolute left-10 right-0 z-10" style={{ top: `${topPosition}px` }}>
            <div className="relative h-px bg-red-500"><div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div></div>
        </div>
    );
};

export default function DashboardPage({ selectedClinic, currentDate, doctors, filteredDoctorIds, dailySchedule }) {
    const [dayAppointments, setDayAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const containerRef = useRef(null);
    const hourHeight = 64; // h-16 = 4rem = 64px

    const displayedDoctors = useMemo(() => doctors.filter(doc => filteredDoctorIds.includes(doc.id)), [doctors, filteredDoctorIds]);
    const fetchAppointments = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json()).then(data => setDayAppointments(data.appointments || []))
                .catch(err => console.error("Failed to fetch day appointments:", err));
        }
    };
    useEffect(fetchAppointments, [selectedClinic, currentDate]);
    useEffect(() => { if (containerRef.current) { containerRef.current.scrollTop = 7 * hourHeight; } }, [displayedDoctors]);

    const handleSlotClick = (time, doctorId) => {
        setModalData({ time, doctorId, date: currentDate });
        setIsModalOpen(true);
    };
    const handleModalClose = (didBook) => {
        setIsModalOpen(false);
        setModalData(null);
        if (didBook) fetchAppointments();
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="h-full w-full bg-white flex flex-col">
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} onClose={handleModalClose} />}
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                <div className="grid relative" style={{ gridTemplateColumns: `4rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                    <div className="col-start-1 col-end-2 row-start-1 row-end-[-1]">
                        {hours.map(hour => (
                            <div key={hour} className="h-16 relative border-r border-slate-200">
                                <span className="absolute -top-2.5 right-2 text-xs text-slate-400">{format(new Date(0, 0, 0, hour), 'ha')}</span>
                            </div>
                        ))}
                    </div>
                    {displayedDoctors.map((doc, index) => (
                        <div key={doc.id} className="relative border-r border-slate-200" style={{ gridColumnStart: index + 2 }}>
                            {hours.map(hour => (
                                <React.Fragment key={hour}>
                                    <div className="h-8 border-b border-dashed border-slate-200" onClick={() => handleSlotClick(`${String(hour).padStart(2, '0')}:00`, doc.id)}></div>
                                    <div className="h-8 border-b border-slate-200" onClick={() => handleSlotClick(`${String(hour).padStart(2, '0')}:30`, doc.id)}></div>
                                </React.Fragment>
                            ))}
                            {dayAppointments.filter(app => app.doctor_id === doc.id).map(app => {
                                const top = timeToMinutes(app.appointment_time) * (hourHeight / 60);
                                const height = (timeToMinutes(app.end_time) - timeToMinutes(app.appointment_time)) * (hourHeight / 60);
                                return (
                                    <div key={app.id} className="absolute w-[calc(100%-0.5rem)] left-1 p-2 rounded-lg bg-sky-500 text-white cursor-pointer shadow-md" style={{ top: `${top}px`, height: `${height}px`, minHeight: '20px' }}>
                                        <p className="font-bold text-xs leading-tight">{app.details || 'Appointment'}</p>
                                        <p className="text-xs opacity-80">{app.patient_name_at_booking}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    {isToday(currentDate) && <CurrentTimeIndicator hourHeight={hourHeight} />}
                </div>
            </div>
        </div>
    );
}