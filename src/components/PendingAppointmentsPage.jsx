
/* -------------------------------------------------- */
/* FILE 6: src/components/PendingAppointmentsPage.jsx (REPLACE) */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function PendingAppointmentsPage({ selectedClinic, apiUrl }) {
    const [pending, setPending] = useState([]);

    const fetchPending = () => {
        if (selectedClinic) {
            console.log('Fetching pending appointments...');
            fetch(`${apiUrl}/pending-appointments?clinic_id=${selectedClinic}`)
                .then(res => res.json())
                .then(data => setPending(data));
        }
    };

    // This useEffect hook sets up the polling.
    useEffect(() => {
        // Fetch data immediately when the component loads
        fetchPending(); 
        
        // Then, set up an interval to fetch data every 10 seconds (10000 milliseconds)
        const intervalId = setInterval(fetchPending, 10000);

        // This is a cleanup function. React runs this when the component
        // is unmounted (e.g., when you navigate to another page).
        // It's crucial for preventing memory leaks.
        return () => clearInterval(intervalId);
    }, [selectedClinic, apiUrl]); // Rerun this effect if the clinic or API URL changes

    const handleAction = (appointmentId, newStatus) => {
        fetch(`${apiUrl}/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        }).then(() => {
            // After an action, fetch immediately to show the change
            fetchPending();
        });
    };

    return (
        <div>
            <div className="page-header">
                <h2>Unconfirmed Appointments</h2>
            </div>
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
                 {pending.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No pending appointments for this clinic.</p>}
            </div>
        </div>
    );
}
