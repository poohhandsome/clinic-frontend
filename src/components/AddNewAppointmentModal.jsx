// src/components/AddNewAppointmentModal.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { format } from 'date-fns';
import { Search, PlusCircle, Plus } from 'lucide-react';

// Reusable form field components
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
    </div>
);
const SelectField = ({ label, options, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select {...props} className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500">
            <option value="">-- No Room --</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

export default function AddNewAppointmentModal({ initialData, clinicId, onClose, onUpdate }) {
    const [step, setStep] = useState(1);
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [doctors, setDoctors] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const [formData, setFormData] = useState({
        appointment_date: format(initialData.date, 'yyyy-MM-dd'),
        appointment_time: initialData.time,
        doctor_id: initialData.doctorId || '',
        room_id: '',
        purpose: '',
        status: 'pending_confirmation'
    });

    const fetchRooms = () => {
        authorizedFetch(`/api/rooms?clinic_id=${clinicId}`)
            .then(res => res.json())
            .then(setRooms);
    };

    useEffect(() => {
        const dateString = format(initialData.date, 'yyyy-MM-dd');
        authorizedFetch(`/api/clinic-day-schedule?clinic_id=${clinicId}&date=${dateString}`)
            .then(res => res.json())
            .then(data => setDoctors(data.doctors || []));
            
        fetchRooms();
    }, [clinicId, initialData.date]);


    const handleSearch = async (e) => {
        e.preventDefault();
        if (!patientSearch) return;
        const res = await authorizedFetch(`/api/patients?query=${patientSearch}`);
        const data = await res.json();
        setSearchResults(data);
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setStep(2);
    };
    
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            await authorizedFetch('/api/rooms', {
                method: 'POST',
                body: JSON.stringify({ clinic_id: clinicId, room_name: newRoomName.trim() })
            });
            setNewRoomName('');
            setIsAddingRoom(false);
            fetchRooms(); // Refresh the room list
        } catch (err) {
            alert('Failed to add room.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            clinic_id: clinicId,
            customer_id: selectedPatient.customer_id || null,
            patient_name_at_booking: `${selectedPatient.first_name_th} ${selectedPatient.last_name_th}`,
            patient_phone_at_booking: selectedPatient.mobile_phone
        };

        try {
            const res = await authorizedFetch('/api/appointments', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to create appointment.');
            onUpdate();
            onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">New Appointment</h2>
                     <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
                
                {step === 1 && (
                    <div className="p-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <InputField label="Search for Patient (Name, DN, Phone)" name="search" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} autoFocus />
                            <button type="submit" className="px-4 py-2 mt-7 bg-sky-600 text-white rounded-md hover:bg-sky-700"><Search size={20}/></button>
                        </form>
                        <div className="mt-4 max-h-60 overflow-y-auto divide-y">
                            {searchResults.map(p => (
                                <div key={p.patient_id} onClick={() => handleSelectPatient(p)} className="p-3 hover:bg-slate-100 cursor-pointer">
                                    <div className="font-semibold">{p.first_name_th} {p.last_name_th}</div>
                                    <div className="text-sm text-slate-500">DN: {p.dn} | Phone: {p.mobile_phone}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <h4 className="font-bold text-green-800">{selectedPatient.first_name_th} {selectedPatient.last_name_th}</h4>
                                <p className="text-sm text-green-700">DN: {selectedPatient.dn} | Phone: {selectedPatient.mobile_phone}</p>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <InputField label="Date" name="appointment_date" type="date" value={formData.appointment_date} onChange={handleChange} />
                                <InputField label="Time" name="appointment_time" type="time" value={formData.appointment_time} onChange={handleChange} />
                            </div>
                             <div className="grid grid-cols-2 gap-4 items-end">
                                <SelectField label="Doctor" name="doctor_id" value={formData.doctor_id} onChange={handleChange} options={doctors.map(d => ({ value: d.id, label: d.name }))} />
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-slate-700">Room</label>
                                        <button type="button" onClick={() => setIsAddingRoom(p => !p)} className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                                            <Plus size={14}/> Add Room
                                        </button>
                                    </div>
                                    <SelectField label="" name="room_id" value={formData.room_id} onChange={handleChange} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} />
                                </div>
                            </div>
                            {isAddingRoom && (
                                <div className="flex items-end gap-2 p-3 bg-slate-50 rounded-md border">
                                    <InputField label="New Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                                    <button type="button" onClick={handleSaveRoom} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold">Save</button>
                                </div>
                            )}
                            <InputField label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="e.g., Scaling, Consultation"/>
                            <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} options={[
                                {value: 'pending_confirmation', label: 'Pending Confirmation'},
                                {value: 'confirmed', label: 'Confirmed'}
                            ]}/>
                        </div>
                         <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                            <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-slate-600 hover:text-slate-800">← Back to Search</button>
                            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                                <PlusCircle size={18}/> Create Appointment
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}