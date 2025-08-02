import React, { useState, useEffect } from 'react';
import { Building, MapPin } from 'lucide-react';

const ClinicCard = ({ clinic, onSelect }) => (
    <div 
        onClick={() => onSelect(clinic.clinic_id)}
        className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer overflow-hidden transform hover:-translate-y-1"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
        <div className="relative p-8 text-white">
            <div className="mb-4">
                <Building size={40} className="opacity-80"/>
            </div>
            <h3 className="text-2xl font-bold mb-2">{clinic.name}</h3>
            <div className="flex items-center text-sm opacity-90 mb-4">
                <MapPin size={16} className="mr-2"/>
                <span>{clinic.address}</span>
            </div>
            <div className="border-t border-white/20 pt-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-semibold">Select this clinic</span>
                <span className="bg-white/30 rounded-full p-2 group-hover:bg-white group-hover:text-sky-600 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
            </div>
        </div>
    </div>
);

export default function ClinicSelectionPage({ onSelectClinic }) {
    const [clinics, setClinics] = React.useState([]);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        // This function will be defined in App.jsx and passed down
        // For now, let's assume it fetches clinics
        const fetchClinics = async () => {
            try {
                const response = await fetch('/api/clinics'); // This will be replaced by authorizedFetch
                if (!response.ok) throw new Error('Could not load clinics.');
                const data = await response.json();
                
                // Manually add full details since /api/clinics is minimal
                const detailedClinics = [
                    { clinic_id: 1, name: 'ศูนย์ทันตกรรมแนวใหม่ สิรินธร', address: '291, ถนนสิรินธร, บางพลัด' },
                    { clinic_id: 2, name: 'ศูนย์ทันตกรรมแนวใหม่ สาย 4', address: '134 หมู่9 ถ. พุทธมณฑลสาย 4' },
                    { clinic_id: 3, name: 'ศูนย์ทันตกรรมแนวใหม่ ราชพฤกษ์', address: '80 2-3 ถ. ราชพฤกษ์' }
                ];
                setClinics(detailedClinics);

            } catch (err) {
                setError(err.message);
            }
        };

        // This component doesn't use authorizedFetch yet because the logic will be moved to App.jsx
        // A placeholder fetch is used to build the UI.
        const demoClinics = [
            { clinic_id: 1, name: 'ศูนย์ทันตกรรมแนวใหม่ สิรินธร', address: '291, ถนนสิรินธร, บางพลัด, กรุงเทพฯ' },
            { clinic_id: 2, name: 'ศูนย์ทันตกรรมแนวใหม่ สาย 4', address: '134 หมู่9 ถ. พุทธมณฑลสาย 4, สามพราน' },
            { clinic_id: 3, name: 'ศูนย์ทันตกรรมแนวใหม่ ราชพฤกษ์', address: '80 ถ. ราชพฤกษ์, บางกรวย, นนทบุรี' }
        ];
        setClinics(demoClinics);


    }, []);


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-800">Select a Clinic</h1>
                <p className="text-slate-500 mt-2">Choose your location to continue to the dashboard.</p>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {clinics.map(clinic => (
                    <ClinicCard key={clinic.clinic_id} clinic={clinic} onSelect={onSelectClinic} />
                ))}
            </div>
             <footer className="text-center mt-12 text-slate-400 text-sm">
                Newtrend Dental Group | Admin Panel
            </footer>
        </div>
    );
}