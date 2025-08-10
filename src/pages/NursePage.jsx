// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import ClinicSelectionPage from './components/ClinicSelectionPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NursePage from './pages/NursePage.jsx';
import DoctorPage from './pages/DoctorPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import NewHeader from './components/NewUILayout/NewHeader.jsx';
import NewSidebar from './components/NewUILayout/NewSidebar.jsx';
import authorizedFetch from './api.js';
import { format } from 'date-fns';

const useHashNavigation = () => {
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    return currentPath;
};

const MainLayout = ({ children, user, selectedClinic, allClinics, currentDate, setCurrentDate }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const currentPath = useHashNavigation();
    
    useEffect(() => {
        if (selectedClinic) {
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
    }, [selectedClinic]);

    const handleChangeClinic = () => {
        localStorage.removeItem('selectedClinic');
        window.location.hash = '#/'; // Go to landing page after changing clinic
        window.location.reload();
    };

    const selectedClinicName = allClinics.find(c => c.id === selectedClinic)?.name || 'Unknown Clinic';

    return (
        <div className="flex h-screen bg-slate-50">
            <NewSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentPath={currentPath} />
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
                    {children}
                </main>
            </div>
        </div>
    );
};

export default function App() {
    const { isAuthenticated, user } = useAuth();
    const [allClinics, setAllClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(() => Number(localStorage.getItem('selectedClinic')) || null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const currentPath = useHashNavigation();
    
    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/api/clinics').then(res => res.json()).then(setAllClinics);
        }
    }, [isAuthenticated]);

    const handleClinicSelect = (clinicId) => {
        localStorage.setItem('selectedClinic', clinicId);
        setSelectedClinic(clinicId);
    };

    if (!isAuthenticated) return <LoginPage />;
    if (currentPath === '#/') return <LandingPage />;
    if (!selectedClinic) return <ClinicSelectionPage clinics={allClinics} onSelectClinic={handleClinicSelect} />;

    const renderPage = () => {
        const route = currentPath.split('/')[1];
        const patientId = currentPath.split('/')[2] || null;
        const checkInTime = new URLSearchParams(currentPath.split('?')[1] || '').get('checkin');

        switch (route) {
            case 'nurse':
                return <NursePage key={selectedClinic} user={user} selectedClinic={selectedClinic} />;
            case 'doctor':
                return <DoctorPage key={selectedClinic} user={user} selectedClinic={selectedClinic} patientId={patientId} checkInTime={checkInTime} />;
            case 'settings':
                return <SettingsPage onDataChange={() => {}} />;
            default:
                return <div>Page not found. Please select a role from the <a href="/#/">landing page</a>.</div>;
        }
    };

    return (
        <MainLayout 
            user={user} 
            selectedClinic={selectedClinic} 
            allClinics={allClinics}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
        >
            {renderPage()}
        </MainLayout>
    );
}