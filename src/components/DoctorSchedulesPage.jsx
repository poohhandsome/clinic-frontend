// src/components/DoctorSchedulesPage.jsx (REPLACE)
import React, { useState, useEffect, useMemo } from 'react';
import authorizedFetch from '../api';
import { FaTag, FaSort, FaSortUp, FaSortDown, FaEdit } from 'react-icons/fa';
import { PlusCircle, Trash2, VenetianMask } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SettingsPage from './SettingsPage';
import EditDoctorModal from './EditDoctorModal'; // <-- Import the new modal

// --- Helper Components & Constants ---
const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, 'name': 'Saturday' }, { id: 0, name: 'Sunday' }
];
const weeksOfMonth = [
    { id: 1, name: '1st' }, { id: 2, name: '2nd' }, { id: 3, name: '3rd' }, { id: 4, name: '4th' }, { id: 5, name: '5th' }
];
const getClinicColor = (clinicId) => {
    const colors = {
        1: { bg: 'bg-sky-100', text: 'text-sky-800' }, 2: { bg: 'bg-green-100', text: 'text-green-800' },
        3: { bg: 'bg-indigo-100', text: 'text-indigo-800' }, default: { bg: 'bg-slate-100', text: 'text-slate-800' }
    };
    return colors[clinicId] || colors.default;
};

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
    const [clinics, setClinics] = useState([]);
    const [editingDoctor, setEditingDoctor] = useState(null); // <-- State for the edit modal
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    const fetchDoctors = () => {
         authorizedFetch('/api/doctors/unique')
            .then(res => res.ok ? res.json() : Promise.reject('Could not fetch doctors.'))
            .then(data => setDoctors(data))
            .catch(err => setError(err.message));
    }
    const fetchClinics = () => {
        authorizedFetch('/api/clinics')
            .then(res => res.ok ? res.json() : Promise.reject('Could not fetch clinics.'))
            .then(setClinics)
            .catch(err => setError(err.message));
    }

    useEffect(() => {
        fetchDoctors();
        fetchClinics();
    }, []);

    const sortedDoctors = useMemo(() => {
        let sortableDoctors = [...doctors];
        if (sortConfig.key !== null) {
            sortableDoctors.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'clinics') {
                    aValue = a.clinics[0]?.name || '';
                    bValue = b.clinics[0]?.name || '';
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableDoctors;
    }, [doctors, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }) => {
        const icon = sortConfig.key === sortKey
            ? (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)
            : <FaSort />;
        return (
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2">
                {label} {icon}
            </button>
        );
    };
    
    const DoctorList = () => (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"><SortableHeader label="Doctor Name" sortKey="name" /></th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"><SortableHeader label="Clinics" sortKey="clinics" /></th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"><SortableHeader label="Status" sortKey="status" /></th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {sortedDoctors.map(doc => (
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
                            <td className="p-3 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => setSelectedDoctor(doc)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200">Manage Timetable</button>
                                <button onClick={() => setEditingDoctor(doc)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold hover:bg-slate-200">Edit</button>
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
                    {editingDoctor && <EditDoctorModal doctor={editingDoctor} clinics={clinics} onClose={() => setEditingDoctor(null)} onUpdate={fetchDoctors} />}
                </>
            ) : <SettingsPage onDataChange={fetchDoctors} />}
        </div>
    );
}

