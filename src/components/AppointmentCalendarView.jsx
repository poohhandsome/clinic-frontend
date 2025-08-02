// src/components/AppointmentCalendarView.jsx (REPLACE)

import React, { useState, useEffect, useMemo } from 'react';
import { format, getHours, getMinutes, isToday } from 'date-fns';
import authorizedFetch from '../api';

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


export default function AppointmentCalendarView({ currentDate, selectedClinic, onSlotClick }) {
    const [schedule, setSchedule] = useState({ doctors: [], appointments: [] });
    const hourHeight = 80;
    const timelineStartHour = 8;
    const timelineEndHour = 20;
    const hours = Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_, i) => i + timelineStartHour);

    useEffect(() => {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        authorizedFetch(`/api/clinic-day-schedule?clinic_id=${selectedClinic}&date=${dateString}`)
            .then(res => res.json())
            .then(data => setSchedule({
                doctors: data.doctors || [],
                appointments: data.appointments || []
            }))
            .catch(err => console.error("Failed to fetch day schedule:", err));
    }, [currentDate, selectedClinic]);

    if (schedule.doctors.length === 0) {
        return (
             <div className="bg-white border rounded-lg shadow-sm p-8 text-center text-slate-500">
                <h3 className="text-lg font-semibold">No Doctors Scheduled</h3>
                <p>There are no doctors scheduled to work on this day.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col h-full">
            <div className="grid shrink-0" style={{ gridTemplateColumns: `5rem repeat(${schedule.doctors.length}, minmax(0, 1fr))` }}>
                <div className="p-2 border-r border-b"></div>
                {schedule.doctors.map(doc => (
                    <div key={doc.id} className="p-3 border-b border-r text-center">
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto relative">
                <div className="grid relative" style={{ gridTemplateColumns: `5rem repeat(${schedule.doctors.length}, minmax(0, 1fr))` }}>
                    <div className="col-start-1 col-end-2 row-start-1 row-end-[-1]">
                        {hours.map(hour => (
                            <div key={hour} className="h-20 relative border-r border-slate-200">
                                <span className="absolute -top-2.5 right-2 text-xs font-semibold text-slate-800">
                                    {format(new Date(0, 0, 0, hour), 'ha')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {schedule.doctors.map((doc, index) => (
                        <div key={doc.id} className="relative border-r border-slate-200" style={{ gridColumnStart: index + 2 }}>
                            {hours.map(hour => (
                                <React.Fragment key={hour}>
                                    <div className="h-10 border-b border-slate-200 cursor-pointer hover:bg-sky-50" onClick={() => onSlotClick({ time: `${String(hour).padStart(2, '0')}:00`, doctorId: doc.id })} />
                                    <div className="h-10 border-b border-slate-200 cursor-pointer hover:bg-sky-50" onClick={() => onSlotClick({ time: `${String(hour).padStart(2, '0')}:30`, doctorId: doc.id })} />
                                </React.Fragment>
                            ))}

                            {schedule.appointments.filter(app => app.doctor_id === doc.id).map(app => {
                                const appointmentStartMinutes = timeToMinutes(app.appointment_time);
                                const top = (appointmentStartMinutes - (timelineStartHour * 60)) * (hourHeight / 60);
                                const height = (timeToMinutes(app.end_time) - appointmentStartMinutes) * (hourHeight / 60);
                                if (top < 0) return null;

                                return (
                                    <div key={app.id} className="absolute w-[calc(100%-0.5rem)] left-1 p-2 rounded-lg bg-sky-500 text-white shadow-md z-10" style={{ top: `${top}px`, height: `${height}px` }}>
                                        <p className="font-bold text-xs leading-tight">{app.details || 'Appointment'}</p>
                                        <p className="text-xs opacity-80">{app.patient_name_at_booking}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {isToday(currentDate) && <CurrentTimeIndicator hourHeight={hourHeight} timelineStartHour={timelineStartHour} />}
                </div>
            </div>
        </div>
    );
}