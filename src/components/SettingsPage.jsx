// src/components/SettingsPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import authorizedFetch from '../api';
import { ChevronDown } from 'lucide-react';

// --- Helper Components ---

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
    // ... (This component remains unchanged)
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
            <div className={`absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-10 overflow-auto transition-all ${isOpen ? 'max-h-60' : 'max-h-0 opacity-0'}`}>
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


// --- Main Component ---
export default function SettingsPage({ onDataChange }) {
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [view, setView] = useState('add');

    // Add Form State
    const [addForm, setAddForm] = useState({
        fullName: '', specialties: [], selectedClinics: [],
        email: '', password: '', color: '#4299e1', status: 'active'
    });
    const [addStatus, setAddStatus] = useState({ message: '', type: '' });
    const [isAdding, setIsAdding] = useState(false);

    // Edit Form State
    const [editDoctorId, setEditDoctorId] = useState('');
    const [editForm, setEditForm] = useState({
        specialties: [], selectedClinics: [], email: '',
        color: '#4299e1', status: 'active', password: ''
    });
    const [editStatus, setEditStatus] = useState({ message: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);
    
    const fetchAllData = async () => {
        try {
            const [clinicsRes, doctorsRes] = await Promise.all([
                authorizedFetch('/api/clinics'),
                authorizedFetch('/api/doctors/unique')
            ]);
            if (!clinicsRes.ok || !doctorsRes.ok) throw new Error('Failed to load initial data.');
            
            setClinics(await clinicsRes.json());
            setDoctors(await doctorsRes.json());
        } catch (err) {
            setAddStatus({ message: err.message, type: 'error' });
            setEditStatus({ message: err.message, type: 'error' });
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const selectedDoctorForEdit = useMemo(() => 
        doctors.find(d => d.id === parseInt(editDoctorId, 10)),
    [doctors, editDoctorId]);

    useEffect(() => {
        if (selectedDoctorForEdit) {
            setEditForm({
                specialties: selectedDoctorForEdit.specialty ? selectedDoctorForEdit.specialty.split(', ') : [],
                selectedClinics: selectedDoctorForEdit.clinics.map(c => c.id),
                email: selectedDoctorForEdit.email || '',
                color: selectedDoctorForEdit.color || '#4299e1',
                status: selectedDoctorForEdit.status || 'active',
                password: '' // Don't pre-fill password
            });
        }
    }, [selectedDoctorForEdit]);


    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.fullName.trim() || addForm.selectedClinics.length === 0 || !addForm.email || !addForm.password) {
            setAddStatus({ message: 'Name, clinic, email, and password are required.', type: 'error' });
            return;
        }
        setIsAdding(true);
        setAddStatus({ message: '', type: '' });
        try {
            const payload = {
                fullName: addForm.fullName.trim(),
                specialty: addForm.specialties.join(', '),
                clinicIds: addForm.selectedClinics,
                email: addForm.email,
                password: addForm.password,
                color: addForm.color,
                status: addForm.status
            };
            const res = await authorizedFetch('/api/doctors', { method: 'POST', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to add doctor');
            
            setAddStatus({ message: 'Doctor added successfully!', type: 'success' });
            setAddForm({ fullName: '', specialties: [], selectedClinics: [], email: '', password: '', color: '#4299e1', status: 'active' });
            onDataChange(); // Notify parent to re-fetch doctor list
        } catch (err) {
            setAddStatus({ message: err.message, type: 'error' });
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editDoctorId) return;
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
            // Only include password if it's changed
            if(editForm.password) {
                payload.password = editForm.password;
            }
            const res = await authorizedFetch(`/api/doctors/${editDoctorId}/clinics`, { method: 'PUT', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to update doctor');

            setEditStatus({ message: 'Doctor updated successfully!', type: 'success' });
            onDataChange(); // Notify parent to re-fetch doctor list
            fetchAllData(); // Re-fetch all data for this component
        } catch (err) {
            setEditStatus({ message: err.message, type: 'error' });
        } finally {
            setIsEditing(false);
        }
    };
    
    const handleAddFormChange = (e) => setAddForm(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleEditFormChange = (e) => setEditForm(prev => ({...prev, [e.target.name]: e.target.value}));

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setView('add')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'add' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Add Doctor
                    </button>
                    <button onClick={() => setView('edit')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'edit' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Edit Doctor
                    </button>
                </nav>
            </div>

            <div>
                {view === 'add' && (
                    <form onSubmit={handleAddSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                <input type="text" name="fullName" value={addForm.fullName} onChange={handleAddFormChange} className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                <input type="email" name="email" value={addForm.email} onChange={handleAddFormChange} className="w-full p-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                <input type="password" name="password" value={addForm.password} onChange={handleAddFormChange} className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                                <SpecialtyDropdown selected={addForm.specialties} onChange={val => setAddForm(p => ({...p, specialties: val}))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select name="status" value={addForm.status} onChange={handleAddFormChange} className="w-full p-2 border rounded-md">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                    <input type="color" name="color" value={addForm.color} onChange={handleAddFormChange} className="w-full h-10 p-1 border rounded-md" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Clinics *</label>
                            <ClinicCheckboxList clinics={clinics} selected={addForm.selectedClinics} onChange={(id) => setAddForm(p => ({...p, selectedClinics: p.selectedClinics.includes(id) ? p.selectedClinics.filter(i => i !== id) : [...p.selectedClinics, id]}))} />
                        </div>
                        <StatusMessage message={addStatus.message} type={addStatus.type} />
                        <button type="submit" disabled={isAdding} className="w-full px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50">
                            {isAdding ? 'Adding...' : 'Add Doctor'}
                        </button>
                    </form>
                )}

                {view === 'edit' && (
                    <form onSubmit={handleEditSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor to Edit</label>
                            <select value={editDoctorId} onChange={e => setEditDoctorId(e.target.value)} className="w-full p-2 border rounded-md">
                                <option value="">-- Please Select --</option>
                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                            </select>
                        </div>

                        {editDoctorId && (
                            <>
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
                                <button type="submit" disabled={isEditing} className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                                    {isEditing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}