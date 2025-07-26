// src/components/AppointmentModal.jsx (REPLACE)

import React, { useState } from 'react';
import { format } from 'date-fns';
import authorizedFetch from '../api.js';

export default function AppointmentModal({ data, clinicId, onClose }) {
    const [patientId, setPatientId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const bookingData = {
            clinic_id: clinicId,
            doctor_id: data.doctorId,
            patient_id: patientId,
            appointment_date: format(data.date, 'yyyy-MM-dd'),
            appointment_time: `${data.time}:00`,
            status: 'confirmed'
        };

        authorizedFetch('/api/appointments', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        })
        .then(res => {
            if (!res.ok) throw new Error('Booking failed');
            return res.json();
        })
        .then(() => onClose(true))
        .catch(err => console.error("Booking failed", err));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onSubmit={handleSubmit}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">New Appointment</h3>
                    <button type="button" className="p-1 rounded-full hover:bg-slate-200" onClick={() => onClose(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="mt-4 space-y-4">
                    <p className="text-slate-600">
                        <strong>Time:</strong> {format(data.date, 'MMMM d, yyyy')} at {data.time}
                    </p>
                    <div>
                        <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                        <input 
                            type="text" 
                            id="patientId" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            required 
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200" onClick={() => onClose(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700">Book Appointment</button>
                </div>
            </form>
        </div>
    );
}