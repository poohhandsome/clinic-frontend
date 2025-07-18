// src/components/ConfirmedAppointmentsPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import authorizedFetch from '../api';

export default function ConfirmedAppointmentsPage({ selectedClinic }) {
    const [appointments, setAppointments] = useState([]);
    const [endDate, setEndDate] = useState(startOfDay(new Date()));
    const [startDate, setStartDate] = useState(startOfDay(subDays(new Date(), 6)));

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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Confirmed Appointments</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="!mb-0">From:</label>
                        <input type="date" id="start-date" value={format(startDate, 'yyyy-MM-dd')} onChange={e => setStartDate(new Date(e.target.value.replace(/-/g, '/')))} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date" className="!mb-0">To:</label>
                        <input type="date" id="end-date" value={format(endDate, 'yyyy-MM-dd')} onChange={e => setEndDate(new Date(e.target.value.replace(/-/g, '/')))} />
                    </div>
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                 <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Booking Time</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Patient Name</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Phone</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Doctor</th>
                            <th className="p-3 text-left font-semibold text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {appointments.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50">
                                <td className="p-3">{format(new Date(app.appointment_date), 'MMM d, yyyy')}</td>
                                <td className="p-3">{app.booking_time}</td>
                                <td className="p-3">{app.patient_name}</td>
                                <td className="p-3">{app.phone_number}</td>
                                <td className="p-3">{app.doctor_name}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{app.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {appointments.length === 0 && <p className="text-center p-4 text-slate-500">No confirmed appointments for this date range.</p>}
            </div>
        </div>
    );
}