// src/components/DashboardPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal.jsx';
import authorizedFetch from '../api.js';

// Helper function to convert time string "HH:mm:ss" to minutes from midnight
const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export default function DashboardPage({ selectedClinic, currentDate, doctors, filteredDoctorIds, dailySchedule }) {
    const [dayAppointments, setDayAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const containerRef = useRef(null);

    const displayedDoctors = useMemo(() => {
        return doctors.filter(doc => filteredDoctorIds.includes(doc.id));
    }, [doctors, filteredDoctorIds]);

    const fetchAppointments = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setDayAppointments(data.appointments || []))
                .catch(err => console.error("Failed to fetch day appointments:", err));
        }
    };

    useEffect(fetchAppointments, [selectedClinic, currentDate]);

    // Scroll to 8 AM on initial load
    useEffect(() => {
        if (containerRef.current) {
            const hourHeight = 60; // Corresponds to h-15 in Tailwind config (15 * 4px)
            containerRef.current.scrollTop = 7 * hourHeight; // Scroll to 7 AM to show 8 AM clearly
        }
    }, [displayedDoctors]);


    const handleSlotClick = (time, doctorId) => {
        setModalData({ time, doctorId, date: currentDate });
        setIsModalOpen(true);
    };

    const handleModalClose = (didBook) => {
        setIsModalOpen(false);
        setModalData(null);
        if (didBook) {
            fetchAppointments();
        }
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="h-full w-full bg-white rounded-lg shadow-sm flex flex-col">
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} onClose={handleModalClose} />}
            
            {/* Doctors Header */}
            <div className="grid shrink-0" style={{ gridTemplateColumns: `4rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                <div className="p-2 border-r border-b border-slate-200">
                    <div className="text-center font-bold text-slate-700 uppercase">
                        {format(currentDate, 'EEE')}
                        <div className="text-2xl">{format(currentDate, 'd')}</div>
                    </div>
                </div>
                {displayedDoctors.map(doc => (
                    <div key={doc.id} className="p-3 border-b border-r border-slate-200 text-center">
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                    </div>
                ))}
            </div>

            {/* Timeline Content */}
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                <div className="grid relative" style={{ gridTemplateColumns: `4rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                    {/* Time Gutter */}
                    <div className="col-start-1 col-end-2 row-start-1 row-end-[-1]">
                        {hours.map(hour => (
                            <div key={hour} className="h-15 relative border-r border-slate-200">
                                <span className="absolute -top-2 right-2 text-xs text-slate-400">
                                    {format(new Date(0, 0, 0, hour), 'ha')}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Doctor Columns */}
                    {displayedDoctors.map((doc, index) => (
                        <div key={doc.id} className="col-start-[-1] relative border-r border-slate-200" style={{ gridColumnStart: index + 2 }}>
                            {/* Hour lines for this column */}
                            {hours.map(hour => (
                                <div key={hour} className="h-15 border-b border-slate-200"></div>
                            ))}
                            
                            {/* Appointments for this doctor */}
                            {dayAppointments
                                .filter(app => app.doctor_id === doc.id)
                                .map(app => {
                                    const top = timeToMinutes(app.appointment_time) * (60 / 60); // 60px per hour
                                    const height = (timeToMinutes(app.end_time) - timeToMinutes(app.appointment_time)) * (60 / 60);
                                    
                                    return (
                                        <div
                                            key={app.id}
                                            className="absolute w-full p-2 rounded-lg bg-sky-500 text-white cursor-pointer"
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        >
                                            <p className="font-bold text-xs">{app.details || 'Appointment'}</p>
                                            <p className="text-xs opacity-80">{app.patient_name_at_booking}</p>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}