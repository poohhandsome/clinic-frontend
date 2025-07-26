// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { format } from 'date-fns';
import LoginPage from './components/LoginPage.jsx';
import NewHeader from './components/NewUILayout/NewHeader.jsx'; // <-- Import new header
import NewSidebar from './components/NewUILayout/NewSidebar.jsx'; // <-- Import new sidebar
import DashboardPage from './components/DashboardPage.jsx';
import PendingAppointmentsPage from './components/PendingAppointmentsPage.jsx';
import DoctorSchedulesPage from './components/DoctorSchedulesPage.jsx';
import ConfirmedAppointmentsPage from './components/ConfirmedAppointmentsPage.jsx';
import authorizedFetch from './api.js';

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
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [dailySchedule, setDailySchedule] = useState({});
    const [selectedClinic, setSelectedClinic] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const currentPath = useHashNavigation();

    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/api/clinics').then(res => res.json()).then(data => {
                setClinics(data);
                if (data.length > 0 && !selectedClinic) setSelectedClinic(data[0].id);
            });
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

    if (!isAuthenticated) return <LoginPage />;

    const renderPage = () => {
        const pageProps = { selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, dailySchedule, user };
        switch (currentPath) {
            case '#pending': return <PendingAppointmentsPage {...pageProps} />;
            case '#confirmed': return <ConfirmedAppointmentsPage {...pageProps} />;
            case '#schedules': return <DoctorSchedulesPage {...pageProps} />;
            default: return <DashboardPage {...pageProps} />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-100">
            <NewSidebar
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                doctors={doctors}
                filteredDoctorIds={filteredDoctorIds}
                setFilteredDoctorIds={setFilteredDoctorIds}
                dailySchedule={dailySchedule}
            />
            <div className="flex-1 flex flex-col">
                <NewHeader currentDate={currentDate} setCurrentDate={setCurrentDate} />
                <main className="flex-1 overflow-hidden p-4">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}