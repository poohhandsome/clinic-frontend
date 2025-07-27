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

            authorizedFetch(`/api/confirmed-appointments?clinic_id=${selectedClinic}&startDate=${startDateString}&endDate=${endDateString}`)
                .then(res => res.json())
                .then(data => setAppointments(data));
        }
    }, [selectedClinic, startDate, endDate]);

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Confirmed Appointments</h2>
                <div className="flex items-center gap-4 text-sm">
                    <label htmlFor="start-date" className="font-medium text-slate-600">From:</label>
                    <input type="date" id="start-date" className="p-2 border border-slate-300 rounded-md shadow-sm" value={format(startDate, 'yyyy-MM-dd')} onChange={e => setStartDate(new Date(e.target.value))} />
                    <label htmlFor="end-date" className="font-medium text-slate-600">To:</label>
                    <input type="date" id="end-date" className="p-2 border border-slate-300 rounded-md shadow-sm" value={format(endDate, 'yyyy-MM-dd')} onChange={e => setEndDate(new Date(e.target.value))} />
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="w-full">
                     <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Time</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {appointments.map(app => (
                            <tr key={app.id}>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.appointment_date}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.booking_time}</td>
                                <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{app.patient_name}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.phone_number}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.doctor_name}</td>
                                <td className="p-3 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {appointments.length === 0 && <p className="text-center text-slate-500 py-8">No confirmed appointments for this date range.</p>}
            </div>
        </div>
    );
}