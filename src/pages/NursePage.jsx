import React, { useState, useEffect, useMemo } from 'react';
import { format, getHours, getMinutes, isToday } from 'date-fns';
import AddNewAppointmentModal from '../components/AddNewAppointmentModal.jsx';
import authorizedFetch from '../api.js';
import DashboardControls from '../components/DashboardControls.jsx';

// --- Helper Components ---
const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const CurrentTimeIndicator = ({ hourHeight, timelineStartHour }) => {
    const [topPosition, setTopPosition] = useState(0);
    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const currentHour = getHours(now);
            const minutesSinceTimelineStart = (currentHour - timelineStartHour) * 60 + getMinutes(now);
            setTopPosition(minutesSinceTimelineStart * (hourHeight / 60));
        };
        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, [hourHeight, timelineStartHour]);

    if (topPosition < 0) return null;
    return (
        <div className="absolute left-16 right-0 z-20" style={{ top: `${topPosition}px` }}>
            <div className="relative h-px bg-red-500">
                <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
        </div>
    );
};

const AppointmentCard = ({ app, top, height, doctorColor }) => (
    <div 
        className="absolute w-[calc(100%-0.5rem)] left-1 p-2 rounded-lg text-white shadow-md z-10 overflow-hidden" 
        style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px', backgroundColor: doctorColor || '#0ea5e9' }}
    >
        <p className="font-bold text-xs leading-tight truncate">{app.patient_name_at_booking || 'Appointment'}</p>
        <p className="text-xs opacity-80">{app.purpose || ''}</p>
    </div>
);


// --- Main Component ---
export default function NursePage({ selectedClinic, currentDate, setCurrentDate }) {
    const [doctors, setDoctors] = useState([]);
    const [dailySchedule, setDailySchedule] = useState({});
    const [filteredDoctorIds, setFilteredDoctorIds] = useState([]);
    const [dayAppointments, setDayAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const hourHeight = 80;
    const timelineStartHour = 8;
    const timelineEndHour = 20;
    const hours = Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_, i) => i + timelineStartHour);

    const fetchScheduleData = () => {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
            .then(res => res.json())
            .then(data => {
                setDoctors(data.all_doctors_in_clinic || []);
                const scheduleMap = (data.doctors || []).reduce((acc, doc) => {
                    if (doc.start_time && doc.end_time) acc[doc.id] = { startTime: doc.start_time, endTime: doc.end_time, color: doc.color };
                    return acc;
                }, {});
                setDailySchedule(scheduleMap);
                setFilteredDoctorIds(Object.keys(scheduleMap).map(id => parseInt(id, 10)));
                setDayAppointments(data.appointments || []);
            });
    };

    useEffect(fetchScheduleData, [selectedClinic, currentDate]);

    const displayedDoctors = useMemo(() => {
        if (!Array.isArray(doctors)) return [];
        return doctors.filter(doc => filteredDoctorIds.includes(doc.id));
    }, [doctors, filteredDoctorIds]);

    const handleSlotClick = (time, doctorId) => {
        setModalData({ time, doctorId, date: currentDate });
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setModalData({ time: '09:00', doctorId: null, date: currentDate });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalData(null);
        fetchScheduleData();
    };

    const isSlotInWorkingHours = (slotHour, slotMinute, doctorId) => {
        const schedule = dailySchedule[doctorId];
        if (!schedule || !schedule.startTime || !schedule.endTime) return false;
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        return slotTotalMinutes >= timeToMinutes(schedule.startTime) && slotTotalMinutes < timeToMinutes(schedule.endTime);
    };

    return (
        <div className="h-full w-full bg-white flex flex-row">
            {isModalOpen && <AddNewAppointmentModal initialData={modalData} clinicId={selectedClinic} onClose={handleModalClose} onUpdate={handleModalClose} />}
            <DashboardControls 
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                doctors={doctors}
                filteredDoctorIds={filteredDoctorIds}
                setFilteredDoctorIds={setFilteredDoctorIds}
                dailySchedule={dailySchedule}
                onCreateClick={handleCreateClick}
            />
            <div className="flex-1 flex flex-col border-l border-slate-200">
                <div className="grid shrink-0" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                    <div className="p-2 border-r border-b border-slate-200 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm font-bold text-sky-600 uppercase">{format(currentDate, 'EEE')}</p>
                            <div className="w-10 h-10 flex items-center justify-center bg-sky-600 rounded-full text-white text-xl font-semibold mt-1">{format(currentDate, 'd')}</div>
                        </div>
                    </div>
                    {displayedDoctors.map(doc => (
                        <div key={doc.id} className="p-3 border-b border-r border-slate-200 text-center">
                            <span className="font-semibold text-slate-800">{doc.name}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto relative">
                    <div className="grid relative" style={{ gridTemplateColumns: `5rem repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}>
                        <div className="col-start-1 col-end-2 row-start-1 row-end-[-1]">
                            {hours.map(hour => (
                                <div key={hour} className="h-20 relative border-r border-slate-200">
                                    <span className="absolute -top-2.5 right-2 text-sm font-semibold text-slate-500">{format(new Date(0, 0, 0, hour), 'h a')}</span>
                                </div>
                            ))}
                        </div>
                        {displayedDoctors.map((doc, index) => (
                            <div key={doc.id} className="relative border-r border-slate-200" style={{ gridColumnStart: index + 2 }}>
                                {hours.map(hour => (
                                    <React.Fragment key={hour}>
                                        <div className={`h-10 border-b border-slate-200 ${isSlotInWorkingHours(hour, 0, doc.id) ? 'hover:bg-sky-50 cursor-pointer' : 'bg-slate-50'}`} 
                                             onClick={() => isSlotInWorkingHours(hour, 0, doc.id) && handleSlotClick(`${String(hour).padStart(2, '0')}:00`, doc.id)} />
                                        <div className={`h-10 border-b border-slate-200 ${isSlotInWorkingHours(hour, 30, doc.id) ? 'hover:bg-sky-50 cursor-pointer' : 'bg-slate-50'}`} 
                                             onClick={() => isSlotInWorkingHours(hour, 30, doc.id) && handleSlotClick(`${String(hour).padStart(2, '0')}:30`, doc.id)} />
                                    </React.Fragment>
                                ))}
                                {(dayAppointments || []).filter(app => app.doctor_id === doc.id).map(app => {
                                    const top = (timeToMinutes(app.appointment_time) - (timelineStartHour * 60)) * (hourHeight / 60);
                                    const height = (timeToMinutes(app.end_time) - timeToMinutes(app.appointment_time)) * (hourHeight / 60);
                                    const doctorColor = dailySchedule[app.doctor_id]?.color;
                                    return <AppointmentCard key={app.id} app={app} top={top} height={height} doctorColor={doctorColor} />;
                                })}
                            </div>
                        ))}
                        {isToday(currentDate) && <CurrentTimeIndicator hourHeight={hourHeight} timelineStartHour={timelineStartHour} />}
                    </div>
                </div>
            </div>
        </div>
    );
}