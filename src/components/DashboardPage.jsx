
/* -------------------------------------------------- */
/* FILE 5: src/components/DashboardPage.jsx (REPLACE) */
/* -------------------------------------------------- */

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal';

export default function DashboardPage({ selectedClinic, apiUrl, currentDate, doctors, filteredDoctorIds }) {
    const [dayData, setDayData] = useState({ appointments: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const displayedDoctors = useMemo(() => {
        return doctors.filter(doc => filteredDoctorIds.includes(doc.id));
    }, [doctors, filteredDoctorIds]);

    const fetchDayData = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            fetch(`${apiUrl}/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setDayData({ appointments: data.appointments || [] }));
        }
    };

    useEffect(fetchDayData, [selectedClinic, currentDate, apiUrl]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 7; i <= 20; i++) { // 7 AM to 8 PM
            for (let j = 0; j < 60; j += 30) { // 30-minute increments
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
            fetchDayData();
        }
    };

    return (
        <div className="dashboard-container">
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} apiUrl={apiUrl} onClose={handleModalClose} />}
            
            <div className="calendar-container">
                <div className="calendar-grid" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, 1fr)` }}>
                    {/* Headers */}
                    <div className="grid-header time-gutter"></div>
                    {displayedDoctors.map(doc => <div key={doc.id} className="grid-header doctor-column">{doc.name}</div>)}

                    {/* Body */}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="time-label">{time}</div>
                            {displayedDoctors.map(doc => {
                                const appointment = dayData.appointments.find(app => app.doctor_id === doc.id && app.appointment_time.startsWith(time));
                                return (
                                    <div className="time-slot doctor-column" onClick={() => !appointment && handleSlotClick(time, doc.id)}>
                                        {appointment && (
                                            <div className="appointment-item">
                                                Patient #{appointment.patient_id}
                                            </div>
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
