// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { format } from 'date-fns';
import LoginPage from './components/LoginPage.jsx';
import NewHeader from './components/NewUILayout/NewHeader.jsx';
import NewSidebar from './components/NewUILayout/NewSidebar.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import PendingAppointmentsPage from './components/PendingAppointmentsPage.jsx';
import DoctorSchedulesPage from './components/DoctorSchedulesPage.jsx';
import ConfirmedAppointmentsPage from './components/ConfirmedAppointmentsPage.jsx';
import PatientsPage from './components/PatientsPage.jsx';
import TreatmentPlanPage from './components/TreatmentPlanPage.jsx'; // Make sure this is imported
import authorizedFetch from './api.js';
import SettingsPage from './components/SettingsPage.jsx';
import ClinicSelectionPage from './components/ClinicSelectionPage.jsx';

const useHashNavigation = () => {
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#login');
    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#dashboard');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    return currentPath;
};

const PlaceholderPage = ({ title }) => (
    <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        <p className="mt-4 text-slate-600">This page is under construction. Content will be added soon.</p>
    </div>
);


export default function App() {
    const { isAuthenticated, user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [dailySchedule, setDailySchedule] = useState({});
    const [allClinics, setAllClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(() => {
        const savedClinic = localStorage.getItem('selectedClinic');
        return savedClinic ? Number(savedClinic) : null;
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0); 
    const currentPath = useHashNavigation();

    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/api/clinics')
                .then(res => res.json())
                .then(setAllClinics)
                .catch(err => console.error("Failed to fetch clinics", err));
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json()).then(data => {
                    const allDocs = data.all_doctors_in_clinic || data.doctors || [];
                    const scheduleMap = (data.doctors || []).reduce((acc, doc) => {
                        if (doc.start_time && doc.end_time) acc[doc.id] = { startTime: doc.start_time, endTime: doc.end_time };
                        return acc;
                    }, {});
                    setDoctors(allDocs);
                    setDailySchedule(scheduleMap);
                    setFilteredDoctorIds(Object.keys(scheduleMap).map(id => parseInt(id, 10)));
                });
        }
    }, [selectedClinic, currentDate, isAuthenticated]);

    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const fetchPending = () => {
                authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
                    .then(res => res.json())
                    .then(data => setPendingCount(data.length || 0))
                    .catch(err => console.error("Failed to fetch pending count:", err));
            };
            fetchPending();
            const interval = setInterval(fetchPending, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedClinic, isAuthenticated]);

    const handleClinicSelect = (clinicId) => {
        setSelectedClinic(clinicId);
        localStorage.setItem('selectedClinic', clinicId);
        window.location.hash = '#dashboard';
    };

    const handleChangeClinic = () => {
        setSelectedClinic(null);
        localStorage.removeItem('selectedClinic');
    };

    if (!isAuthenticated) return <LoginPage />;
    
    if (!selectedClinic) {
        return <ClinicSelectionPage clinics={allClinics} onSelectClinic={handleClinicSelect} />;
    }

    const renderPage = () => {
        const dashboardProps = { selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, setFilteredDoctorIds, dailySchedule, user };
        const otherPageProps = { selectedClinic, user };

        // **THE FIX IS HERE**: Handle dynamic routes for treatment plans
        if (currentPath.startsWith('#/treatment-plan/')) {
            const patientId = currentPath.split('/')[2];
            return <TreatmentPlanPage {...otherPageProps} patientId={patientId} />;
        }

        switch (currentPath) {
            case '#dashboard': return <DashboardPage {...dashboardProps} />;
            case '#clinic-dashboard': return <PlaceholderPage title="Clinic Dashboard" />;
            case '#appointments': return <PatientsPage {...otherPageProps} />;
            case '#doctors': return <DoctorSchedulesPage {...otherPageProps} />;
            case '#treatments': return <PlaceholderPage title="Treatments Management" />;
            case '#billing': return <PlaceholderPage title="Billing Management" />;
            case '#lab-costs': return <PlaceholderPage title="Lab Costs Management" />;
            case '#summary': return <PlaceholderPage title="Summary" />;
            case '#pending': return <PendingAppointmentsPage {...otherPageProps} />;
            case '#confirmed': return <ConfirmedAppointmentsPage {...otherPageProps} />;
            case '#schedules': return <DoctorSchedulesPage {...otherPageProps} />;
            case '#settings': return <SettingsPage {...otherPageProps} />;
            default: return <DashboardPage {...dashboardProps} />;
        }
    };

    const selectedClinicName = allClinics.find(c => c.id === selectedClinic)?.name || 'Unknown Clinic';

    return (
        <div className="flex h-screen bg-slate-50">
            <NewSidebar 
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                currentPath={currentPath}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <NewHeader 
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    currentDate={currentDate} 
                    setCurrentDate={setCurrentDate} 
                    pendingCount={pendingCount}
                    selectedClinicName={selectedClinicName}
                    onChangeClinic={handleChangeClinic}
                />
                <main className="flex-1 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}