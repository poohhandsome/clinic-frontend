// src/components/AppointmentModal.jsx (REPLACE)

import React, { useState } from 'react';
import { format } from 'date-fns';
import authorizedFetch from '../api';

export default function AppointmentModal({ data, clinicId, onClose }) {
    const [patientId, setPatientId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const bookingData = {
            clinic_id: clinicId,
            doctor_id: data.doctorId,
            patient_id: patientId,
            patient_name_at_booking: patientName,
            appointment_date: format(data.date, 'yyyy-MM-dd'),
            appointment_time: `${data.time}:00`,
            status: 'unconfirmed' // <-- Appointments booked by admin should be unconfirmed first
        };

        try {
            const response = await authorizedFetch('/appointments', {
                method: 'POST',
                body: JSON.stringify(bookingData),
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.msg || 'Booking failed');
            }
            onClose(true);
        } catch (err) {
            setError(err.message);
            console.error("Booking failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content" onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h3>New Appointment</h3>
                    <button type="button" className="text-2xl text-slate-400 hover:text-slate-600" onClick={() => onClose(false)}>&times;</button>
                </div>
                <div className="modal-body">
                    <p className="mb-4">
                        <strong>Time:</strong> {format(data.date, 'MMMM d, yyyy')} at {data.time}
                    </p>
                    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="patientId">Patient ID</label>
                            <input 
                                type="text" 
                                id="patientId" 
                                value={patientId}
                                onChange={e => setPatientId(e.target.value)}
                                required 
                            />
                        </div>
                        <div>
                            <label htmlFor="patientName">Patient Name (for this booking)</label>
                            <input 
                                type="text" 
                                id="patientName" 
                                value={patientName}
                                onChange={e => setPatientName(e.target.value)}
                                required 
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="secondary" onClick={() => onClose(false)}>Cancel</button>
                    <button type="submit" className="primary" disabled={isLoading}>
                        {isLoading ? 'Booking...' : 'Book Appointment'}
                    </button>
                </div>
            </form>
        </div>
    );
}