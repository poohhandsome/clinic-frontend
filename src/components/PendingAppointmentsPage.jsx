
/* -------------------------------------------------- */
/* FILE 6: src/components/PendingAppointmentsPage.jsx */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function PendingAppointmentsPage({ selectedClinic }) {
    const [pending, setPending] = useState([]);

    const fetchPending = () => {
        if (selectedClinic) {
            fetch(`http://localhost:3001/api/pending-appointments?clinic_id=${selectedClinic}`)
                .then(res => res.json())
                .then(data => setPending(data));
        }
    };

    useEffect(fetchPending, [selectedClinic]);

    const handleAction = (appointmentId, newStatus) => {
        fetch(`http://localhost:3001/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        }).then(() => {
            // Refresh the list after action
            fetchPending();
        });
    };

    return (
        <div>
            <h2>Pending Appointments</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Actions</th>
                        </tr>
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
            </div>
        </div>
    );
}

