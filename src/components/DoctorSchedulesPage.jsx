// src/components/DoctorSchedulesPage.jsx (REPLACE)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import authorizedFetch from '../api';
import { FaTag, FaEdit } from 'react-icons/fa';
import { Clock, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SettingsPage from './SettingsPage';

// --- Helper Components & Constants ---
const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, 'name': 'Saturday' }, { id: 0, name: 'Sunday' }
];
const clinicColors = {
    1: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-500' },
    2: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
    3: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500' },
    default: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-500' }
};
const getClinicColor = (clinicId) => clinicColors[clinicId] || clinicColors.default;

const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "p-3 rounded-md my-4 font-medium text-sm";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};


// --- Main Page Component ---
export default function DoctorSchedulesPage() {
    const [view, setView] = useState('schedule'); // 'schedule' or 'settings'
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [error, setError] = useState('');

    const fetchDoctors = () => {
         authorizedFetch('/api/doctors/unique')
            .then(res => {
                if (!res.ok) throw new Error('Could not fetch doctors.');
                return res.json();
            })
            .then(data => setDoctors(data))
            .catch(err => setError(err.message));
    }

    useEffect(() => {
        fetchDoctors();
    }, []);
    
    const handleManageTimetable = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const DoctorList = () => (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor Name</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinics</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {doctors.map(doc => (
                        <tr key={doc.id}>
                            <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{doc.name}</td>
                            <td className="p-3 text-sm text-slate-700">
                                <div className="flex flex-wrap gap-1">
                                    {doc.clinics.map(clinic => {
                                        const color = getClinicColor(clinic.id);
                                        return <span key={clinic.id} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color.bg} ${color.text}`}>{clinic.name}</span>;
                                    })}
                                </div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {doc.status}
                                </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                                <div className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: doc.color || '#cccccc' }}></div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => handleManageTimetable(doc)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200">Manage Timetable</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {doctors.length === 0 && !error && <p className="text-center text-slate-500 py-8">Loading doctors...</p>}
        </div>
    );

    return (
        <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Manage Doctors</h2>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setView('schedule')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'schedule' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Doctor Schedule
                    </button>
                    <button onClick={() => setView('settings')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'settings' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Doctors Setting
                    </button>
                </nav>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

            {view === 'schedule' && (
                <>
                    <DoctorList />
                    {selectedDoctor && (
                        <TimetableManager 
                            doctor={selectedDoctor} 
                            onClose={() => setSelectedDoctor(null)}
                        />
                    )}
                </>
            )}

            {view === 'settings' && <SettingsPage onDataChange={fetchDoctors} />}
        </div>
    );
}


// --- Timetable Manager Component ---
function TimetableManager({ doctor, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Manage Timetable for {doctor.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <WeeklyScheduleEditor doctor={doctor} />
                    <MonthlyScheduleEditor doctor={doctor} />
                </div>
            </div>
        </div>
    );
}

function WeeklyScheduleEditor({ doctor }) {
    // This state will hold schedules like: { 1: [{ start: '09:00', end: '12:00', clinic_id: 1 }] }
    const [weeklySchedules, setWeeklySchedules] = useState({}); 

    const handleAddRow = (dayId) => {
        const newRow = { clinic_id: doctor.clinics[0]?.id || '', start_time: '09:00', end_time: '17:00' };
        setWeeklySchedules(prev => ({
            ...prev,
            [dayId]: [...(prev[dayId] || []), newRow]
        }));
    };
    // ... more logic to come for saving, deleting, and editing rows

    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Working Hours (Every Week)</h4>
            <div className="space-y-4">
                {daysOfWeek.map(day => (
                    <div key={day.id}>
                        <label className="font-medium text-sm text-slate-600">{day.name}</label>
                        {/* Render existing schedules here */}
                        <button onClick={() => handleAddRow(day.id)} className="mt-1 text-xs flex items-center gap-1 text-sky-600 hover:text-sky-800">
                            <PlusCircle size={14} /> Add Schedule
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MonthlyScheduleEditor({ doctor }) {
    // ... logic for monthly schedules
    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Working Hours (Vary by Week)</h4>
            <p className="text-sm text-slate-500">Feature coming soon...</p>
        </div>
    )
}