// src/components/DashboardPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal';
import authorizedFetch from '../api';

export default function DashboardPage({ selectedClinic, currentDate, doctors, filteredDoctorIds }) {
    const [dayData, setDayData] = useState({ appointments: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const displayedDoctors = useMemo(() => {
        return doctors.filter(doc => filteredDoctorIds.includes(doc.id));
    }, [doctors, filteredDoctorIds]);

    const fetchDayData = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setDayData({ appointments: data.appointments || [] }));
        }
    };

    useEffect(fetchDayData, [selectedClinic, currentDate]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 7; i <= 20; i++) {
            slots.push(`${String(i).padStart(2, '0')}:00`);
            slots.push(`${String(i).padStart(2, '0')}:30`);
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
            fetchDayData();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} onClose={handleModalClose} />}
            <div className="flex-grow overflow-auto bg-white border border-slate-200 rounded-lg">
                <div className="sticky top-0 z-10 bg-white grid" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length || 1}, 1fr)` }}>
                    <div className="text-center font-semibold p-3 border-b border-r border-slate-200">Time</div>
                    {displayedDoctors.map(doc => 
                        <div key={doc.id} className="text-center font-semibold p-3 border-b border-r border-slate-200 truncate">{doc.name}</div>
                    )}
                    {displayedDoctors.length === 0 && <div className="border-b"></div>}
                </div>
                <div className="grid" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length || 1}, 1fr)` }}>
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-right pr-2 text-xs text-slate-500 h-14 border-r border-slate-200 flex items-center justify-end">
                                {time.endsWith(':00') && time}
                            </div>
                            {displayedDoctors.length > 0 ? (
                                displayedDoctors.map(doc => {
                                    const appointment = dayData.appointments.find(app => app.doctor_id === doc.id && app.appointment_time.startsWith(time));
                                    return (
                                        <div key={`${time}-${doc.id}`} className="h-14 border-r border-slate-200 relative group" onClick={() => !appointment && handleSlotClick(time, doc.id)}>
                                            <div className={`absolute inset-0 border-t border-dashed ${time.endsWith(':00') ? 'border-slate-200' : 'border-slate-100'}`}></div>
                                            {!appointment && <div className="absolute inset-0 opacity-0 group-hover:bg-sky-100/50 transition-opacity"></div>}
                                            {appointment && (
                                                <div className="absolute inset-1 p-1 text-xs rounded-md bg-sky-100 border-l-4 border-sky-500 overflow-hidden">
                                                    <p className="font-semibold text-sky-800 truncate">{appointment.patient_name_at_booking || `Patient #${appointment.patient_id}`}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-14 border-t border-dashed border-slate-200"></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}