import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import authorizedFetch from '../api';

export default function PendingAppointmentsPage({ selectedClinic }) {
    const [pending, setPending] = useState([]);

    const fetchPending = () => {
        if (selectedClinic) {
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
        authorizedFetch(`/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        }).then(fetchPending);
    };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">Unconfirmed Appointments</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pending.map(app => (
                            <tr key={app.id}>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{format(new Date(app.appointment_date), 'MMM d, yyyy')}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.appointment_time}</td>
                                <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{app.patient_name}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.doctor_name}</td>
                                <td className="p-3 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200" onClick={() => handleAction(app.id, 'confirmed')}>Approve</button>
                                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold hover:bg-red-200" onClick={() => handleAction(app.id, 'cancelled')}>Deny</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {pending.length === 0 && <p className="text-center text-slate-500 py-8">No pending appointments.</p>}
            </div>
        </div>
    );
}