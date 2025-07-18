/* -------------------------------------------------- */
/* FILE 8: src/components/ConfirmedAppointmentsPage.jsx (REPLACE) */
/* -------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import authorizedFetch from '../api';

export default function ConfirmedAppointmentsPage({ selectedClinic }) {
    const [appointments, setAppointments] = useState([]);
    const [endDate, setEndDate] = useState(new Date());
    const [startDate, setStartDate] = useState(subDays(new Date(), 6));

    useEffect(() => {
        if (selectedClinic && startDate && endDate) {
            const startDateString = format(startDate, 'yyyy-MM-dd');
            const endDateString = format(endDate, 'yyyy-MM-dd');
            
            authorizedFetch(`/confirmed-appointments?clinic_id=${selectedClinic}&startDate=${startDateString}&endDate=${endDateString}`)
                .then(res => res.json())
                .then(data => setAppointments(data));
        }
    }, [selectedClinic, startDate, endDate]);

    return (
        <div>
            <div className="page-header">
                <h2>Confirmed Appointments</h2>
                <div className="date-range-picker">
                    <label htmlFor="start-date">From:</label>
                    <input type="date" id="start-date" value={format(startDate, 'yyyy-MM-dd')} onChange={e => setStartDate(new Date(e.target.value))} />
                    <label htmlFor="end-date">To:</label>
                    <input type="date" id="end-date" value={format(endDate, 'yyyy-MM-dd')} onChange={e => setEndDate(new Date(e.target.value))} />
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Booking Time</th><th>Patient Name</th><th>Phone Number</th><th>Doctor</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {appointments.map(app => (
                            <tr key={app.id}>
                                <td>{app.appointment_date}</td>
                                <td>{app.booking_time}</td>
                                <td>{app.patient_name}</td>
                                <td>{app.phone_number}</td>
                                <td>{app.doctor_name}</td>
                                <td>{app.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {appointments.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No confirmed appointments for this date range.</p>}
            </div>
        </div>
    );
}