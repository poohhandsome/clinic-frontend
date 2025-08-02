
import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { format, parseISO } from 'date-fns';

export default function AppointmentActionModal({ action, appointment, doctors, clinicId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState({ message: '', type: '' });
    
    useEffect(() => {
        if (appointment) {
            setFormData({
                doctor_id: appointment.doctor_id,
                appointment_date: format(parseISO(appointment.appointment_date), 'yyyy-MM-dd'),
                appointment_time: appointment.booking_time,
                status: appointment.status
            });
        }
    }, [appointment]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let payload = {};
        let method = 'PATCH';

        if (action === 'check-in') {
            payload = { status: 'Checked-in' }; // Or whatever your checked-in status is
        } else if (action === 'reschedule' || action === 'edit') {
            payload = formData;
            method = 'PUT';
        } else {
            return; // No action specified
        }
        
        try {
            const res = await authorizedFetch(`/api/appointments/${appointment.id}`, {
                method: method,
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Failed to ${action} appointment.`);
            setStatus({ message: `Appointment ${action} successful!`, type: 'success' });
            onUpdate();
            setTimeout(onClose, 1500);
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        }
    };

    const title = {
        'check-in': `Check-in: ${appointment.patient_name}`,
        'reschedule': `Reschedule: ${appointment.patient_name}`,
        'edit': `Edit Appointment: ${appointment.patient_name}`
    }[action];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {action === 'check-in' && <p>Confirm check-in for this appointment?</p>}
                    
                    {(action === 'reschedule' || action === 'edit') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Date</label>
                                <input type="date" name="appointment_date" value={formData.appointment_date || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Time</label>
                                <input type="time" name="appointment_time" value={formData.appointment_time || ''} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Doctor</label>
                                <select name="doctor_id" value={formData.doctor_id || ''} onChange={handleChange} className="w-full p-2 border rounded-md">
                                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Status</label>
                                <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full p-2 border rounded-md">
                                    <option value="confirmed">Confirmed</option>
                                    <option value="pending_confirmation">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="rescheduled">Rescheduled</option>
                                </select>
                            </div>
                        </>
                    )}
                    
                    {status.message && <div className={`p-2 rounded text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.message}</div>}

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700">
                            Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}