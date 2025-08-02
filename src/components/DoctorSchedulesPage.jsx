// src/components/DoctorSchedulesPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import authorizedFetch from '../api';
import { FaTag } from 'react-icons/fa';
import { Clock, PlusCircle, Trash2 } from 'lucide-react';
import SettingsPage from './SettingsPage';

// --- Helper Components & Constants ---
const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, 'name': 'Saturday' }, { id: 0, name: 'Sunday' }
];
const clinicColors = {
    1: { bg: 'bg-sky-100', text: 'text-sky-800' },
    2: { bg: 'bg-green-100', text: 'text-green-800' },
    3: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    default: { bg: 'bg-slate-100', text: 'text-slate-800' }
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
    const [view, setView] = useState('schedule');
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [error, setError] = useState('');

    const fetchDoctors = () => {
         authorizedFetch('/api/doctors/unique')
            .then(res => res.ok ? res.json() : Promise.reject('Could not fetch doctors.'))
            .then(data => setDoctors(data))
            .catch(err => setError(err.message));
    }

    useEffect(fetchDoctors, []);
    
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
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {doc.status}
                                </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                                <div className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: doc.color || '#cccccc' }}></div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => setSelectedDoctor(doc)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200">Manage Timetable</button>
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

            {view === 'schedule' ? (
                <>
                    <DoctorList />
                    {selectedDoctor && <TimetableManager doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />}
                </>
            ) : <SettingsPage onDataChange={fetchDoctors} />}
        </div>
    );
}

// --- Timetable Manager Components ---
function TimetableManager({ doctor, onClose }) {
    const [weeklySchedules, setWeeklySchedules] = useState({});
    const [specialSchedules, setSpecialSchedules] = useState([]);

    const fetchSchedules = () => {
        Promise.all([
            authorizedFetch(`/api/doctor-availability/${doctor.id}`),
            authorizedFetch(`/api/special-schedules/${doctor.id}`)
        ]).then(async ([availRes, specialRes]) => {
            if (!availRes.ok || !specialRes.ok) throw new Error('Failed to fetch schedules');
            const availability = await availRes.json();
            const special = await specialRes.json();

            const groupedByDay = availability.reduce((acc, curr) => {
                const day = curr.day_of_week;
                if (!acc[day]) acc[day] = [];
                acc[day].push({ ...curr, id: Math.random() }); // Add temp id for mapping
                return acc;
            }, {});
            setWeeklySchedules(groupedByDay);
            setSpecialSchedules(special.filter(s => !s.is_available)); // only show vacations/days off
        }).catch(err => console.error("Error fetching schedules:", err));
    };

    useEffect(fetchSchedules, [doctor]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">Manage Timetable for {doctor.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
                    <WeeklyScheduleEditor doctor={doctor} schedules={weeklySchedules} setSchedules={setWeeklySchedules} />
                    <MonthlyScheduleEditor doctor={doctor} onUpdate={fetchSchedules} />
                </div>
            </div>
        </div>
    );
}

function WeeklyScheduleEditor({ doctor, schedules, setSchedules }) {
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleAddRow = (dayId) => {
        const newRow = { id: Math.random(), day_of_week: dayId, clinic_id: doctor.clinics[0]?.id || '', start_time: '09:00', end_time: '17:00' };
        setSchedules(prev => ({ ...prev, [dayId]: [...(prev[dayId] || []), newRow] }));
    };

    const handleRemoveRow = (dayId, rowId) => {
        setSchedules(prev => ({...prev, [dayId]: prev[dayId].filter(row => row.id !== rowId) }));
    };

    const handleRowChange = (dayId, rowId, field, value) => {
        setSchedules(prev => ({
            ...prev,
            [dayId]: prev[dayId].map(row => row.id === rowId ? { ...row, [field]: value } : row)
        }));
    };

    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: ''});
        const availabilityPayload = Object.values(schedules).flat();

        authorizedFetch(`/api/doctor-availability/${doctor.id}`, {
            method: 'POST',
            body: JSON.stringify({ availability: availabilityPayload })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save schedule.');
            setStatus({ message: 'Weekly schedule saved successfully!', type: 'success' });
        })
        .catch(err => setStatus({ message: err.message, type: 'error' }))
        .finally(() => setIsLoading(false));
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Working Hours (Every Week)</h4>
            <div className="space-y-4">
                {daysOfWeek.map(day => (
                    <div key={day.id}>
                        <label className="font-medium text-sm text-slate-600">{day.name}</label>
                        <div className="space-y-2 mt-1">
                            {(schedules[day.id] || []).map(row => (
                                <div key={row.id} className="grid grid-cols-8 gap-2 items-center">
                                    <select value={row.clinic_id} onChange={e => handleRowChange(day.id, row.id, 'clinic_id', parseInt(e.target.value))} className="col-span-3 p-1.5 border rounded-md text-sm">
                                        {doctor.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <input type="time" value={row.start_time} onChange={e => handleRowChange(day.id, row.id, 'start_time', e.target.value)} className="col-span-2 p-1.5 border rounded-md text-sm" />
                                    <input type="time" value={row.end_time} onChange={e => handleRowChange(day.id, row.id, 'end_time', e.target.value)} className="col-span-2 p-1.5 border rounded-md text-sm" />
                                    <button onClick={() => handleRemoveRow(day.id, row.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleAddRow(day.id)} className="mt-2 text-xs flex items-center gap-1 text-sky-600 hover:text-sky-800">
                            <PlusCircle size={14} /> Add Schedule
                        </button>
                    </div>
                ))}
            </div>
            <StatusMessage message={status.message} type={status.type} />
            <button onClick={handleSave} disabled={isLoading} className="mt-4 w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save Weekly Schedule'}
            </button>
        </div>
    );
}

function MonthlyScheduleEditor({ doctor, onUpdate }) {
    const [clinicId, setClinicId] = useState(doctor.clinics[0]?.id || '');
    const [rule, setRule] = useState({ week: '1', day: '0' });
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ message: '', type: ''});
        try {
            const payload = {
                doctor_id: doctor.id, clinic_id: parseInt(clinicId, 10),
                is_available: false, // This form is for setting days OFF
                rule: { week: parseInt(rule.week), day: parseInt(rule.day) },
            };
            const res = await authorizedFetch('/api/special-schedules', { method: 'POST', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to add rule');
            setStatus({ message: 'Recurring day off added for the next 12 months!', type: 'success' });
            onUpdate(); // Refresh the list in the parent
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Recurring Days Off (Monthly)</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-500">Use this to set a specific day of the month as unavailable (e.g., every 1st Sunday).</p>
                <div className="flex gap-2 items-center">
                    <select value={rule.week} onChange={e => setRule({...rule, week: e.target.value})} className="w-full p-2 border rounded-md text-sm">
                        <option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>
                    </select>
                    <select value={rule.day} onChange={e => setRule({...rule, day: e.target.value})} className="w-full p-2 border rounded-md text-sm">
                        {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">For Clinic</label>
                    <select value={clinicId} onChange={e => setClinicId(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                        {doctor.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <StatusMessage message={status.message} type={status.type} />
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-md shadow-sm hover:bg-amber-600 disabled:opacity-50">
                    <PlusCircle size={16}/> {isLoading ? 'Adding Rule...' : 'Add Recurring Day Off'}
                </button>
            </form>
        </div>
    );
}