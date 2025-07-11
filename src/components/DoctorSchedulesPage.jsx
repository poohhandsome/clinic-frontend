
/* -------------------------------------------------- */
/* FILE 7: src/components/DoctorSchedulesPage.jsx (UPDATED)    */
/* -------------------------------------------------- */

import React, { useState, useEffect } from 'react';

const daysOfWeek = [
    { id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }, { id: 0, name: 'Sunday' }
];

const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    return <div className={`status-message ${type}`}>{message}</div>;
};

export default function DoctorSchedulesPage({ selectedClinic, apiUrl }) {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [availability, setAvailability] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        // Fetch doctors for the selected clinic to populate the dropdown
        if (selectedClinic) {
            fetch(`${apiUrl}/clinic-day-schedule?clinic_id=${selectedClinic}&date=2025-01-01`) // Date doesn't matter here
                .then(res => res.json())
                .then(data => {
                    setDoctors(data.doctors);
                    if (data.doctors.length > 0) {
                        setSelectedDoctor(data.doctors[0].id);
                    }
                });
        }
    }, [selectedClinic, apiUrl]);

    useEffect(() => {
        // Fetch the selected doctor's availability
        if (selectedDoctor) {
            fetch(`${apiUrl}/doctor-availability/${selectedDoctor}`)
                .then(res => res.json())
                .then(data => {
                    const newAvail = daysOfWeek.map(day => {
                        const saved = data.find(d => d.day_of_week === day.id);
                        return { 
                            day_of_week: day.id, 
                            start_time: saved ? saved.start_time.substring(0,5) : '', 
                            end_time: saved ? saved.end_time.substring(0,5) : ''
                        };
                    });
                    setAvailability(newAvail);
                });
        }
    }, [selectedDoctor, apiUrl]);

    const handleTimeChange = (dayId, field, value) => {
        setAvailability(prev => prev.map(day => 
            day.day_of_week === dayId ? { ...day, [field]: value } : day
        ));
    };

    const handleSave = () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' }); // Clear previous status

        fetch(`${apiUrl}/doctor-availability/${selectedDoctor}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability: availability }),
        })
        .then(res => {
            if (!res.ok) {
                // If response is not 2xx, throw an error to be caught by .catch()
                throw new Error('Failed to save schedule. Please check server logs.');
            }
            return res.json();
        })
        .then(() => {
            setStatus({ message: 'Schedule saved successfully!', type: 'success' });
        })
        .catch(err => {
            console.error(err);
            setStatus({ message: 'Error saving schedule. Please try again.', type: 'error' });
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div>
            <h2>Manage Doctor Schedules</h2>
            <div style={{marginBottom: '1rem'}}>
                <label htmlFor="doctor-schedule-select">Select Doctor</label>
                <select id="doctor-schedule-select" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>
            
            <StatusMessage message={status.message} type={status.type} />

            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Day</th><th>Start Time</th><th>End Time</th></tr>
                    </thead>
                    <tbody>
                        {availability.map((day, index) => (
                            <tr key={day.day_of_week}>
                                <td>{daysOfWeek.find(d => d.id === day.day_of_week).name}</td>
                                <td><input type="time" value={day.start_time} onChange={e => handleTimeChange(day.day_of_week, 'start_time', e.target.value)} /></td>
                                <td><input type="time" value={day.end_time} onChange={e => handleTimeChange(day.day_of_week, 'end_time', e.target.value)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{marginTop: '1rem', textAlign: 'right'}}>
                <button className="primary" onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>
        </div>
    );
}
