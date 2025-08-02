// src/components/DoctorSchedulesPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import authorizedFetch from '../api';
import { FaTag } from 'react-icons/fa';
import { PlusCircle, Trash2, VenetianMask } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

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
                acc[day].push({ ...curr, id: Math.random() });
                return acc;
            }, {});
            setWeeklySchedules(groupedByDay);
            setSpecialSchedules(special);
        }).catch(err => console.error("Error fetching schedules:", err));
    };

    useEffect(fetchSchedules, [doctor]);

    const handleDeleteSpecial = async (id) => {
        if (!window.confirm("Are you sure you want to delete this special schedule?")) return;
        try {
            const res = await authorizedFetch(`/api/special-schedules/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete schedule');
            fetchSchedules();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <>
            {isVacationModalOpen && <VacationPlannerModal doctor={doctor} onClose={() => setIsVacationModalOpen(false)} onUpdate={fetchSchedules} />}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-xl font-bold text-slate-800">Manage Timetable for {doctor.name}</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                        <WeeklyScheduleEditor doctor={doctor} schedules={weeklySchedules} setSchedules={setWeeklySchedules} />
                        <RecurringScheduleEditor doctor={doctor} onUpdate={fetchSchedules} />
                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-slate-700 mb-3">Special Dates (Overrides)</h4>
                             <button onClick={() => setIsVacationModalOpen(true)} className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600">
                                <VenetianMask size={16}/> Set Vacation / Specific Day Off
                            </button>
                            <div className="space-y-2">
                                {specialSchedules.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-white border">
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{format(parseISO(s.schedule_date), 'EEE, d MMM yyyy')}</div>
                                            <div className="text-xs text-slate-500">{s.clinic_name}</div>
                                        </div>
                                        <div className={`text-sm font-semibold ${s.is_available ? 'text-green-600' : 'text-red-600'}`}>
                                            {s.is_available ? `${s.start_time} - ${s.end_time}` : 'Unavailable'}
                                        </div>
                                        <button onClick={() => handleDeleteSpecial(s.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {specialSchedules.length === 0 && <p className="text-xs text-center text-slate-400 py-4">No special dates set.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
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
            method: 'POST', body: JSON.stringify({ availability: availabilityPayload })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save schedule.');
            setStatus({ message: 'Weekly schedule saved!', type: 'success' });
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
                                    <select value={row.clinic_id} onChange={e => handleRowChange(day.id, row.id, 'clinic_id', parseInt(e.target.value))} className="col-span-3 p-1.5 border rounded-md text-sm bg-white">
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

function RecurringScheduleEditor({ doctor, onUpdate }) {
    const [clinicId, setClinicId] = useState(doctor.clinics[0]?.id || '');
    const [rule, setRule] = useState({ week: '1', day: '0' });
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ message: '', type: ''});
        try {
            const payload = {
                doctor_id: doctor.id, clinic_id: parseInt(clinicId, 10),
                is_available: true, // This form is for setting days ON
                start_time: startTime, end_time: endTime,
                rule: { week: parseInt(rule.week), day: parseInt(rule.day) },
            };
            const res = await authorizedFetch('/api/special-schedules', { method: 'POST', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to add rule');
            setStatus({ message: 'Recurring schedule added!', type: 'success' });
            onUpdate();
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Recurring Schedule (Monthly)</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-500">Use this for doctors who only work on specific days of the month (e.g., the 1st Sunday only).</p>
                <div className="flex gap-2 items-center">
                    <select value={rule.week} onChange={e => setRule({...rule, week: e.target.value})} className="w-full p-2 border bg-white rounded-md text-sm">
                        <option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>
                    </select>
                    <select value={rule.day} onChange={e => setRule({...rule, day: e.target.value})} className="w-full p-2 border bg-white rounded-md text-sm">
                        {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">At Clinic</label>
                    <select value={clinicId} onChange={e => setClinicId(e.target.value)} className="w-full p-2 border bg-white rounded-md text-sm">
                        {doctor.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Start Time</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-1.5 border rounded-md text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">End Time</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-1.5 border rounded-md text-sm"/>
                    </div>
                </div>
                <StatusMessage message={status.message} type={status.type} />
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50">
                    <PlusCircle size={16}/> {isLoading ? 'Adding Rule...' : 'Add Recurring Schedule'}
                </button>
            </form>
        </div>
    );
}

function VacationPlannerModal({ doctor, onClose, onUpdate }) {
    const [workingDays, setWorkingDays] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        authorizedFetch(`/api/doctor-work-schedule/${doctor.id}`)
            .then(res => res.json())
            .then(data => setWorkingDays(data))
            .catch(err => setStatus({ message: 'Could not load working days.', type: 'error' }))
            .finally(() => setIsLoading(false));
    }, [doctor.id]);

    const handleSelectDay = (day) => {
        setSelectedDays(prev => prev.some(d => d.date === day.date) ? prev.filter(d => d.date !== day.date) : [...prev, day]);
    };

    const handleConfirmVacation = async () => {
        if (selectedDays.length === 0) return;
        setIsLoading(true);
        setStatus({ message: '', type: '' });
        try {
            const vacationPromises = selectedDays.map(day => {
                const payload = {
                    doctor_id: doctor.id, clinic_id: day.clinicId,
                    schedule_date: day.date, is_available: false,
                };
                return authorizedFetch('/api/special-schedules', { method: 'POST', body: JSON.stringify(payload) });
            });
            const results = await Promise.all(vacationPromises);
            if (results.some(res => !res.ok)) throw new Error('One or more vacation days failed to save.');
            onUpdate();
            onClose();
        } catch(err) {
            setStatus({ message: err.message, type: 'error' });
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Vacation Planner for {doctor.name}</h3>
                <p className="text-sm text-slate-500 mb-4">Select one or more upcoming work days to mark as unavailable.</p>
                <div className="border rounded-md max-h-96 overflow-y-auto bg-slate-50 p-3">
                    {isLoading && <div className="text-center p-4 text-sm">Loading working days...</div>}
                    {!isLoading && workingDays.length === 0 && <div className="text-center p-4 text-sm">No upcoming working days found.</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {workingDays.map(day => (
                            <label key={day.date} className={`flex items-start p-3 rounded-md cursor-pointer border-2 ${selectedDays.some(d => d.date === day.date) ? 'border-red-500 bg-red-50' : 'border-transparent bg-white hover:bg-slate-100'}`}>
                                <input type="checkbox" checked={selectedDays.some(d => d.date === day.date)} onChange={() => handleSelectDay(day)} className="h-4 w-4 mt-1 text-red-600 border-gray-300 focus:ring-red-500 shrink-0" />
                                <div className="ml-3">
                                    <div className="font-bold text-slate-800">{format(parseISO(day.date), 'EEE, d MMM yyyy')}</div>
                                    <div className="text-xs text-slate-600 flex items-center gap-1.5"><FaTag size={10}/> {day.clinicName}</div>
                                    <div className="text-xs text-slate-600 flex items-center gap-1.5"><Clock size={10}/> {day.startTime} - {day.endTime}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
                <StatusMessage message={status.message} type={status.type} />
                <div className="flex justify-end gap-3 mt-6">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50" onClick={handleConfirmVacation} disabled={isLoading || selectedDays.length === 0}>
                        {isLoading ? 'Saving...' : `Confirm ${selectedDays.length} Day(s) Off`}
                    </button>
                </div>
            </div>
        </div>
    );
}