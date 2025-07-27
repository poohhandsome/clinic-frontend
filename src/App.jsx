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
import authorizedFetch from './api.js';

import SettingsPage from './components/SettingsPage.jsx'; // Corrected import


const useHashNavigation = () => {
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#login');
    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#login');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    return currentPath;
};

export default function App() {
    const { isAuthenticated, user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [dailySchedule, setDailySchedule] = useState({});
    const [selectedClinic, setSelectedClinic] = useState(1);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [pendingCount, setPendingCount] = useState(0); // State for notification count
    const currentPath = useHashNavigation();

    // Effect for fetching schedule data
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

    // THE FIX: New effect to fetch pending count for notifications
    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const fetchPending = () => {
                authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
                    .then(res => res.json())
                    .then(data => setPendingCount(data.length || 0))
                    .catch(err => console.error("Failed to fetch pending count:", err));
            };
            fetchPending();
            const interval = setInterval(fetchPending, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [selectedClinic, isAuthenticated]);


    if (!isAuthenticated) return <LoginPage />;

    const renderPage = () => {
        const pageProps = { selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, dailySchedule, user };
        switch (currentPath) {
            case '#pending': return <PendingAppointmentsPage {...pageProps} />;
            case '#confirmed': return <ConfirmedAppointmentsPage {...pageProps} />;
            case '#schedules': return <DoctorSchedulesPage {...pageProps} />;
            case '#settings': return <SettingsPage {...pageProps} />; // ✅ ADDED THIS LINE
            default: return <DashboardPage {...pageProps} />;
        }
    };

    return (
        <div className="h-screen w-full bg-white flex flex-col">
            <NewHeader
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                pendingCount={pendingCount} // Pass count to header
            />
            <div className="flex flex-1 overflow-hidden">
                <NewSidebar
                    isSidebarOpen={isSidebarOpen}
                    selectedClinic={selectedClinic}
                    onClinicChange={(id) => setSelectedClinic(Number(id))}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    doctors={doctors}
                    filteredDoctorIds={filteredDoctorIds}
                    setFilteredDoctorIds={setFilteredDoctorIds}
                    dailySchedule={dailySchedule}
                />
                <main className="flex-1 overflow-hidden">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}