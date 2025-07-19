// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { format } from 'date-fns';
import LoginPage from './components/LoginPage.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
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
    const [allDoctorsForClinic, setAllDoctorsForClinic] = useState([]); // For the schedules page
    const [selectedClinic, setSelectedClinic] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const currentPath = useHashNavigation();

    // Effect to fetch the list of available clinics
    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/clinics')
                .then(res => res.json())
                .then(data => {
                    setClinics(data);
                    if (data.length > 0 && !selectedClinic) {
                        setSelectedClinic(data[0].id);
                    }
                });
        }
    }, [isAuthenticated]);

    // Effect to fetch the schedule for a specific day when clinic or date changes
    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => {
                    const workingDoctors = data.doctors.filter(doc => doc.start_time && doc.end_time);
                    setDoctors(workingDoctors);
                    setFilteredDoctorIds(workingDoctors.map(d => d.id));
                    
                    // Also store a full list of all doctors for the DoctorSchedulesPage
                    if (!allDoctorsForClinic.length) {
                         setAllDoctorsForClinic(data.all_doctors_in_clinic || data.doctors);
                    }
                });
        }
    }, [selectedClinic, currentDate, isAuthenticated]);

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const renderPage = () => {
        const pageProps = {
            selectedClinic,
            currentDate,
            setCurrentDate,
            doctors,
            filteredDoctorIds,
            user
        };
        if (currentPath === '#login' || currentPath === '') window.location.hash = '#dashboard';

        switch (currentPath) {
            case '#dashboard': return <DashboardPage {...pageProps} />;
            case '#pending': return <PendingAppointmentsPage {...pageProps} />;
            case '#confirmed': return <ConfirmedAppointmentsPage {...pageProps} />;
            case '#schedules': return <DoctorSchedulesPage {...pageProps} doctors={allDoctorsForClinic} />;
            default: return <DashboardPage {...pageProps} />;
        }
    };

    const showSidebar = currentPath === '#dashboard';

    return (
        <div className="h-screen w-full bg-slate-50">
            <div className={`h-full w-full grid ${showSidebar ? 'grid-cols-[18rem_1fr]' : 'grid-cols-[1fr]'} grid-rows-[auto_1fr]`}>
                <header className="col-span-full row-start-1">
                    <Header
                        clinics={clinics}
                        selectedClinic={selectedClinic}
                        onClinicChange={setSelectedClinic}
                    />
                </header>

                {showSidebar && (
                     <div className="row-start-2 overflow-y-auto">
                        <Sidebar
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            doctors={doctors}
                            filteredDoctorIds={filteredDoctorIds}
                            setFilteredDoctorIds={setFilteredDoctorIds}
                        />
                    </div>
                )}

                <main className="row-start-2 overflow-y-auto p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}