
/* -------------------------------------------------- */
/* FILE 2: src/App.jsx (UPDATED)                      */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import PendingAppointmentsPage from './components/PendingAppointmentsPage';
import DoctorSchedulesPage from './components/DoctorSchedulesPage';
import ConfirmedAppointmentsPage from './components/ConfirmedAppointmentsPage'; // Import new page

// Get the API URL from environment variables.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Simple router based on URL hash
const useHashNavigation = () => {
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#login');

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(window.location.hash || '#login');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return currentPath;
};

const Navbar = ({ onClinicChange, clinics, selectedClinic }) => {
    const currentPath = useHashNavigation();
    
    return (
        <aside className="navbar">
            <div>
                <h1>Youcare</h1>
                <nav>
                    <a href="#dashboard" className={currentPath === '#dashboard' ? 'active' : ''}>Dashboard</a>
                    <a href="#pending" className={currentPath === '#pending' ? 'active' : ''}>Pending Appointments</a>
                    <a href="#confirmed" className={currentPath === '#confirmed' ? 'active' : ''}>Confirmed Appointments</a>
                    <a href="#schedules" className={currentPath === '#schedules' ? 'active' : ''}>Doctor Schedules</a>
                </nav>
            </div>
            <div className="clinic-selector">
                <label htmlFor="clinic-select">Clinic</label>
                <select id="clinic-select" value={selectedClinic} onChange={e => onClinicChange(e.target.value)}>
                    {clinics.map(clinic => (
                        <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                </select>
            </div>
        </aside>
    );
};

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState('');
    
    const currentPath = useHashNavigation();

    useEffect(() => {
        // Fetch clinics once on load
        fetch(`${API_BASE_URL}/clinics`)
            .then(res => res.json())
            .then(data => {
                setClinics(data);
                if (data.length > 0) {
                    setSelectedClinic(data[0].id);
                }
            });
    }, []);

    if (!isLoggedIn) {
        return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
    }

    const renderPage = () => {
        switch (currentPath) {
            case '#dashboard':
                return <DashboardPage selectedClinic={selectedClinic} apiUrl={API_BASE_URL} />;
            case '#pending':
                return <PendingAppointmentsPage selectedClinic={selectedClinic} apiUrl={API_BASE_URL} />;
            case '#confirmed':
                return <ConfirmedAppointmentsPage selectedClinic={selectedClinic} apiUrl={API_BASE_URL} />;
            case '#schedules':
                return <DoctorSchedulesPage selectedClinic={selectedClinic} apiUrl={API_BASE_URL} />;
            default:
                // Redirect to dashboard if logged in and hash is invalid or #login
                window.location.hash = '#dashboard';
                return null;
        }
    };

    return (
        <div className="app-container">
            <div className="main-layout">
                <Navbar 
                    clinics={clinics}
                    selectedClinic={selectedClinic}
                    onClinicChange={setSelectedClinic}
                />
                <main className="content-area">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}
