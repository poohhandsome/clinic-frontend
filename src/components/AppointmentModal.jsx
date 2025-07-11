
import React, { useState } from 'react';
import { format } from 'date-fns';

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

        fetch('http://localhost:3001/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        })
        .then(res => res.json())
        .then(() => onClose(true)) // Close and indicate booking was made
        .catch(err => console.error("Booking failed", err));
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content" onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h3>New Appointment</h3>
                    <button type="button" className="secondary" onClick={() => onClose(false)}>&times;</button>
                </div>
                <div className="modal-body">
                    <p><strong>Time:</strong> {format(data.date, 'MMMM d')} at {data.time}</p>
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
                </div>
                <div className="modal-footer">
                    <button type="button" className="secondary" onClick={() => onClose(false)}>Cancel</button>
                    <button type="submit" className="primary">Book Appointment</button>
                </div>
            </form>
        </div>
    );
}
