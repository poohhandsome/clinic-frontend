// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
// import './App.css'; // <-- REMOVE THIS LINE
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
                        setSelectedClinic(data[0].id);
                    }
                });
        }
    }, [isAuthenticated, selectedClinic]);

    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const dateString = '2025-01-01'; // This should probably be dynamic
            authorizedFetch(`/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => {
                    setDoctors(data.doctors || []);
                    setFilteredDoctorIds((data.doctors || []).map(d => d.id));
                });
        }
    }, [selectedClinic, isAuthenticated]);

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const renderPage = () => {
        const pageProps = { selectedClinic, currentDate, setCurrentDate, doctors, filteredDoctorIds, user };
        if (currentPath === '#login' || currentPath === '') window.location.hash = '#dashboard';

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
        <div className="app-container">
            <div className={`main-layout ${!showSidebar ? 'no-sidebar' : ''}`}>
                <Header clinics={clinics} selectedClinic={selectedClinic} onClinicChange={setSelectedClinic} />
                {showSidebar && (
                    <Sidebar
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        doctors={doctors}
                        filteredDoctorIds={filteredDoctorIds}
                        setFilteredDoctorIds={setFilteredDoctorIds}
                    />
                )}
                <main className="content-area">{renderPage()}</main>
            </div>
        </div>
    );
}