// src/components/PatientsPage.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Calendar, List, ChevronLeft, ChevronRight, CheckCircle, XCircle, RefreshCw, UserPlus, Bell } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import AddNewPatientModal from './AddNewPatientModal';
import SearchPatientModal from './SearchPatientModal';
import AppointmentModal from './AppointmentModal';
import authorizedFetch from '../api';
import AppointmentCalendarView from './AppointmentCalendarView';
import AppointmentActionModal from './AppointmentActionModal';
import PendingListModal from './PendingListModal'; // <-- IMPORT NEW MODAL

// --- Helper Components ---
const StatusTag = ({ status }) => {
    const statusMap = {
        'confirmed': { icon: <CheckCircle size={14} />, color: 'text-green-600 bg-green-100', label: 'Confirmed' },
        'cancelled': { icon: <XCircle size={14} />, color: 'text-red-600 bg-red-100', label: 'Cancelled' },
        'rescheduled': { icon: <RefreshCw size={14} />, color: 'text-blue-600 bg-blue-100', label: 'Reschedule' },
        'pending_confirmation': { icon: <RefreshCw size={14} />, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
        'checked-in': { icon: <CheckCircle size={14} />, color: 'text-purple-600 bg-purple-100', label: 'Checked-in' },
    };
    const statusKey = status ? status.toLowerCase() : 'pending_confirmation';
    const { icon, color, label } = statusMap[statusKey] || statusMap['pending_confirmation'];
    return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{icon}{label}</span>;
};

const DoctorTag = ({ name }) => (
    <span className="px-2 py-1 text-xs font-medium bg-sky-100 text-sky-800 rounded-full">{name || 'N/A'}</span>
);

// --- Main Component ---
export default function PatientsPage({ selectedClinic }) {
    const [view, setView] = useState('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allAppointments, setAllAppointments] = useState([]);
    const [doctorsOnDay, setDoctorsOnDay] = useState([]);
    
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false); // <-- New state for modal
    const [appointmentModalData, setAppointmentModalData] = useState(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, action: null, appointment: null });

    const [pendingCount, setPendingCount] = useState(0);

    const [doctorFilter, setDoctorFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAppointments = () => {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        authorizedFetch(`/api/all-appointments?clinic_id=${selectedClinic}&startDate=${dateString}&endDate=${dateString}`)
            .then(res => res.json())
            .then(setAllAppointments)
            .catch(err => console.error("Failed to fetch appointments", err));

        authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
            .then(res => res.json())
            .then(data => setDoctorsOnDay(data.all_doctors_in_clinic || []))
            .catch(err => console.error("Failed to fetch doctors for the day", err));
    };

    const fetchPendingCount = () => {
        authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
            .then(res => res.json())
            .then(data => setPendingCount(data.length || 0))
            .catch(err => console.error("Failed to fetch pending count", err));
    };

    useEffect(fetchAppointments, [currentDate, selectedClinic]);

    useEffect(() => {
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [selectedClinic]);

    const filteredAppointments = useMemo(() => {
        return allAppointments.filter(app => {
            const doctorMatch = doctorFilter === 'all' || app.doctor_id === parseInt(doctorFilter);
            const statusMatch = statusFilter === 'all' || (app.status && app.status.toLowerCase() === statusFilter);
            return doctorMatch && statusMatch;
        });
    }, [allAppointments, doctorFilter, statusFilter]);
    
    const handleSlotClick = (data) => {
        setAppointmentModalData({ ...data, date: currentDate });
        setIsAddAppointmentModalOpen(true);
    };

    const handleActionClick = (action, appointment) => {
        setActionModal({ isOpen: true, action, appointment });
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50">
            <button onClick={() => handleSlotClick({ time: '09:00', doctorId: null })} className="fixed bottom-8 right-8 w-14 h-14 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-700 z-40">
                <Plus size={28} />
            </button>
            
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
                    <button onClick={() => setIsAddPatientModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-sm hover:bg-slate-50 text-sm">
                        <UserPlus size={16} /> Add Patient
                    </button>
                    <button onClick={() => setIsSearchModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-sm hover:bg-slate-50 text-sm">
                        <Search size={16} /> Search Patient
                    </button>
                    <button 
                        onClick={() => setIsPendingModalOpen(true)} 
                        className="relative flex items-center gap-2 px-3 py-1.5 border font-semibold rounded-lg shadow-sm text-sm bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                        <Bell size={16} /> Show Pending
                        {pendingCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'list' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>
                        <List size={16} className="inline mr-1" /> List View
                    </button>
                    <button onClick={() => setView('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'calendar' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>
                        <Calendar size={16} className="inline mr-1" /> Calendar View
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 rounded hover:bg-slate-100"><ChevronLeft size={20}/></button>
                    <input type="date" value={format(currentDate, 'yyyy-MM-dd')} onChange={e => setCurrentDate(new Date(e.target.value))} className="p-2 border rounded-md"/>
                    <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 rounded hover:bg-slate-100"><ChevronRight size={20}/></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm font-semibold border rounded-md hover:bg-slate-50">Today</button>
                    <button onClick={() => setCurrentDate(addDays(new Date(), 1))} className="px-3 py-2 text-sm font-semibold border rounded-md hover:bg-slate-50">Tomorrow</button>
                </div>
                 <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="Search Appointments..." className="w-full pl-10 pr-4 py-2 border rounded-md"/>
                    </div>
                     <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className="p-2 border rounded-md text-sm">
                        <option value="all">All Doctors</option>
                        {doctorsOnDay.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                    </select>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-md text-sm">
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="pending_confirmation">Pending</option>
                        <option value="checked-in">Checked-in</option>
                    </select>
                 </div>
            </div>

            <div className="flex-grow overflow-hidden">
                 {view === 'list' ? (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-full overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">เวลา</th>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">คนไข้</th>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">หมอ</th>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredAppointments.map(app => (
                                    <tr key={app.id}>
                                        <td className="p-3 whitespace-nowrap text-sm font-mono text-slate-700">{app.booking_time}</td>
                                        <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{app.patient_name}</td>
                                        <td className="p-3 whitespace-nowrap"><DoctorTag name={app.doctor_name} /></td>
                                        <td className="p-3 whitespace-nowrap"><StatusTag status={app.status} /></td>
                                        <td className="p-3 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleActionClick('check-in', app)} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200">Check-in</button>
                                            <button onClick={() => handleActionClick('reschedule', app)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200">Reschedule</button>
                                            <button onClick={() => handleActionClick('edit', app)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold hover:bg-slate-200">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAppointments.length === 0 && <p className="text-center text-slate-500 py-8">No appointments match the current filters.</p>}
                    </div>
                 ) : (
                    <AppointmentCalendarView currentDate={currentDate} selectedClinic={selectedClinic} onSlotClick={handleSlotClick} />
                 )}
            </div>
            
            {isAddPatientModalOpen && <AddNewPatientModal onClose={() => setIsAddPatientModalOpen(false)} onUpdate={() => {}} />}
            {isSearchModalOpen && <SearchPatientModal onClose={() => setIsSearchModalOpen(false)} onSelectPatient={() => {}} />}
            {isAddAppointmentModalOpen && <AppointmentModal data={appointmentModalData} clinicId={selectedClinic} onClose={(didBook) => { setIsAddAppointmentModalOpen(false); if(didBook) fetchAppointments(); }} />}
            {actionModal.isOpen && <AppointmentActionModal action={actionModal.action} appointment={actionModal.appointment} doctors={doctorsOnDay} clinicId={selectedClinic} onClose={() => setActionModal({ isOpen: false, action: null, appointment: null })} onUpdate={fetchAppointments} />}
            {isPendingModalOpen && <PendingListModal selectedClinic={selectedClinic} onClose={() => setIsPendingModalOpen(false)} onUpdate={fetchAppointments} />}
        </div>
    );
}