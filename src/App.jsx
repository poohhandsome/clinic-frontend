import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import ClinicSelectionPage from './components/ClinicSelectionPage.jsx';

// Import Pages
import LandingPage from './pages/LandingPage.jsx';
import NursePage from './pages/NursePage.jsx';
import DoctorPage from './pages/DoctorPage.jsx';
import SettingsPage from './components/SettingsPage.jsx'; // Assuming this remains a component

// Import Layout Components
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


// Main Application Layout Component
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
        window.location.reload(); // Easiest way to force re-selection
    };

    const selectedClinicName = allClinics.find(c => c.id === selectedClinic)?.name || 'Unknown Clinic';

    return (
        <div className="flex h-screen bg-slate-50">
            <NewSidebar 
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                currentPath={currentPath}
            />
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
    const [selectedClinic, setSelectedClinic] = useState(() => {
        const savedClinic = localStorage.getItem('selectedClinic');
        return savedClinic ? Number(savedClinic) : null;
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const currentPath = useHashNavigation();
    
    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/api/clinics')
                .then(res => res.json())
                .then(setAllClinics)
                .catch(err => console.error("Failed to fetch clinics", err));
        }
    }, [isAuthenticated]);

    const handleClinicSelect = (clinicId) => {
        setSelectedClinic(clinicId);
        localStorage.setItem('selectedClinic', clinicId);
    };

    if (!isAuthenticated) return <LoginPage />;
    
    // Step 1: Handle Landing Page
    if (currentPath === '#/' || currentPath === '') {
        return <LandingPage />;
    }
    
    // Step 2: Handle Clinic Selection if a role is chosen but clinic is not set
    if (!selectedClinic) {
        return <ClinicSelectionPage clinics={allClinics} onSelectClinic={handleClinicSelect} />;
    }

    // Step 3: Render the main application with the correct page
    const renderPage = () => {
        const route = currentPath.split('/')[1]; // e.g., 'nurse', 'doctor'
        
        switch (route) {
            case 'nurse':
                // NursePage will contain the logic from the old DashboardPage
                return <NursePage user={user} selectedClinic={selectedClinic} currentDate={currentDate} setCurrentDate={setCurrentDate} allClinics={allClinics} />;
            case 'doctor':
                const patientId = currentPath.split('/')[2] || null;
                 const checkInTime = new URLSearchParams(currentPath.split('?')[1] || '').get('checkin');
                // DoctorPage will be the TreatmentPlanPage
                return <DoctorPage user={user} selectedClinic={selectedClinic} patientId={patientId} checkInTime={checkInTime} />;
            case 'settings':
                 return <SettingsPage onDataChange={() => {}} />; // Assuming settings is a general page
            default:
                // Fallback to landing page if route is unknown
                return <LandingPage />;
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