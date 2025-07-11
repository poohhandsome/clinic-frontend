
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function ConfirmedAppointmentsPage({ selectedClinic, apiUrl }) {
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (selectedClinic) {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            fetch(`${apiUrl}/confirmed-appointments?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => setAppointments(data));
        }
    }, [selectedClinic, selectedDate, apiUrl]);

    return (
        <div>
            <div className="dashboard-header">
                <h2>Confirmed Appointments</h2>
                <div>
                    <label htmlFor="confirmed-date-picker" style={{marginRight: '0.5rem'}}>Select Date:</label>
                    <input 
                        type="date" 
                        id="confirmed-date-picker"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={e => setSelectedDate(new Date(e.target.value))}
                    />
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Booking Time</th>
                            <th>Patient Name</th>
                            <th>Phone Number</th>
                            <th>Doctor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(app => (
                            <tr key={app.id}>
                                <td>{app.booking_time}</td>
                                <td>{app.patient_name}</td>
                                <td>{app.phone_number}</td>
                                <td>{app.doctor_name}</td>
                                <td>{app.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {appointments.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No confirmed appointments for this date.</p>}
            </div>
        </div>
    );
}