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
    const [allClinicDoctors, setAllClinicDoctors] = useState([]);
    const [workingDoctors, setWorkingDoctors] = useState([]);
    const [dailySchedule, setDailySchedule] = useState({});
    const [selectedClinic, setSelectedClinic] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const currentPath = useHashNavigation();

    // **FIX STEP 1**: This effect now ONLY runs when the user logs in.
    // It's responsible for fetching the list of clinics.
    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/api/clinics')
                .then(res => res.json())
                .then(setClinics)
                .catch(error => console.error("Failed to fetch clinics:", error));
        } else {
            // Clear data on logout
            setClinics([]);
            setAllClinicDoctors([]);
            setWorkingDoctors([]);
            setSelectedClinic('');
        }
    }, [isAuthenticated]);

    // **FIX STEP 2**: This effect sets the *initial* clinic selection
    // only when the clinics list is first loaded.
    useEffect(() => {
        if (clinics.length > 0 && !selectedClinic) {
            setSelectedClinic(clinics[0].id);
        }
    }, [clinics]);

    // This effect correctly fetches schedule data whenever the clinic or date changes.
    useEffect(() => {
        if (selectedClinic && isAuthenticated) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
                .then(res => res.json())
                .then(data => {
                    setAllClinicDoctors(data.all_doctors_in_clinic || []);
                    setWorkingDoctors(data.doctors || []);

                    const scheduleMap = (data.doctors || []).reduce((acc, doc) => {
                        if (doc.start_time && doc.end_time) {
                            acc[doc.id] = { startTime: doc.start_time, endTime: doc.end_time };
                        }
                        return acc;
                    }, {});
                    setDailySchedule(scheduleMap);
                    
                    const workingDoctorIds = (data.doctors || []).map(doc => doc.id);
                    setFilteredDoctorIds(workingDoctorIds);
                })
                .catch(error => console.error("Failed to fetch schedule:", error));
        }
    }, [selectedClinic, currentDate, isAuthenticated]);

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const renderPage = () => {
        if (currentPath === '#login' || currentPath === '') window.location.hash = '#dashboard';

        switch (currentPath) {
            case '#dashboard':
                return <DashboardPage doctors={workingDoctors} filteredDoctorIds={filteredDoctorIds} dailySchedule={dailySchedule} selectedClinic={selectedClinic} currentDate={currentDate} />;
            case '#pending':
                return <PendingAppointmentsPage selectedClinic={selectedClinic} />;
            case '#confirmed':
                return <ConfirmedAppointmentsPage selectedClinic={selectedClinic} />;
            case '#schedules':
                return <DoctorSchedulesPage doctors={allClinicDoctors} />;
            default:
                return <DashboardPage doctors={workingDoctors} filteredDoctorIds={filteredDoctorIds} dailySchedule={dailySchedule} selectedClinic={selectedClinic} currentDate={currentDate} />;
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
                            doctors={workingDoctors}
                            filteredDoctorIds={filteredDoctorIds}
                            setFilteredDoctorIds={setFilteredDoctorIds}
                            dailySchedule={dailySchedule} 
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