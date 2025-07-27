// src/components/SettingsPage.jsx (NEW FILE)

import React, { useState, useEffect, useMemo } from 'react';
import authorizedFetch from '../api';

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


// --- Main Page Component ---
export default function SettingsPage() {
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [view, setView] = useState('add'); // 'add' or 'edit'

    // State for Add Form
    const [addFullName, setAddFullName] = useState('');
    const [addSpecialty, setAddSpecialty] = useState('');
    const [addSelectedClinics, setAddSelectedClinics] = useState([]);
    const [addStatus, setAddStatus] = useState({ message: '', type: '' });
    const [isAdding, setIsAdding] = useState(false);

    // State for Edit Form
    const [editDoctorId, setEditDoctorId] = useState('');
    const [editSpecialty, setEditSpecialty] = useState('');
    const [editSelectedClinics, setEditSelectedClinics] = useState([]);
    const [editStatus, setEditStatus] = useState({ message: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchAllData = async () => {
        try {
            const [clinicsRes, doctorsRes] = await Promise.all([
                authorizedFetch('/api/clinics'),
                authorizedFetch('/api/doctors/unique')
            ]);
            if (!clinicsRes.ok || !doctorsRes.ok) throw new Error('Failed to load data.');
            const clinicsData = await clinicsRes.json();
            const doctorsData = await doctorsRes.json();
            setClinics(clinicsData);
            setDoctors(doctorsData);
        } catch (err) {
            setAddStatus({ message: err.message, type: 'error' });
            setEditStatus({ message: err.message, type: 'error' });
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Memoize the selected doctor to avoid re-calculating on every render
    const selectedDoctorForEdit = useMemo(() => 
        doctors.find(d => d.id === parseInt(editDoctorId, 10)),
    [doctors, editDoctorId]);

    // Effect to update the edit form when a doctor is selected
    useEffect(() => {
        if (selectedDoctorForEdit) {
            setEditSpecialty(selectedDoctorForEdit.specialty || '');
            setEditSelectedClinics(selectedDoctorForEdit.clinics.map(c => c.id));
        } else {
            setEditSpecialty('');
            setEditSelectedClinics([]);
        }
    }, [selectedDoctorForEdit]);


    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addFullName || addSelectedClinics.length === 0) {
            setAddStatus({ message: 'Doctor name and at least one clinic are required.', type: 'error' });
            return;
        }
        setIsAdding(true);
        setAddStatus({ message: '', type: '' });
        try {
            const res = await authorizedFetch('/api/doctors', {
                method: 'POST',
                body: JSON.stringify({ fullName: addFullName, specialty: addSpecialty, clinicIds: addSelectedClinics }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to add doctor');
            }
            setAddStatus({ message: 'Doctor added successfully!', type: 'success' });
            setAddFullName('');
            setAddSpecialty('');
            setAddSelectedClinics([]);
            fetchAllData(); // Refresh doctor list
        } catch (err) {
            setAddStatus({ message: err.message, type: 'error' });
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editDoctorId) {
            setEditStatus({ message: 'Please select a doctor.', type: 'error' });
            return;
        }
        setIsEditing(true);
        setEditStatus({ message: '', type: '' });
        try {
            const res = await authorizedFetch(`/api/doctors/${editDoctorId}/clinics`, {
                method: 'PUT',
                body: JSON.stringify({ specialty: editSpecialty, clinicIds: editSelectedClinics }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update doctor');
            }
            setEditStatus({ message: 'Doctor updated successfully!', type: 'success' });
            fetchAllData(); // Refresh doctor list
        } catch (err) {
            setEditStatus({ message: err.message, type: 'error' });
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="p-6 h-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Doctor Management</h2>
            <p className="text-slate-500 mb-6">Add a new doctor or edit clinic assignments for an existing doctor.</p>

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

            <div className="max-w-xl mx-auto">
                {/* Add Doctor View */}
                {view === 'add' && (
                    <form onSubmit={handleAddSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="addFullName" className="block text-sm font-medium text-slate-700 mb-1">Doctor's Full Name</label>
                            <input type="text" id="addFullName" value={addFullName} onChange={(e) => setAddFullName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Dr. Jane Smith" />
                        </div>
                        <div>
                            <label htmlFor="addSpecialty" className="block text-sm font-medium text-slate-700 mb-1">Specialty (Optional)</label>
                            <input type="text" id="addSpecialty" value={addSpecialty} onChange={(e) => setAddSpecialty(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Dentist" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Clinics</label>
                            <ClinicCheckboxList clinics={clinics} selected={addSelectedClinics} onChange={(id) => setAddSelectedClinics(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} />
                        </div>
                        <StatusMessage message={addStatus.message} type={addStatus.type} />
                        <button type="submit" disabled={isAdding} className="w-full px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50">
                            {isAdding ? 'Adding...' : 'Add Doctor'}
                        </button>
                    </form>
                )}

                {/* Edit Doctor View */}
                {view === 'edit' && (
                    <form onSubmit={handleEditSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="doctor-select" className="block text-sm font-medium text-slate-700 mb-1">Select Doctor to Edit</label>
                            <select id="doctor-select" value={editDoctorId} onChange={e => setEditDoctorId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500">
                                <option value="">-- Please Select --</option>
                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                            </select>
                        </div>

                        {editDoctorId && (
                            <>
                                <div>
                                    <label htmlFor="editSpecialty" className="block text-sm font-medium text-slate-700 mb-1">Specialty (Optional)</label>
                                    <input type="text" id="editSpecialty" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Dentist" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Manage Clinic Assignments</label>
                                    <ClinicCheckboxList clinics={clinics} selected={editSelectedClinics} onChange={(id) => setEditSelectedClinics(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} />
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