// src/components/PatientInfoColumn.jsx (REPLACE)

import React, { useState } from 'react';
import { User, Search, AlertTriangle, Baby, Stethoscope, ChevronDown, Edit } from 'lucide-react';
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import SearchPatientModal from './SearchPatientModal';
import EditPatientModal from './EditPatientModal'; // <-- IMPORT THE NEW MODAL

// ... (calculateAge and AlertsDropdown helpers remain the same)
const calculateAge = (dob) => {
    if (!dob) return { years: 0, months: 0, days: 0 };
    const now = new Date();
    const birthDate = new Date(dob);
    const years = differenceInYears(now, birthDate);
    const months = differenceInMonths(now, birthDate) % 12;
    const days = differenceInDays(now, new Date(now.getFullYear(), now.getMonth(), birthDate.getDate()));
    return { years, months, days: Math.abs(days) };
};

const AlertsDropdown = ({ patient }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasExtremeCare = !!patient?.extreme_care_drugs;
    const hasAllergies = !!patient?.allergies;
    const isPregnant = !!patient?.is_pregnant;
    const showAlertIcon = hasExtremeCare || hasAllergies || isPregnant;

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="w-full flex justify-between items-center p-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-700 border hover:border-slate-400 transition-colors">
                <span>Patient Alerts</span>
                {showAlertIcon && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg z-20 p-2 space-y-2">
                    <div className={`p-2 rounded-md text-sm flex items-start gap-2 ${hasExtremeCare ? 'bg-red-100 text-red-800' : 'bg-slate-50 text-slate-500'}`}>
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Extreme Care:</strong> {patient?.extreme_care_drugs || "None"}</div>
                    </div>
                    <div className={`p-2 rounded-md text-sm flex items-start gap-2 ${hasAllergies ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-50 text-slate-500'}`}>
                        <Stethoscope size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Allergies:</strong> {patient?.allergies || "None"}</div>
                    </div>
                     <div className={`p-2 rounded-md text-sm flex items-start gap-2 ${isPregnant ? 'bg-blue-100 text-blue-800' : 'bg-slate-50 text-slate-500'}`}>
                        <Baby size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Pregnancy:</strong> {isPregnant ? "Yes" : "No"}</div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default function PatientInfoColumn({ patient, onPatientSelect, checkInTime }) {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // <-- NEW STATE FOR EDIT MODAL

    const age = patient ? calculateAge(patient.date_of_birth) : null;

    const handleSelectAndClose = (selectedPatient) => {
        onPatientSelect(selectedPatient);
        setIsSearchModalOpen(false);
    };
    
    // NEW: Function to handle the update from the modal
    const handlePatientUpdate = (updatedPatient) => {
        onPatientSelect(updatedPatient); // Re-select the patient to refresh data everywhere
    };

    return (
        <>
            {isSearchModalOpen && <SearchPatientModal onClose={() => setIsSearchModalOpen(false)} onSelectPatient={handleSelectAndClose} />}
            {/* NEW: Render the EditPatientModal when its state is true */}
            {isEditModalOpen && <EditPatientModal patient={patient} onClose={() => setIsEditModalOpen(false)} onUpdate={handlePatientUpdate} />}
            
            <aside className="w-80 bg-white p-4 border-r border-slate-200 flex flex-col gap-4">
                <div className="flex justify-center">
                    <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                        {patient ? <span className="text-4xl font-bold">{patient.first_name_th?.charAt(0)}</span> : <User size={64} />}
                    </div>
                </div>
                
                <AlertsDropdown patient={patient} />

                <div className="bg-slate-50 p-3 rounded-lg border space-y-2 text-sm">
                    <div className="flex items-center">
                        <strong className="w-24">DN:</strong>
                        <div className="flex-grow flex items-center justify-between">
                            <span>{patient?.dn || 'N/A'}</span>
                            <button onClick={() => setIsSearchModalOpen(true)} className="p-1 hover:bg-slate-200 rounded-full">
                                <Search size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex">
                        <strong className="w-24">Name:</strong>
                        <span>{patient ? `${patient.first_name_th} ${patient.last_name_th}` : 'Please select a patient'}</span>
                    </div>
                    <div className="flex">
                        <strong className="w-24">Sex:</strong>
                        <span>{patient?.gender || 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <strong className="w-24">Birth Date:</strong>
                        <span>{patient?.date_of_birth ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <strong className="w-24">Age:</strong>
                        <span>{age ? `${age.years}Y ${age.months}M ${age.days}D` : 'N/A'}</span>
                    </div>
                     <div className="flex">
                        <strong className="w-24">Check-in:</strong>
                        <span>{checkInTime ? format(new Date(checkInTime), 'dd MMM yyyy, HH:mm') : 'Not checked in'}</span>
                    </div>
                </div>

                {patient && (
                    // NEW: This button now opens the edit modal
                    <button onClick={() => setIsEditModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg shadow-sm border border-slate-200 hover:bg-slate-100">
                        <Edit size={16} /> Edit Patient Info
                    </button>
                )}
            </aside>
        </>
    );
}