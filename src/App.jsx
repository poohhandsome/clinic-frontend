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
import DoctorLayout from './layouts/DoctorLayout.jsx'; // Import the new layout
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

// This is the layout for the NURSE/DASHBOARD page
const MainLayout = ({ children, user, selectedClinic, allClinics }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const currentPath = useHashNavigation();

    useEffect(() => {
        if (selectedClinic) {
            const fetchPending = () => {
                authorizedFetch(`/api/pending-appointments?clinic_id=${selectedClinic}`)
                    .then(res => res.json())
                    .then(data => setPendingCount(data.length || 0));
            };
            fetchPending();
            const interval = setInterval(fetchPending, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedClinic]);

    const handleChangeClinic = () => {
        localStorage.removeItem('selectedClinic');
        window.location.hash = '#/';
        window.location.reload();
    };

    const selectedClinicName = allClinics.find(c => c.id === selectedClinic)?.name || 'Unknown Clinic';

    // Pass currentDate and setCurrentDate down to the Header
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { currentDate, setCurrentDate });
        }
        return child;
    });

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
                    {childrenWithProps}
                </main>
            </div>
        </div>
    );
};

export default function App() {
    const { isAuthenticated, user } = useAuth();
    const [allClinics, setAllClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(() => Number(localStorage.getItem('selectedClinic')) || null);
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

    const route = currentPath.split('/')[1]; // 'nurse', 'doctor', or empty
    const patientId = currentPath.split('/')[2] || null;
    const checkInTime = new URLSearchParams(currentPath.split('?')[1] || '').get('checkin');

    // ROUTE 1: Landing Page (if hash is '#' or '#/')
    if (!route) {
        return <LandingPage />;
    }

    // If a role has been chosen but no clinic is selected, show clinic selection
    if (!selectedClinic) {
        return <ClinicSelectionPage clinics={allClinics} onSelectClinic={handleClinicSelect} />;
    }

    // ROUTE 2: Nurse Dashboard
    if (route === 'nurse') {
        return (
            <MainLayout user={user} selectedClinic={selectedClinic} allClinics={allClinics}>
                <NursePage key={selectedClinic} user={user} selectedClinic={selectedClinic} />
            </MainLayout>
        );
    }
    
    // ROUTE 3: Doctor's Treatment Plan Page
    if (route === 'doctor') {
        return (
            <DoctorLayout>
                <DoctorPage key={selectedClinic} user={user} selectedClinic={selectedClinic} patientId={patientId} checkInTime={checkInTime} />
            </DoctorLayout>
        );
    }

    // ROUTE 4: Settings Page (uses the Main Layout)
    if (route === 'settings') {
         return (
            <MainLayout user={user} selectedClinic={selectedClinic} allClinics={allClinics}>
                <SettingsPage onDataChange={() => {}} />
            </MainLayout>
        );
    }
    
    // Fallback: If no route matches, go to the landing page
    return <LandingPage />;
}