// src/components/PendingAppointmentsPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import authorizedFetch from '../api';

export default function PendingAppointmentsPage({ selectedClinic }) {
    const [pending, setPending] = useState([]);

    const fetchPending = () => {
        if (selectedClinic) {
            authorizedFetch(`/pending-appointments?clinic_id=${selectedClinic}`)
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
        authorizedFetch(`/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        }).then(fetchPending);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Unconfirmed Appointments</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Time</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Patient</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Doctor</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pending.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50">
                                <td className="p-3">{format(new Date(app.appointment_date), 'MMM d, yyyy')}</td>
                                <td className="p-3">{app.appointment_time}</td>
                                <td className="p-3">{app.patient_name}</td>
                                <td className="p-3">{app.doctor_name}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button className="primary !py-1 !px-3" onClick={() => handleAction(app.id, 'confirmed')}>Approve</button>
                                        <button className="secondary !py-1 !px-3 !border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => handleAction(app.id, 'cancelled')}>Deny</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {pending.length === 0 && <p className="text-center p-4 text-slate-500">No pending appointments.</p>}
            </div>
        </div>
    );
}