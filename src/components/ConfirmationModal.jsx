// src/components/ConfirmationModal.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { format, parseISO } from 'date-fns';

// Reusable form field components
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
    </div>
);
const TextareaField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea {...props} rows="3" className="w-full p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
    </div>
);
const SelectField = ({ label, options, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select {...props} className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500">
            <option value="">-- Select --</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

export default function ConfirmationModal({ appointment, doctors, onClose, onUpdate }) {
    const [callResult, setCallResult] = useState('confirmed');
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({
        appointment_date: format(parseISO(appointment.appointment_date), 'yyyy-MM-dd'),
        appointment_time: appointment.appointment_time,
        doctor_id: appointment.doctor_id,
        room_id: appointment.room_id || '',
        purpose: appointment.purpose || '',
        confirmation_notes: ''
    });

    useEffect(() => {
        if (appointment.clinic_id) {
            authorizedFetch(`/api/rooms?clinic_id=${appointment.clinic_id}`)
                .then(res => res.json())
                .then(setRooms)
                .catch(err => console.error("Failed to fetch rooms", err));
        }
    }, [appointment.clinic_id]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let payload = { status: callResult, confirmation_notes: formData.confirmation_notes };

        if (callResult === 'rescheduled') {
            payload = { ...payload, ...formData };
        } else {
             payload = { ...payload, purpose: formData.purpose, room_id: formData.room_id, doctor_id: formData.doctor_id };
        }
        
        try {
            const res = await authorizedFetch(`/api/appointments/${appointment.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to update appointment.');
            onUpdate();
            onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Confirm Appointment for {appointment.patient_name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Call Result</label>
                                <select value={callResult} onChange={e => setCallResult(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="confirmed">Confirmed</option>
                                    <option value="rescheduled">Wants to Reschedule</option>
                                    <option value="cancelled">Cancelled / Rejected</option>
                                    <option value="no-answer">No Answer</option>
                                </select>
                            </div>

                            {callResult === 'rescheduled' && (
                                <div className="p-4 bg-slate-50 rounded-md border grid grid-cols-2 gap-4">
                                     <InputField label="New Date" name="appointment_date" type="date" value={formData.appointment_date} onChange={handleChange} />
                                     <InputField label="New Time" name="appointment_time" type="time" value={formData.appointment_time} onChange={handleChange} />
                                </div>
                            )}

                             <div className="grid grid-cols-2 gap-4">
                                 <SelectField label="Doctor" name="doctor_id" value={formData.doctor_id} onChange={handleChange} options={doctors.map(d => ({ value: d.id, label: d.name }))} />
                                 <SelectField label="Room" name="room_id" value={formData.room_id} onChange={handleChange} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} />
                            </div>
                            
                            <InputField label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="e.g., Scaling, Consultation"/>
                            <TextareaField label="Note" name="confirmation_notes" value={formData.confirmation_notes} onChange={handleChange} placeholder="Patient confirmed at 10:00..."/>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700">Confirm Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
}