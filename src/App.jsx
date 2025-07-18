// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import PendingAppointmentsPage from './components/PendingAppointmentsPage';
import DoctorSchedulesPage from './components/DoctorSchedulesPage';
import ConfirmedAppointmentsPage from './components/ConfirmedAppointmentsPage';
import authorizedFetch from './api';

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
    const [selectedClinic, setSelectedClinic] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);

    const currentPath = useHashNavigation();

    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/clinics')
                .then(res => res.json())
                .then(data => {
                    setClinics(data);
                    if (data.length > 0 && !selectedClinic) {
                        const firstClinicId = data[0].id;
                        setSelectedClinic(firstClinicId);
                        localStorage.setItem('selectedClinic', firstClinicId);
                    } else if (localStorage.getItem('selectedClinic')) {
                        setSelectedClinic(localStorage.getItem('selectedClinic'));
                    }
                });
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            localStorage.setItem('selectedClinic', selectedClinic);
            authorizedFetch(`/clinic-doctors?clinic_id=${selectedClinic}`)
                .then(res => res.json())
                .then(data => {
                    setDoctors(data || []);
                    setFilteredDoctorIds((data || []).map(d => d.id));
                });
        }
    }, [selectedClinic, isAuthenticated]);


    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const renderPage = () => {
        if (currentPath === '#login' || currentPath === '') {
            window.location.hash = '#dashboard';
            return null; // or a loading indicator
        }
        
        const pageProps = { selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, setFilteredDoctorIds, user };

        switch (currentPath) {
            case '#dashboard': return <DashboardPage {...pageProps} />;
            case '#pending': return <PendingAppointmentsPage {...pageProps} />;
            case '#confirmed': return <ConfirmedAppointmentsPage {...pageProps} />;
            case '#schedules': return <DoctorSchedulesPage {...pageProps} />;
            default: return <DashboardPage {...pageProps} />;
        }
    };

    const showSidebar = currentPath === '#dashboard';

    return (
        <div className="h-screen w-screen overflow-hidden">
            <div className={`grid h-full transition-all duration-300 ${showSidebar ? 'grid-cols-[18rem_1fr]' : 'grid-cols-[0rem_1fr]'}`}>
                <div className={`transition-all duration-300 ${showSidebar ? 'ml-0' : '-ml-72'}`}>
                    <Sidebar
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        doctors={doctors}
                        filteredDoctorIds={filteredDoctorIds}
                        setFilteredDoctorIds={setFilteredDoctorIds}
                    />
                </div>
                <div className="grid grid-rows-[4rem_1fr] bg-slate-50">
                    <Header
                        clinics={clinics}
                        selectedClinic={selectedClinic}
                        onClinicChange={setSelectedClinic}
                    />
                    <main className="overflow-y-auto p-6">{renderPage()}</main>
                </div>
            </div>
        </div>
    );
}