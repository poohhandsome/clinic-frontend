// src/components/PatientInfoColumn.jsx (NEW FILE)

import React, { useState } from 'react';
import { User, Search, AlertTriangle, Baby, Stethoscope } from 'lucide-react';
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import SearchPatientModal from './SearchPatientModal'; // Import the existing modal

// Helper function to calculate detailed age
const calculateAge = (dob) => {
    if (!dob) return { years: 0, months: 0, days: 0 };
    const now = new Date();
    const birthDate = new Date(dob);
    const years = differenceInYears(now, birthDate);
    const months = differenceInMonths(now, birthDate) % 12;
    const days = differenceInDays(now, new Date(now.getFullYear(), now.getMonth(), birthDate.getDate()));
    return { years, months, days: Math.abs(days) };
};

export default function PatientInfoColumn({ patient, onPatientSelect }) {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const age = patient ? calculateAge(patient.date_of_birth) : null;

    const handleSelectAndClose = (selectedPatient) => {
        onPatientSelect(selectedPatient);
        setIsSearchModalOpen(false);
    };

    return (
        <>
            {isSearchModalOpen && <SearchPatientModal onClose={() => setIsSearchModalOpen(false)} onSelectPatient={handleSelectAndClose} />}
            <aside className="w-80 bg-white p-4 border-r border-slate-200 flex flex-col gap-4">
                {/* Photo Section */}
                <div className="flex justify-center">
                    <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                        {patient ? <span className="text-4xl font-bold">{patient.first_name_th.charAt(0)}</span> : <User size={64} />}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="space-y-2">
                    <div className="p-2 bg-red-100 text-red-800 rounded-lg text-sm flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Extreme Care:</strong> {patient?.extreme_care_drugs || "None"}</div>
                    </div>
                    <div className="p-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
                        <Stethoscope size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Allergies:</strong> {patient?.allergies || "None"}</div>
                    </div>
                     <div className="p-2 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-start gap-2">
                        <Baby size={16} className="flex-shrink-0 mt-0.5" />
                        <div><strong>Pregnancy:</strong> {patient?.is_pregnant ? "Yes" : "No"}</div>
                    </div>
                </div>

                {/* Patient Details Section */}
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
                        <span>{patient ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <strong className="w-24">Age:</strong>
                        <span>{age ? `${age.years}Y ${age.months}M ${age.days}D` : 'N/A'}</span>
                    </div>
                     <div className="flex">
                        <strong className="w-24">Check-in:</strong>
                        <span>{format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                </div>
            </aside>
        </>
    );
}