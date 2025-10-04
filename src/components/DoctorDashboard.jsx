import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PatientInfoCard from './shared/PatientInfoCard';
import SearchTreatmentModal from './shared/SearchTreatmentModal';

const DoctorDashboard = () => {
    const { authorizedFetch, user } = useAuth();
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [queue, setQueue] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [isLoading, setIsLoading] = useState(false);

    // History data
    const [patientHistory, setPatientHistory] = useState([]);

    // Examination form data
    const [examForm, setExamForm] = useState({
        chief_complaint: '',
        vital_signs: {
            blood_pressure: '',
            heart_rate: '',
            temperature: '',
            oxygen_saturation: '',
            weight: '',
            height: ''
        },
        physical_exam: '',
        diagnosis: ''
    });
    const [savedExamId, setSavedExamId] = useState(null);

    // Treatment plan form data
    const [planForm, setPlanForm] = useState({
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
        follow_up_date: ''
    });

    // Visit treatments
    const [visitTreatments, setVisitTreatments] = useState([]);
    const [showTreatmentModal, setShowTreatmentModal] = useState(false);

    // Document upload
    const [documentFile, setDocumentFile] = useState(null);

    // Check role authorization
    useEffect(() => {
        if (user && user.role !== 'doctor') {
            alert('Access denied. This page is for doctors only.');
            window.history.back();
        }
    }, [user]);

    // Fetch queue every 30 seconds
    useEffect(() => {
        if (user && selectedClinic) {
            fetchQueue();
            const interval = setInterval(fetchQueue, 30000); // 30 seconds
            return () => clearInterval(interval);
        }
    }, [user, selectedClinic]);

    const fetchQueue = async () => {
        if (!user || !selectedClinic) return;

        try {
            const res = await authorizedFetch(`/api/visits/queue/${user.id}?clinic_id=${selectedClinic}`);
            if (!res.ok) throw new Error('Failed to fetch queue');
            const data = await res.json();
            setQueue(data);
        } catch (err) {
            console.error('Error fetching queue:', err);
        }
    };

    // Load patient history when patient is selected
    useEffect(() => {
        if (selectedPatient) {
            fetchPatientHistory();
            fetchVisitTreatments();
            checkExistingExam();
        }
    }, [selectedPatient]);

    const fetchPatientHistory = async () => {
        if (!selectedPatient) return;

        setIsLoading(true);
        try {
            const res = await authorizedFetch(`/api/history/patient/${selectedPatient.patient_id}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setPatientHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
            alert('Failed to load patient history');
        } finally {
            setIsLoading(false);
        }
    };

    const checkExistingExam = async () => {
        if (!selectedPatient) return;

        try {
            const res = await authorizedFetch(`/api/examinations/visit/${selectedPatient.visit_id}`);
            if (res.ok) {
                const data = await res.json();
                setSavedExamId(data.finding_id);
                // Load existing exam data
                setExamForm({
                    chief_complaint: data.chief_complaint || '',
                    vital_signs: data.vital_signs ? JSON.parse(data.vital_signs) : {
                        blood_pressure: '',
                        heart_rate: '',
                        temperature: '',
                        oxygen_saturation: '',
                        weight: '',
                        height: ''
                    },
                    physical_exam: data.physical_exam || '',
                    diagnosis: data.diagnosis || ''
                });
            }
        } catch (err) {
            // No existing exam, that's fine
            setSavedExamId(null);
        }
    };

    const fetchVisitTreatments = async () => {
        if (!selectedPatient) return;

        try {
            const res = await authorizedFetch(`/api/visit-treatments/visit/${selectedPatient.visit_id}`);
            if (!res.ok) throw new Error('Failed to fetch treatments');
            const data = await res.json();
            setVisitTreatments(data);
        } catch (err) {
            console.error('Error fetching visit treatments:', err);
        }
    };

    // Handle examination form submit
    const handleExamSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPatient) {
            alert('No patient selected');
            return;
        }

        try {
            const res = await authorizedFetch('/api/examinations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedPatient.visit_id,
                    ...examForm
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to save examination');
            }

            const data = await res.json();
            setSavedExamId(data.finding_id);
            alert('Examination saved successfully');
        } catch (err) {
            console.error('Error saving examination:', err);
            alert(err.message);
        }
    };

    // Handle treatment plan submit
    const handlePlanSubmit = async (e) => {
        e.preventDefault();

        if (!savedExamId) {
            alert('Please save examination first');
            return;
        }

        // Filter out empty medications
        const validMedications = planForm.medications.filter(m => m.name && m.dosage);

        try {
            const res = await authorizedFetch('/api/treatment-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examination_id: savedExamId,
                    medications: validMedications,
                    instructions: planForm.instructions,
                    follow_up_date: planForm.follow_up_date || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to save treatment plan');
            }

            alert('Treatment plan saved successfully');
        } catch (err) {
            console.error('Error saving treatment plan:', err);
            alert(err.message);
        }
    };

    // Add medication row
    const addMedicationRow = () => {
        setPlanForm(prev => ({
            ...prev,
            medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
        }));
    };

    // Remove medication row
    const removeMedicationRow = (index) => {
        setPlanForm(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    // Handle medication change
    const handleMedicationChange = (index, field, value) => {
        setPlanForm(prev => ({
            ...prev,
            medications: prev.medications.map((med, i) =>
                i === index ? { ...med, [field]: value } : med
            )
        }));
    };

    // Handle treatment selection from modal
    const handleTreatmentSelect = async (treatment, quantity, customPrice) => {
        if (!selectedPatient) return;

        try {
            const res = await authorizedFetch('/api/visit-treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedPatient.visit_id,
                    treatment_id: treatment.treatment_id,
                    quantity: parseInt(quantity),
                    custom_price: customPrice ? parseFloat(customPrice) : undefined
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to add treatment');
            }

            alert('Treatment added successfully');
            fetchVisitTreatments();
            setShowTreatmentModal(false);
        } catch (err) {
            console.error('Error adding treatment:', err);
            alert(err.message);
        }
    };

    // Remove treatment
    const handleRemoveTreatment = async (visitTreatmentId) => {
        if (!confirm('Remove this treatment?')) return;

        try {
            const res = await authorizedFetch(`/api/visit-treatments/${visitTreatmentId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to remove treatment');

            alert('Treatment removed');
            fetchVisitTreatments();
        } catch (err) {
            console.error('Error removing treatment:', err);
            alert(err.message);
        }
    };

    // Complete visit
    const handleCompleteVisit = async () => {
        if (!selectedPatient) return;

        if (!confirm('Mark this visit as completed?')) return;

        try {
            const res = await authorizedFetch(`/api/visits/${selectedPatient.visit_id}/complete`, {
                method: 'PUT'
            });

            if (!res.ok) throw new Error('Failed to complete visit');

            alert('Visit completed successfully');
            setSelectedPatient(null);
            fetchQueue();
        } catch (err) {
            console.error('Error completing visit:', err);
            alert(err.message);
        }
    };

    // Calculate alert color
    const getAlertColor = (level) => {
        if (!level) return '#10B981'; // green
        if (level >= 3) return '#EF4444'; // red
        if (level >= 2) return '#F59E0B'; // yellow
        return '#10B981'; // green
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Sidebar - 10% width */}
            <div style={{
                width: '10%',
                minWidth: '120px',
                backgroundColor: 'white',
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto',
                padding: '15px 10px'
            }}>
                <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>Queue</h3>

                {queue.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>No patients</p>
                ) : (
                    queue.map((patient) => (
                        <div
                            key={patient.visit_id}
                            onClick={() => setSelectedPatient(patient)}
                            style={{
                                padding: '10px',
                                marginBottom: '10px',
                                backgroundColor: selectedPatient?.visit_id === patient.visit_id ? '#e0f2fe' : '#f9fafb',
                                border: `2px solid ${getAlertColor(patient.alert_level)}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '5px',
                                color: getAlertColor(patient.alert_level),
                                textAlign: 'center'
                            }}>
                                {patient.dn}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                                {patient.first_name_th} {patient.last_name_th}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '5px', textAlign: 'center' }}>
                                {new Date(patient.check_in_time).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Content Area - 90% width */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!selectedPatient ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2>Doctor Dashboard</h2>
                            <p>Select a patient from the queue to begin</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Patient Info Header */}
                        <div style={{
                            padding: '15px 20px',
                            backgroundColor: 'white',
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <PatientInfoCard patient={selectedPatient} />
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '5px',
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            {['history', 'exam', 'treatment', 'document', 'complete'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: activeTab === tab ? '#3B82F6' : 'transparent',
                                        color: activeTab === tab ? 'white' : '#666',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: activeTab === tab ? 'bold' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab === 'history' && 'History'}
                                    {tab === 'exam' && 'Ex & Tx'}
                                    {tab === 'treatment' && 'Treatments'}
                                    {tab === 'document' && 'Documents'}
                                    {tab === 'complete' && 'Complete'}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <div>
                                    <h2 style={{ marginBottom: '20px' }}>Patient History</h2>
                                    {isLoading && <p>Loading history...</p>}
                                    {!isLoading && patientHistory.length === 0 && (
                                        <p style={{ color: '#999' }}>No previous visits</p>
                                    )}
                                    {!isLoading && patientHistory.map((visit, index) => (
                                        <div
                                            key={visit.visit_id || index}
                                            style={{
                                                backgroundColor: 'white',
                                                padding: '15px',
                                                marginBottom: '15px',
                                                borderRadius: '8px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <h3>
                                                    Visit: {new Date(visit.visit_date).toLocaleDateString('th-TH')}
                                                </h3>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#e0f2fe',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                                    {visit.status}
                                                </span>
                                            </div>
                                            {visit.doctor_name && (
                                                <p><strong>Doctor:</strong> {visit.doctor_name} ({visit.specialty})</p>
                                            )}
                                            {visit.diagnosis && (
                                                <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>
                                            )}
                                            {visit.medications && (
                                                <div>
                                                    <strong>Medications:</strong>
                                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                        {JSON.parse(visit.medications).map((med, i) => (
                                                            <li key={i}>{med.name} - {med.dosage} ({med.frequency})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {visit.treatments && visit.treatments.length > 0 && (
                                                <div>
                                                    <strong>Treatments:</strong>
                                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                        {visit.treatments.map((t, i) => (
                                                            <li key={i}>{t.code} - {t.name} (x{t.quantity})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Exam & Treatment Plan Tab */}
                            {activeTab === 'exam' && (
                                <div>
                                    <h2 style={{ marginBottom: '20px' }}>Examination & Treatment Plan</h2>

                                    {/* Examination Form */}
                                    <form onSubmit={handleExamSubmit} style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <h3 style={{ marginBottom: '15px' }}>Examination</h3>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Chief Complaint
                                            </label>
                                            <textarea
                                                value={examForm.chief_complaint}
                                                onChange={(e) => setExamForm({ ...examForm, chief_complaint: e.target.value })}
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Vital Signs
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="BP (e.g., 120/80)"
                                                    value={examForm.vital_signs.blood_pressure}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, blood_pressure: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="HR (bpm)"
                                                    value={examForm.vital_signs.heart_rate}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, heart_rate: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Temp (°C)"
                                                    value={examForm.vital_signs.temperature}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, temperature: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="O2 Sat (%)"
                                                    value={examForm.vital_signs.oxygen_saturation}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, oxygen_saturation: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Weight (kg)"
                                                    value={examForm.vital_signs.weight}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, weight: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Height (cm)"
                                                    value={examForm.vital_signs.height}
                                                    onChange={(e) => setExamForm({
                                                        ...examForm,
                                                        vital_signs: { ...examForm.vital_signs, height: e.target.value }
                                                    })}
                                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Physical Examination
                                            </label>
                                            <textarea
                                                value={examForm.physical_exam}
                                                onChange={(e) => setExamForm({ ...examForm, physical_exam: e.target.value })}
                                                rows="4"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Diagnosis
                                            </label>
                                            <textarea
                                                value={examForm.diagnosis}
                                                onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Save Examination
                                        </button>
                                    </form>

                                    {/* Treatment Plan Form */}
                                    {savedExamId && (
                                        <form onSubmit={handlePlanSubmit} style={{
                                            backgroundColor: 'white',
                                            padding: '20px',
                                            borderRadius: '8px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}>
                                            <h3 style={{ marginBottom: '15px' }}>Treatment Plan</h3>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Medications
                                                </label>
                                                {planForm.medications.map((med, index) => (
                                                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Medication name"
                                                            value={med.name}
                                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                                            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Dosage"
                                                            value={med.dosage}
                                                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                            style={{ width: '120px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Frequency"
                                                            value={med.frequency}
                                                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                                            style={{ width: '120px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Duration"
                                                            value={med.duration}
                                                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                                            style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                        {planForm.medications.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMedicationRow(index)}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    backgroundColor: '#DC2626',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addMedicationRow}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#10B981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    + Add Medication
                                                </button>
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Instructions
                                                </label>
                                                <textarea
                                                    value={planForm.instructions}
                                                    onChange={(e) => setPlanForm({ ...planForm, instructions: e.target.value })}
                                                    rows="4"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Follow-up Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={planForm.follow_up_date}
                                                    onChange={(e) => setPlanForm({ ...planForm, follow_up_date: e.target.value })}
                                                    style={{
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#3B82F6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Save Treatment Plan
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Treatment Processing Tab */}
                            {activeTab === 'treatment' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h2>Treatment Processing</h2>
                                        <button
                                            onClick={() => setShowTreatmentModal(true)}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            + Add Treatment
                                        </button>
                                    </div>

                                    {visitTreatments.length === 0 ? (
                                        <p style={{ color: '#999' }}>No treatments added yet</p>
                                    ) : (
                                        <table style={{
                                            width: '100%',
                                            backgroundColor: 'white',
                                            borderCollapse: 'collapse',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>Quantity</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>Price</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visitTreatments.map((vt) => (
                                                    <tr key={vt.visit_treatment_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                        <td style={{ padding: '12px' }}>{vt.code}</td>
                                                        <td style={{ padding: '12px' }}>{vt.name}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{vt.quantity}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                                            ฿{parseFloat(vt.price).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                                            ฿{parseFloat(vt.total_price).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => handleRemoveTreatment(vt.visit_treatment_id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#DC2626',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {/* Document Tab */}
                            {activeTab === 'document' && (
                                <div>
                                    <h2 style={{ marginBottom: '20px' }}>Scan Document</h2>
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <p style={{ marginBottom: '15px', color: '#666' }}>
                                            Upload patient documents (scans, lab results, etc.)
                                        </p>
                                        <input
                                            type="file"
                                            onChange={(e) => setDocumentFile(e.target.files[0])}
                                            style={{ marginBottom: '15px' }}
                                        />
                                        <button
                                            onClick={() => alert('Document upload functionality to be implemented')}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Upload Document
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Complete Visit Tab */}
                            {activeTab === 'complete' && (
                                <div>
                                    <h2 style={{ marginBottom: '20px' }}>Complete Visit</h2>
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <h3>Visit Summary</h3>
                                        <p style={{ margin: '10px 0' }}>
                                            <strong>Patient:</strong> {selectedPatient.first_name_th} {selectedPatient.last_name_th}
                                        </p>
                                        <p style={{ margin: '10px 0' }}>
                                            <strong>Examination:</strong> {savedExamId ? 'Completed ✓' : 'Not saved'}
                                        </p>
                                        <p style={{ margin: '10px 0' }}>
                                            <strong>Treatments Added:</strong> {visitTreatments.length}
                                        </p>

                                        <button
                                            onClick={handleCompleteVisit}
                                            style={{
                                                marginTop: '20px',
                                                padding: '15px 30px',
                                                backgroundColor: '#10B981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '16px'
                                            }}
                                        >
                                            Complete Visit
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Treatment Search Modal */}
            {showTreatmentModal && (
                <SearchTreatmentModal
                    onSelect={handleTreatmentSelect}
                    onClose={() => setShowTreatmentModal(false)}
                />
            )}
        </div>
    );
};

export default DoctorDashboard;
