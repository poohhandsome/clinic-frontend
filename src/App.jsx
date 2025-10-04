// src/App.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import ClinicSelectionPage from './components/ClinicSelectionPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NursePage from './pages/NursePage.jsx';
import DoctorPage from './pages/DoctorPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import DoctorSchedulesPage from './components/DoctorSchedulesPage.jsx';
import PatientsPage from './components/PatientsPage.jsx';
import NewHeader from './components/NewUILayout/NewHeader.jsx';
import NewSidebar from './components/NewUILayout/NewSidebar.jsx';
import DoctorLayout from './layouts/DoctorLayout.jsx';
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

// This is the layout for the NURSE/DASHBOARD pages
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

    // Pass currentDate and setCurrentDate down to child pages if they need it
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // Check if the child component is the one that needs the date props
            if (child.type === NursePage) {
                 return React.cloneElement(child, { currentDate, setCurrentDate });
            }
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
            authorizedFetch('/api/clinics')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch clinics');
                    return res.json();
                })
                .then(setAllClinics)
                .catch(err => {
                    console.error('Error fetching clinics:', err);
                    setAllClinics([]);
                });
        }
    }, [isAuthenticated]);

    const handleClinicSelect = (clinicId) => {
        localStorage.setItem('selectedClinic', clinicId);
        setSelectedClinic(clinicId);
    };

    if (!isAuthenticated) return <LoginPage />;

    const pathParts = currentPath.replace(/^#\/?/, '').split('/');
    const mainRoute = pathParts[0]; // 'nurse', 'doctor', or empty for landing
    const subRoute = pathParts[1]; // 'dashboard', 'doctors', etc.
    const patientId = mainRoute === 'doctor' ? subRoute : null; // Patient ID is the sub-route for doctors
    const checkInTime = new URLSearchParams(currentPath.split('?')[1] || '').get('checkin');

    // ROUTE 1: Landing Page
    if (!mainRoute) {
        return <LandingPage />;
    }

    // If a role has been chosen but no clinic is selected, show clinic selection
    if (!selectedClinic) {
        return <ClinicSelectionPage clinics={allClinics} onSelectClinic={handleClinicSelect} />;
    }

    // ROUTE 2: Doctor's Treatment Plan Page (uses its own layout)
    if (mainRoute === 'doctor') {
        return (
            <DoctorLayout>
                <DoctorPage key={selectedClinic} user={user} selectedClinic={selectedClinic} patientId={patientId} checkInTime={checkInTime} />
            </DoctorLayout>
        );
    }

    // ROUTE 3: Nurse Dashboard and its sub-pages (all use the MainLayout)
    if (mainRoute === 'nurse') {
        const renderNursePage = () => {
            // Extract patientId and checkInTime for the treatment plan page
            const patientIdForTxPlan = pathParts[2] || null;
            const checkInTimeForTxPlan = new URLSearchParams(currentPath.split('?')[1] || '').get('checkin');

            switch (subRoute) {
                case 'dashboard':
                    return <NursePage key={selectedClinic} user={user} selectedClinic={selectedClinic} />;
                case 'appointments':
                    return <PatientsPage selectedClinic={selectedClinic} user={user} />;
                
                // **THE FIX IS HERE**: Add a case for the new treatment plan route
                case 'treatment-plan':
                    return <DoctorPage key={selectedClinic} user={user} selectedClinic={selectedClinic} patientId={patientIdForTxPlan} checkInTime={checkInTimeForTxPlan} />;

                case 'doctors':
                    return <DoctorSchedulesPage selectedClinic={selectedClinic} user={user} />;
                case 'settings':
                     return <SettingsPage onDataChange={() => {}} />;
                default:
                    return <NursePage key={selectedClinic} user={user} selectedClinic={selectedClinic} />;
            }
        };

        return (
            <MainLayout user={user} selectedClinic={selectedClinic} allClinics={allClinics}>
                {renderNursePage()}
            </MainLayout>
        );
    }

    // Fallback if no route matches
    return <LandingPage />;
}