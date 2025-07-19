// src/components/DashboardPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal.jsx';
import authorizedFetch from '../api.js';

export default function DashboardPage({ selectedClinic, currentDate, doctors, filteredDoctorIds, dailySchedule }) {
    const [dayAppointments, setDayAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const displayedDoctors = useMemo(() => {
        return doctors.filter(doc => filteredDoctorIds.includes(doc.id));
    }, [doctors, filteredDoctorIds]);

    const fetchAppointments = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            // **THE FIX IS HERE**: The URL is now correct. It was `/appointments/by-date`
            // and has been changed to `/api/clinic-day-schedule` to match the backend.
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setDayAppointments(data.appointments || []))
                .catch(err => console.error("Failed to fetch day appointments:", err));
        }
    };

    useEffect(fetchAppointments, [selectedClinic, currentDate]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 7; i <= 20; i++) {
            for (let j = 0; j < 60; j += 30) {
                slots.push(`${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);

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

    const isSlotInWorkingHours = (slotTime, doctorId) => {
        const schedule = dailySchedule[doctorId];
        if (!schedule || !schedule.startTime || !schedule.endTime) {
            return false;
        }
        return slotTime >= schedule.startTime.substring(0, 5) && slotTime < schedule.endTime.substring(0, 5);
    };

    const CalendarGridHeader = ({ doctor }) => (
        <div key={doctor.id} className="sticky top-0 z-10 bg-white p-3 border-b border-r border-slate-200">
            <div className="font-semibold text-slate-800 text-center">{doctor.name}</div>
        </div>
    );

    return (
        <div className="h-full w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} onClose={handleModalClose} />}
            
            <div className="flex-1 overflow-auto">
                <div className="grid min-w-[900px]" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, 1fr)` }}>
                    
                    <div className="sticky top-0 z-10 bg-white border-b border-r border-slate-200"></div>
                    {displayedDoctors.map(doc => <CalendarGridHeader key={doc.id} doctor={doc} />)}

                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="h-16 text-right pr-2 text-xs text-slate-400 border-t border-r border-slate-200 pt-1">
                                {time}
                            </div>
                            
                            {displayedDoctors.map(doc => {
                                const appointment = dayAppointments.find(app => app.doctor_id === doc.id && app.appointment_time.startsWith(time));
                                const isWorking = isSlotInWorkingHours(time, doc.id);
                                
                                let slotClass = "h-16 border-t border-r border-slate-200 relative p-0.5";
                                if (!isWorking) {
                                    slotClass += " bg-slate-50"; 
                                } else {
                                    slotClass += " group";
                                }

                                return (
                                    <div
                                        key={`${time}-${doc.id}`}
                                        className={slotClass}
                                        onClick={() => isWorking && !appointment && handleSlotClick(time, doc.id)}
                                    >
                                        {isWorking && (
                                            appointment ? (
                                                <div className="bg-sky-100 text-sky-800 rounded-md p-2 h-full w-full text-xs font-medium overflow-hidden">
                                                    {appointment.patient_name_at_booking || `Patient #${appointment.patient_id}`}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full rounded-md opacity-0 group-hover:opacity-100 bg-sky-50 transition-opacity cursor-pointer"></div>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}