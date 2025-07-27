// src/components/SettingsPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api'; 
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

// ✅ NEW: Animated dropdown for specialties
const dentistSpecialties = [
    "General Dentistry",
    "Orthodontics",
    "Pediatric Dentistry",
    "Periodontics",
    "Endodontics",
    "Oral Surgery",
    "Prosthodontics",
];

const SpecialtyDropdown = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSpecialtyToggle = (specialty) => {
        const newSelected = selected.includes(specialty)
            ? selected.filter(s => s !== specialty)
            : [...selected, specialty];
        onChange(newSelected);
    };

    const displayValue = selected.length > 0 ? selected.join(', ') : "Select specialties...";

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left flex justify-between items-center">
                <span className="text-slate-700 truncate">{displayValue}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-2 space-y-1">
                    {dentistSpecialties.map(specialty => (
                        <label key={specialty} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selected.includes(specialty)}
                                onChange={() => handleSpecialtyToggle(specialty)}
                                className="h-4 w-4 rounded text-sky-600 border-gray-300 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700 font-medium">{specialty}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function SettingsPage() {
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [view, setView] = useState('add');

    // State for Add Form
    const [addFullName, setAddFullName] = useState('');
    const [addSpecialties, setAddSpecialties] = useState([]); // Changed from string to array
    const [addSelectedClinics, setAddSelectedClinics] = useState([]);
    const [addStatus, setAddStatus] = useState({ message: '', type: '' });
    const [isAdding, setIsAdding] = useState(false);

    // State for Edit Form
    const [editDoctorId, setEditDoctorId] = useState('');
    const [editSpecialties, setEditSpecialties] = useState([]); // Changed from string to array
    const [editSelectedClinics, setEditSelectedClinics] = useState([]);
    const [editStatus, setEditStatus] = useState({ message: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchAllData = async () => {
        try {
            const [clinicsRes, doctorsRes] = await Promise.all([
                api.get('/clinics'),
                api.get('/doctors/unique')
            ]);
            setClinics(clinicsRes.data);
            setDoctors(doctorsRes.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to load data.';
            setAddStatus({ message: errorMsg, type: 'error' });
            setEditStatus({ message: errorMsg, type: 'error' });
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
            // Split comma-separated string from DB back into an array for the dropdown
            const specialtiesArray = selectedDoctorForEdit.specialty ? selectedDoctorForEdit.specialty.split(', ') : [];
            setEditSpecialties(specialtiesArray);
            setEditSelectedClinics(selectedDoctorForEdit.clinics.map(c => c.id));
        } else {
            setEditSpecialties([]);
            setEditSelectedClinics([]);
        }
    }, [selectedDoctorForEdit]);


    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addFullName.trim() || addSelectedClinics.length === 0) {
            setAddStatus({ message: 'Doctor name and at least one clinic are required.', type: 'error' });
            return;
        }
        setIsAdding(true);
        setAddStatus({ message: '', type: '' });
        try {
            await api.post('/doctors', {
                fullName: addFullName.trim(),
                specialty: addSpecialties.join(', '), // Join array into string for DB
                clinicIds: addSelectedClinics
            });
            setAddStatus({ message: 'Doctor added successfully!', type: 'success' });
            setAddFullName('');
            setAddSpecialties([]);
            setAddSelectedClinics([]);
            fetchAllData(); 
        } catch (err) {
            setAddStatus({ message: err.response?.data?.message || 'An error occurred.', type: 'error' });
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
            await api.put(`/doctors/${editDoctorId}/clinics`, {
                specialty: editSpecialties.join(', '), // Join array into string for DB
                clinicIds: editSelectedClinics
            });
            setEditStatus({ message: 'Doctor updated successfully!', type: 'success' });
            fetchAllData(); 
        } catch (err) {
            setEditStatus({ message: err.response?.data?.message || 'An error occurred.', type: 'error' });
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="p-6 h-full bg-slate-50">
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

            <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md border border-slate-200">
                {view === 'add' && (
                    <form onSubmit={handleAddSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="addFullName" className="block text-sm font-medium text-slate-700 mb-1">Doctor's Full Name</label>
                            <input type="text" id="addFullName" value={addFullName} onChange={(e) => setAddFullName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Dr. Jane Smith" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                            <SpecialtyDropdown selected={addSpecialties} onChange={setAddSpecialties} />
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                                    <SpecialtyDropdown selected={editSpecialties} onChange={setEditSpecialties} />
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