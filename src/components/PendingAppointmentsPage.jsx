/* -------------------------------------------------- */
/* FILE 6: src/components/PendingAppointmentsPage.jsx (REPLACE) */
/* -------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import authorizedFetch from '../api';

export default function PendingAppointmentsPage({ selectedClinic }) {
    const [pending, setPending] = useState([]);

    const fetchPending = () => {
        if (selectedClinic) {
            // **THE FIX IS HERE**: Added '/api' to the fetch URL
            authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
                .then(res => res.json())
                .then(data => setPending(data));
        }
    };

    useEffect(() => {
        fetchPending(); 
        const intervalId = setInterval(fetchPending, 10000);
        return () => clearInterval(intervalId);
    }, [selectedClinic]);

    const handleAction = (appointmentId, newStatus) => {
        // **THE FIX IS HERE**: Added '/api' to the fetch URL
        authorizedFetch(`/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        }).then(fetchPending);
    };

    return (
        <div>
            <div className="page-header"><h2>Unconfirmed Appointments</h2></div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {pending.map(app => (
                            <tr key={app.id}>
                                <td>{format(new Date(app.appointment_date), 'MMM d, yyyy')}</td>
                                <td>{app.appointment_time}</td>
                                <td>{app.patient_name}</td>
                                <td>{app.doctor_name}</td>
                                <td className="actions">
                                    <button className="primary" onClick={() => handleAction(app.id, 'confirmed')}>Approve</button>
                                    <button className="secondary" onClick={() => handleAction(app.id, 'cancelled')}>Deny</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {pending.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No pending appointments.</p>}
            </div>
        </div>
    );
}