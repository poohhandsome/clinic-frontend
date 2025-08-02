// src/components/EditDoctorModal.jsx (NEW FILE)

import React, { useState, useEffect, useRef } from 'react';
import authorizedFetch from '../api';
import { ChevronDown } from 'lucide-react';

// --- Helper Components (copied from SettingsPage) ---
const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md my-4 font-medium text-sm";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

const ClinicCheckboxList = ({ clinics, selected, onChange }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-md bg-slate-50/50">
        {clinics.map(clinic => (
            <label key={clinic.id} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-100 cursor-pointer">
                <input
                    type="checkbox"
                    checked={selected.includes(clinic.id)}
                    onChange={() => onChange(clinic.id)}
                    className="h-4 w-4 rounded text-sky-600 border-gray-300 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700 font-medium">{clinic.name}</span>
            </label>
        ))}
    </div>
);

const dentistSpecialties = [
    "General Dentistry", "Orthodontics", "Pediatric Dentistry", "Periodontics",
    "Endodontics", "Oral Surgery", "Prosthodontics",
];

const SpecialtyDropdown = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSpecialtyToggle = (specialty) => {
        const newSelected = selected.includes(specialty) ? selected.filter(s => s !== specialty) : [...selected, specialty];
        onChange(newSelected);
    };

    const displayValue = selected.length > 0 ? selected.join(', ') : "Select specialties...";

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left flex justify-between items-center">
                <span className="text-slate-700 truncate">{displayValue}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-20 overflow-auto transition-all ${isOpen ? 'max-h-60' : 'max-h-0 opacity-0'}`}>
                {dentistSpecialties.map(specialty => (
                    <label key={specialty} className="flex items-center space-x-3 p-2 hover:bg-slate-100 cursor-pointer">
                        <input type="checkbox" checked={selected.includes(specialty)} onChange={() => handleSpecialtyToggle(specialty)} className="h-4 w-4 rounded text-sky-600 border-gray-300 focus:ring-sky-500" />
                        <span className="text-sm text-slate-700 font-medium">{specialty}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};


// --- Main Modal Component ---
export default function EditDoctorModal({ doctor, clinics, onClose, onUpdate }) {
    const [editForm, setEditForm] = useState({
        specialties: [], selectedClinics: [], email: '',
        color: '#ffffff', status: 'active', password: ''
    });
    const [editStatus, setEditStatus] = useState({ message: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (doctor) {
            setEditForm({
                specialties: doctor.specialty ? doctor.specialty.split(', ') : [],
                selectedClinics: doctor.clinics.map(c => c.id),
                email: doctor.email || '',
                color: doctor.color || '#4299e1',
                status: doctor.status || 'active',
                password: '' // Always start with an empty password field
            });
        }
    }, [doctor]);
    
    const handleEditFormChange = (e) => setEditForm(prev => ({...prev, [e.target.name]: e.target.value}));

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsEditing(true);
        setEditStatus({ message: '', type: '' });
        try {
            const payload = {
                specialty: editForm.specialties.join(', '),
                clinicIds: editForm.selectedClinics,
                email: editForm.email,
                color: editForm.color,
                status: editForm.status,
            };
            if (editForm.password) {
                payload.password = editForm.password;
            }
            const res = await authorizedFetch(`/api/doctors/${doctor.id}/clinics`, { 
                method: 'PUT', body: JSON.stringify(payload) 
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to update doctor');

            setEditStatus({ message: 'Doctor updated successfully!', type: 'success' });
            onUpdate(); // Re-fetch doctors list in parent
            setTimeout(onClose, 1500); // Close modal after a short delay
        } catch (err) {
            setEditStatus({ message: err.message, type: 'error' });
        } finally {
            setIsEditing(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Edit Doctor: {doctor.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
                 <form onSubmit={handleEditSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                            <input type="email" name="email" value={editForm.email} onChange={handleEditFormChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password (optional)</label>
                            <input type="password" name="password" value={editForm.password} onChange={handleEditFormChange} className="w-full p-2 border rounded-md" placeholder="Leave blank to keep same"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                            <SpecialtyDropdown selected={editForm.specialties} onChange={val => setEditForm(p => ({...p, specialties: val}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select name="status" value={editForm.status} onChange={handleEditFormChange} className="w-full p-2 border rounded-md">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <input type="color" name="color" value={editForm.color} onChange={handleEditFormChange} className="w-full h-10 p-1 border rounded-md" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Manage Clinic Assignments *</label>
                        <ClinicCheckboxList clinics={clinics} selected={editForm.selectedClinics} onChange={(id) => setEditForm(p => ({...p, selectedClinics: p.selectedClinics.includes(id) ? p.selectedClinics.filter(i => i !== id) : [...p.selectedClinics, id]}))}/>
                    </div>
                    <StatusMessage message={editStatus.message} type={editStatus.type} />
                    <div className="flex justify-end gap-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200">Cancel</button>
                         <button type="submit" disabled={isEditing} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                            {isEditing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}