// --- Timetable Manager Components ---
// ... (The rest of this file remains the same as the previous step)
function TimetableManager({ doctor, onClose }) {
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [recurringRules, setRecurringRules] = useState([]);
    const [specialSchedules, setSpecialSchedules] = useState([]);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

    const fetchSchedules = () => {
        Promise.all([
            authorizedFetch(`/api/doctor-availability/${doctor.id}`),
            authorizedFetch(`/api/doctor-rules/${doctor.id}`),
            authorizedFetch(`/api/special-schedules/${doctor.id}`)
        ]).then(async ([availRes, rulesRes, specialRes]) => {
            if (!availRes.ok || !rulesRes.ok || !specialRes.ok) throw new Error('Failed to fetch schedules');
            setWeeklySchedules(await availRes.json());
            setRecurringRules(await rulesRes.json());
            setSpecialSchedules(await specialRes.json());
        }).catch(err => console.error("Error fetching schedules:", err));
    };

    useEffect(fetchSchedules, [doctor]);
    
    const handleDelete = async (type, id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this schedule entry?");
        if (!confirmDelete) return;

        let url = '';
        if (type === 'weekly') { alert('Delete functionality for weekly schedules is not yet implemented.'); return; }
        if (type === 'recurring') url = `/api/doctor-rules/${id}`;
        if (type === 'special') url = `/api/special-schedules/${id}`;

        try {
            const res = await authorizedFetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete schedule entry.');
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
                        {/* Column 1: Forms */}
                        <div className="space-y-6">
                           <WeeklyScheduleForm doctor={doctor} onUpdate={fetchSchedules} />
                           <RecurringScheduleForm doctor={doctor} onUpdate={fetchSchedules} />
                           <div className="bg-slate-50 p-4 rounded-lg border">
                                <h4 className="font-semibold text-slate-700 mb-3">Vacations / Days Off</h4>
                                <button onClick={() => setIsVacationModalOpen(true)} className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600">
                                    <VenetianMask size={16}/> Set Vacation
                                </button>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                     {specialSchedules.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-white border">
                                            <div className="font-semibold text-sm text-red-600">{format(parseISO(s.schedule_date), 'EEE, d MMM yyyy')}</div>
                                            <button onClick={() => handleDelete('special', s.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    {specialSchedules.length === 0 && <p className="text-xs text-center text-slate-400 py-4">No specific days off set.</p>}
                                </div>
                           </div>
                        </div>

                        {/* Column 2: Schedule Overview */}
                        <div className="bg-slate-50 p-4 rounded-lg border">
                           <h4 className="font-semibold text-slate-700 mb-3">Schedule Overview</h4>
                           <ScheduleOverviewTable weekly={weeklySchedules} recurring={recurringRules} onDelete={handleDelete} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function WeeklyScheduleForm({ doctor, onUpdate }) {
    const [form, setForm] = useState({ day_of_week: 1, clinic_id: doctor.clinics[0]?.id || '', start_time: '09:00', end_time: '17:00' });
    const [status, setStatus] = useState({ message: '', type: ''});
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authorizedFetch(`/api/doctor-availability/${doctor.id}`, {
                method: 'POST', body: JSON.stringify({ availability: [form] })
            });
            if (!res.ok) throw new Error('Failed to add schedule.');
            setStatus({ message: 'Weekly schedule added!', type: 'success'});
            onUpdate();
        } catch(err) {
            setStatus({ message: err.message, type: 'error' });
        }
    };
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Add Weekly Schedule</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})} className="p-2 border bg-white rounded-md text-sm">
                        {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select value={form.clinic_id} onChange={e => setForm({...form, clinic_id: parseInt(e.target.value)})} className="p-2 border bg-white rounded-md text-sm">
                         {doctor.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="p-2 border rounded-md text-sm" />
                    <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="p-2 border rounded-md text-sm" />
                </div>
                <StatusMessage message={status.message} type={status.type} />
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700">
                    <PlusCircle size={16}/> Add to Weekly Schedule
                </button>
            </form>
        </div>
    );
}

function RecurringScheduleForm({ doctor, onUpdate }) {
    const [form, setForm] = useState({ day_of_week: 1, clinic_id: doctor.clinics[0]?.id || '', start_time: '09:00', end_time: '17:00' });
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const [status, setStatus] = useState({ message: '', type: ''});

    const handleWeekToggle = (weekId) => {
        setSelectedWeeks(prev => prev.includes(weekId) ? prev.filter(w => w !== weekId) : [...prev, weekId]);
    };

     const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedWeeks.length === 0) {
            setStatus({ message: 'Please select at least one week.', type: 'error' });
            return;
        }
        const payload = { ...form, weeks_of_month: selectedWeeks };
        try {
            const res = await authorizedFetch(`/api/doctor-rules/${doctor.id}`, {
                method: 'POST', body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to add recurring rule.');
            setStatus({ message: 'Recurring rule added!', type: 'success'});
            onUpdate();
        } catch(err) {
            setStatus({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-700 mb-3">Add Recurring Schedule</h4>
             <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})} className="p-2 border bg-white rounded-md text-sm">
                        {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select value={form.clinic_id} onChange={e => setForm({...form, clinic_id: parseInt(e.target.value)})} className="p-2 border bg-white rounded-md text-sm">
                         {doctor.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex flex-wrap gap-2">
                    {weeksOfMonth.map(w => (
                        <button type="button" key={w.id} onClick={() => handleWeekToggle(w.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${selectedWeeks.includes(w.id) ? 'bg-green-600 text-white' : 'bg-white border'}`}>
                            {w.name} Week
                        </button>
                    ))}
                 </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="p-2 border rounded-md text-sm" />
                    <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="p-2 border rounded-md text-sm" />
                </div>
                <StatusMessage message={status.message} type={status.type} />
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700">
                    <PlusCircle size={16}/> Add Recurring Rule
                </button>
            </form>
        </div>
    );
}

function ScheduleOverviewTable({ weekly, recurring, onDelete }) {
    const getWeekSuffix = (n) => ({ '1': 'st', '2': 'nd', '3': 'rd' }[n] || 'th');
    
    return (
        <table className="w-full text-sm">
            <thead className="text-left">
                <tr>
                    <th className="p-2 font-medium text-slate-500">Day</th>
                    <th className="p-2 font-medium text-slate-500">Clinic</th>
                    <th className="p-2 font-medium text-slate-500">Time</th>
                    <th className="p-2 font-medium text-slate-500"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {weekly.map(w => (
                    <tr key={w.id}>
                        <td className="p-2">{daysOfWeek.find(d => d.id === w.day_of_week)?.name}</td>
                        <td className="p-2">{w.clinic_name}</td>
                        <td className="p-2 font-mono">{w.start_time} - {w.end_time}</td>
                        <td className="p-2 text-right"><button onClick={() => onDelete('weekly', w.id)} className="text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                ))}
                {recurring.map(r => (
                    <tr key={r.id}>
                        <td className="p-2">
                            {daysOfWeek.find(d => d.id === r.day_of_week)?.name}
                            <span className="text-xs text-slate-500 ml-1">({r.weeks_of_month.map(w => w + getWeekSuffix(w)).join(', ')})</span>
                        </td>
                        <td className="p-2">{r.clinic_name}</td>
                        <td className="p-2 font-mono">{r.start_time} - {r.end_time}</td>
                        <td className="p-2 text-right"><button onClick={() => onDelete('recurring', r.id)} className="text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
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