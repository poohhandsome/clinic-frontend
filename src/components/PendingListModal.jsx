// src/components/PendingListModal.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { format, parseISO } from 'date-fns';
import ConfirmationModal from './ConfirmationModal'; // Import the new modal

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
        // Fetch all doctors in the clinic to pass to the confirmation modal
        authorizedFetch(`/api/doctors/unique`) // This gets all doctors with all their clinics
            .then(res => res.json())
            .then(allDocs => {
                // We need to filter this list to only doctors at the current clinic
                const clinicDoctors = allDocs.filter(doc => doc.clinics.some(c => c.id === selectedClinic));
                setDoctors(clinicDoctors);
            });
            
        fetchPending();
    }, [selectedClinic]);

    const handleActionClick = (appointment) => {
        setSelectedAppointment(appointment);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
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
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {pending.map(app => (
                                        <tr key={app.id}>
                                            <td className="p-3 whitespace-nowrap text-sm text-slate-700">
                                                {format(parseISO(`${app.appointment_date}T${app.appointment_time}`), 'd MMM yyyy, HH:mm')}
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{app.patient_name}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-slate-700">{app.doctor_name}</td>
                                            <td className="p-3 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => handleActionClick(app)} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold hover:bg-yellow-200">
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
                        fetchPending(); // Re-fetch list in this modal
                        onUpdate();     // Re-fetch list on the main page
                    }}
                />
            )}
        </>
    );
}