
/* -------------------------------------------------- */
/* FILE 2: src/App.jsx (REPLACE this file)            */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import PendingAppointmentsPage from './components/PendingAppointmentsPage';
import DoctorSchedulesPage from './components/DoctorSchedulesPage';
import ConfirmedAppointmentsPage from './components/ConfirmedAppointmentsPage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);

    const currentPath = useHashNavigation();

    // Fetch clinics on initial load
    useEffect(() => {
        fetch(`${API_BASE_URL}/clinics`)
            .then(res => res.json())
            .then(data => {
                setClinics(data);
                if (data.length > 0) setSelectedClinic(data[0].id);
            });
    }, []);

    // Fetch doctors when the selected clinic changes
    useEffect(() => {
        if (selectedClinic) {
            // We can use any date for the schedule endpoint just to get the list of doctors
            const dateString = '2025-01-01'; 
            fetch(`${API_BASE_URL}/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => {
                    setDoctors(data.doctors || []);
                    // When clinic changes, select all doctors by default
                    setFilteredDoctorIds((data.doctors || []).map(d => d.id));
                });
        }
    }, [selectedClinic]);

    if (!isLoggedIn) {
        return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
    }

    const renderPage = () => {
        const pageProps = { 
            selectedClinic, 
            apiUrl: API_BASE_URL, 
            currentDate, 
            setCurrentDate,
            doctors,
            filteredDoctorIds
        };
        switch (currentPath) {
            case '#dashboard':
                return <DashboardPage {...pageProps} />;
            case '#pending':
                return <PendingAppointmentsPage {...pageProps} />;
            case '#confirmed':
                return <ConfirmedAppointmentsPage {...pageProps} />;
            case '#schedules':
                return <DoctorSchedulesPage {...pageProps} />;
            default:
                window.location.hash = '#dashboard';
                return null;
        }
    };

    return (
        <div className="app-container">
            <div className="main-layout">
                <Header 
                    clinics={clinics}
                    selectedClinic={selectedClinic}
                    onClinicChange={setSelectedClinic}
                />
                <Sidebar 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    doctors={doctors}
                    filteredDoctorIds={filteredDoctorIds}
                    setFilteredDoctorIds={setFilteredDoctorIds}
                />
                <main className="content-area">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}
