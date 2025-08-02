// src/components/PendingListModal.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { format, parseISO, differenceInYears } from 'date-fns';
import ConfirmationModal from './ConfirmationModal';
import { Phone, MessageSquare } from 'lucide-react';

export default function PendingListModal({ selectedClinic, onClose, onUpdate }) {
    const [pending, setPending] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const fetchPending = () => {
        setIsLoading(true);
        authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
            .then(res => res.json())
            .then(data => setPending(data))
            .catch(err => console.error("Failed to fetch pending appointments", err))
            .finally(() => setIsLoading(false));
    };
    
    useEffect(() => {
        authorizedFetch(`/api/doctors/unique`)
            .then(res => res.json())
            .then(allDocs => {
                const clinicDoctors = allDocs.filter(doc => doc.clinics.some(c => c.id === selectedClinic));
                setDoctors(clinicDoctors);
            });
            
        fetchPending();
    }, [selectedClinic]);

    const calculateAge = (dob) => {
        if (!dob) return '';
        return differenceInYears(new Date(), parseISO(dob));
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">All Pending Appointments</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {isLoading ? (
                            <p className="text-center text-slate-500 py-8">Loading...</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointment</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Info</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {pending.map(app => (
                                        <tr key={app.id}>
                                            <td className="p-3 align-top">
                                                <div className="font-bold">{format(parseISO(`${app.appointment_date}T${app.appointment_time}`), 'd MMM yyyy')}</div>
                                                <div className="text-slate-600">เวลา {format(parseISO(`${app.appointment_date}T${app.appointment_time}`), 'HH:mm')}</div>
                                            </td>
                                            <td className="p-3 align-top">
                                                <div className="font-bold text-slate-800">{app.patient_name}</div>
                                                <div className="text-slate-500">DN: {app.dn || 'N/A'}</div>
                                                <div className="flex items-center gap-2 text-slate-500"><Phone size={12}/>{app.mobile_phone || 'N/A'}</div>
                                                <div className="flex items-center gap-2 text-slate-500"><MessageSquare size={12}/>{app.line_id || 'N/A'}</div>
                                            </td>
                                             <td className="p-3 align-top">
                                                <div>Dr. {app.doctor_name}</div>
                                                <div>Room: {app.room_name || 'N/A'}</div>
                                                <div className="font-semibold">{app.purpose || 'No Purpose Set'}</div>
                                            </td>
                                            <td className="p-3 align-top">
                                                <button onClick={() => setSelectedAppointment(app)} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold hover:bg-yellow-200">
                                                    Confirm / Reschedule
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoading && pending.length === 0 && <p className="text-center text-slate-500 py-8">No pending appointments found.</p>}
                    </div>
                </div>
            </div>
            {selectedAppointment && (
                <ConfirmationModal 
                    appointment={selectedAppointment} 
                    doctors={doctors}
                    onClose={() => setSelectedAppointment(null)}
                    onUpdate={() => {
                        fetchPending();
                        onUpdate();
                    }}
                />
            )}
        </>
    );
}