
/* -------------------------------------------------- */
/* FILE 4: src/components/DashboardPage.jsx (UPDATED) */
/* -------------------------------------------------- */

import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import AppointmentModal from './AppointmentModal';

export default function DashboardPage({ selectedClinic, apiUrl }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dayData, setDayData] = useState({ doctors: [], appointments: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const fetchDayData = () => {
        if (selectedClinic) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            fetch(`${apiUrl}/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setDayData(data));
        }
    };

    useEffect(fetchDayData, [selectedClinic, currentDate]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 7; i <= 20; i++) { // 7 AM to 8 PM
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
            fetchDayData(); // Refresh data if booking was made
        }
    };

    return (
        <>
            {isModalOpen && <AppointmentModal data={modalData} clinicId={selectedClinic} apiUrl={apiUrl} onClose={handleModalClose} />}
            <div className="dashboard-header">
                <h2>Appointments for {format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
                <div className="date-navigation">
                    <button className="secondary" onClick={() => setCurrentDate(subDays(currentDate, 1))}>Previous Day</button>
                    <button className="primary" onClick={() => setCurrentDate(new Date())}>Today</button>
                    <button className="secondary" onClick={() => setCurrentDate(addDays(currentDate, 1))}>Next Day</button>
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-grid" style={{ gridTemplateColumns: `5rem repeat(${dayData.doctors.length}, 1fr)` }}>
                    {/* Headers */}
                    <div className="grid-header time-gutter">Time</div>
                    {dayData.doctors.map(doc => <div key={doc.id} className="grid-header doctor-column">{doc.name}</div>)}

                    {/* Body */}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="time-label">{time}</div>
                            {dayData.doctors.map(doc => {
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
        </>
    );
}
