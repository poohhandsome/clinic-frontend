import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronsRight, ChevronsLeft, Calendar, LogOut as CheckSquare } from 'lucide-react';
import authorizedFetch from '../api';
import PatientInfoCard from './shared/PatientInfoCard';
import SearchTreatmentModal from './shared/SearchTreatmentModal';
import DoctorSubSidebar from './DoctorSubSidebar';
import CheckoutModal from './CheckoutModal';

// Separate component for main content to ensure proper re-rendering when patient changes
const DoctorMainContent = ({ selectedPatient, onShowCheckoutModal, onRefreshQueue }) => {
    const { user } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState('history');
    const [examSubPage, setExamSubPage] = useState('medicalHistory');

    // Data state
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Medical History form
    const [medicalHistoryForm, setMedicalHistoryForm] = useState({
        chief_complaint: '',
        present_illness: '',
        past_medical_history: ''
    });

    // Examination form
    const [examForm, setExamForm] = useState({
        location: '',
        clinical_findings: '',
        principal_diagnosis: ''
    });
    const [savedExamId, setSavedExamId] = useState(null);

    // Treatment state
    const [visitTreatments, setVisitTreatments] = useState([]);
    const [showTreatmentModal, setShowTreatmentModal] = useState(false);

    // Load patient data when component mounts or patient changes
    useEffect(() => {
        if (selectedPatient) {
            console.log('Loading data for patient:', selectedPatient.dn, selectedPatient.visit_id);
            fetchPatientHistory();
            fetchVisitTreatments();
            checkExistingExam();
        }
    }, [selectedPatient?.visit_id]); // Only re-run when visit_id changes

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
                if (data) {
                    setSavedExamId(data.finding_id);
                    setMedicalHistoryForm({
                        chief_complaint: data.chief_complaint || '',
                        present_illness: data.present_illness || '',
                        past_medical_history: data.past_medical_history || ''
                    });
                    setExamForm({
                        location: data.location || '',
                        clinical_findings: data.clinical_findings || '',
                        principal_diagnosis: data.principal_diagnosis || ''
                    });
                }
            }
        } catch (err) {
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

    const handleSaveMedicalHistory = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            const method = savedExamId ? 'PUT' : 'POST';
            const url = savedExamId ? `/api/examinations/${savedExamId}` : '/api/examinations';

            const res = await authorizedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedPatient.visit_id,
                    ...medicalHistoryForm,
                    ...examForm
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to save medical history');
            }

            const data = await res.json();
            setSavedExamId(data.finding_id);
            alert('Medical history saved successfully');
        } catch (err) {
            console.error('Error saving medical history:', err);
            alert(err.message);
        }
    };

    const handleSaveExamination = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            const method = savedExamId ? 'PUT' : 'POST';
            const url = savedExamId ? `/api/examinations/${savedExamId}` : '/api/examinations';

            const res = await authorizedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedPatient.visit_id,
                    ...medicalHistoryForm,
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

    const handleTreatmentSelect = async (treatment) => {
        if (!selectedPatient) return;

        try {
            const res = await authorizedFetch('/api/visit-treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedPatient.visit_id,
                    treatment_id: treatment.treatment_id,
                    actual_price: treatment.standard_price,
                    tooth_numbers: '',
                    notes: ''
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

    // Update treatment field in state
    const handleUpdateTreatmentField = (visitTreatmentId, field, value) => {
        setVisitTreatments(prev =>
            prev.map(vt =>
                vt.visit_treatment_id === visitTreatmentId
                    ? { ...vt, [field]: value }
                    : vt
            )
        );
    };

    // Auto-save treatment on blur
    const handleAutoSaveTreatment = async (visitTreatmentId) => {
        const treatment = visitTreatments.find(vt => vt.visit_treatment_id === visitTreatmentId);
        if (!treatment) return;

        try {
            const res = await authorizedFetch(`/api/visit-treatments/${visitTreatmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: treatment.location || null,
                    clinical_findings: treatment.clinical_findings || null,
                    diagnosis: treatment.diagnosis || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to save');
            }

            console.log('Auto-saved treatment:', visitTreatmentId);
        } catch (err) {
            console.error('Error auto-saving treatment:', err);
            // Silently fail - user can try again on next blur
        }
    };

    return (
        <>
            {/* Patient Header */}
            <div className="bg-white border-b border-slate-200 p-4">
                <PatientInfoCard patient={selectedPatient} />
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 flex justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'history'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Patient History
                    </button>
                    <button
                        onClick={() => setActiveTab('exTx')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'exTx'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Ex & Tx Creation
                    </button>
                    <button
                        onClick={() => setActiveTab('txProcessing')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'txProcessing'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Tx Processing
                    </button>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={onShowCheckoutModal}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <CheckSquare size={18} />
                    Checkout
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Patient History Tab */}
                {activeTab === 'history' && (
                    <div>
                        <div className="mb-4 flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                            <Calendar size={18} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700">Date Range:</span>
                            <input
                                type="date"
                                value={historyDateRange.start}
                                onChange={(e) => setHistoryDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-500">to</span>
                            <input
                                type="date"
                                value={historyDateRange.end}
                                onChange={(e) => setHistoryDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {isLoading && <p>Loading history...</p>}
                        {!isLoading && patientHistory.length === 0 && (
                            <p className="text-slate-500 text-center py-8">No previous visits</p>
                        )}
                        {!isLoading && patientHistory.map((visit, index) => {
                            const visitDate = new Date(visit.visit_date);
                            if (historyDateRange.start && visitDate < new Date(historyDateRange.start)) return null;
                            if (historyDateRange.end && visitDate > new Date(historyDateRange.end)) return null;

                            return (
                                <div
                                    key={visit.visit_id || index}
                                    className="bg-white p-6 mb-4 rounded-lg border border-slate-200 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            {new Date(visit.visit_date).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                            {visit.status}
                                        </span>
                                    </div>
                                    {visit.doctor_name && (
                                        <p className="text-sm text-slate-600 mb-2">
                                            <strong>Doctor:</strong> {visit.doctor_name} ({visit.specialty})
                                        </p>
                                    )}
                                    {visit.chief_complaint && (
                                        <p className="text-sm text-slate-600 mb-2">
                                            <strong>Chief Complaint:</strong> {visit.chief_complaint}
                                        </p>
                                    )}
                                    {visit.principal_diagnosis && (
                                        <p className="text-sm text-slate-600 mb-2">
                                            <strong>Diagnosis:</strong> {visit.principal_diagnosis}
                                        </p>
                                    )}
                                    {visit.treatments && visit.treatments.length > 0 && (
                                        <div className="mt-3">
                                            <strong className="text-sm text-slate-700">Treatments:</strong>
                                            <ul className="mt-2 space-y-1">
                                                {visit.treatments.map((t, i) => (
                                                    <li key={i} className="text-sm text-slate-600 ml-4">
                                                        • {t.code} - {t.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Ex & Tx Creation Tab */}
                {activeTab === 'exTx' && (
                    <div>
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => setExamSubPage('medicalHistory')}
                                className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                                    examSubPage === 'medicalHistory'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                Medical History
                            </button>
                            <button
                                onClick={() => setExamSubPage('examination')}
                                className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                                    examSubPage === 'examination'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                Examination
                            </button>
                        </div>

                        {examSubPage === 'medicalHistory' && (
                            <form onSubmit={handleSaveMedicalHistory} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-800 mb-6">Medical History</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Chief Complaint (CC)
                                        </label>
                                        <textarea
                                            value={medicalHistoryForm.chief_complaint}
                                            onChange={(e) => setMedicalHistoryForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                                            rows="3"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter chief complaint..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Present Illness (PI)
                                        </label>
                                        <textarea
                                            value={medicalHistoryForm.present_illness}
                                            onChange={(e) => setMedicalHistoryForm(prev => ({ ...prev, present_illness: e.target.value }))}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter present illness..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Past Medical History (PMH)
                                        </label>
                                        <textarea
                                            value={medicalHistoryForm.past_medical_history}
                                            onChange={(e) => setMedicalHistoryForm(prev => ({ ...prev, past_medical_history: e.target.value }))}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter past medical history..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Save History
                                    </button>
                                </div>
                            </form>
                        )}

                        {examSubPage === 'examination' && (
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Examination & Treatment Plan</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowTreatmentModal(true)}
                                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        + Add Treatment
                                    </button>
                                </div>

                                {visitTreatments.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No treatments added yet. Click "+ Add Treatment" to begin.</p>
                                ) : (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Location</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Clinical Findings</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Diagnosis</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Treatment</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Price</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {visitTreatments.map((vt, index) => (
                                                    <tr key={vt.visit_treatment_id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={vt.location || ''}
                                                                onChange={(e) => handleUpdateTreatmentField(vt.visit_treatment_id, 'location', e.target.value)}
                                                                onBlur={() => handleAutoSaveTreatment(vt.visit_treatment_id)}
                                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="e.g., Tooth #14"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={vt.clinical_findings || ''}
                                                                onChange={(e) => handleUpdateTreatmentField(vt.visit_treatment_id, 'clinical_findings', e.target.value)}
                                                                onBlur={() => handleAutoSaveTreatment(vt.visit_treatment_id)}
                                                                rows="2"
                                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Clinical findings..."
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={vt.diagnosis || ''}
                                                                onChange={(e) => handleUpdateTreatmentField(vt.visit_treatment_id, 'diagnosis', e.target.value)}
                                                                onBlur={() => handleAutoSaveTreatment(vt.visit_treatment_id)}
                                                                rows="2"
                                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Diagnosis..."
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">
                                                            <div className="font-medium">{vt.code}</div>
                                                            <div className="text-xs text-slate-500">{vt.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700 text-right">
                                                            ฿{parseFloat(vt.price || vt.actual_price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleRemoveTreatment(vt.visit_treatment_id)}
                                                                className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tx Processing Tab */}
                {activeTab === 'txProcessing' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-800">Treatment Processing</h2>
                            <button
                                onClick={() => setShowTreatmentModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + Add Treatment
                            </button>
                        </div>
                        {visitTreatments.length === 0 ? (
                            <p className="text-slate-500 text-center py-12 bg-white rounded-lg border border-slate-200">
                                No treatments added yet
                            </p>
                        ) : (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Code</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Price</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {visitTreatments.map((vt) => (
                                            <tr key={vt.visit_treatment_id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm text-slate-700">{vt.code}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{vt.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700 text-right">
                                                    ฿{parseFloat(vt.price || vt.actual_price || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleRemoveTreatment(vt.visit_treatment_id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Treatment Search Modal */}
            {showTreatmentModal && (
                <SearchTreatmentModal
                    onSelect={handleTreatmentSelect}
                    onClose={() => setShowTreatmentModal(false)}
                />
            )}
        </>
    );
};

// Main DoctorDashboard component
const DoctorDashboard = ({ selectedClinic }) => {
    const { user } = useAuth();

    // Layout state
    const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);

    // Queue and patient state
    const [allPatients, setAllPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    // Filter state
    const [statusFilters, setStatusFilters] = useState({
        queue: true,
        draftCheckout: false,
        checkout: false
    });
    const [checkoutDateRange, setCheckoutDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Checkout modal state
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Check role authorization
    useEffect(() => {
        if (user && user.role !== 'doctor') {
            alert('Access denied. This page is for doctors only.');
            window.history.back();
        }
    }, [user]);

    // Fetch queue based on filters
    useEffect(() => {
        if (user && selectedClinic) {
            fetchQueue();
            const interval = setInterval(fetchQueue, 30000);
            return () => clearInterval(interval);
        }
    }, [user, selectedClinic, statusFilters, checkoutDateRange]);

    const fetchQueue = async () => {
        if (!user || !selectedClinic) return;

        try {
            const statuses = [];
            if (statusFilters.queue) statuses.push('checked-in');
            if (statusFilters.draftCheckout) statuses.push('draft_checkout');
            if (statusFilters.checkout) statuses.push('completed');

            const statusParam = statuses.join(',');
            const url = `/api/visits/queue/${user.id}?clinic_id=${selectedClinic}&status=${statusParam}`;

            const res = await authorizedFetch(url);
            if (!res.ok) throw new Error('Failed to fetch queue');

            const data = await res.json();
            console.log('Fetched queue:', data);
            setAllPatients(data);
        } catch (err) {
            console.error('Error fetching queue:', err);
        }
    };

    // Handle checkout
    const handleCheckout = async (password, isDraft) => {
        const selectedPatient = allPatients.find(p => p.visit_id === selectedPatientId);
        if (!selectedPatient) return;

        try {
            const status = isDraft ? 'draft_checkout' : 'completed';
            const res = await authorizedFetch(`/api/visits/${selectedPatient.visit_id}/checkout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, status })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to checkout');
            }

            alert(`Patient ${isDraft ? 'moved to draft checkout' : 'checked out'} successfully`);
            setSelectedPatientId(null);
            setShowCheckoutModal(false);
            fetchQueue();
        } catch (err) {
            throw err;
        }
    };

    const getAlertColor = (level) => {
        if (!level) return '#10B981';
        if (level >= 3) return '#EF4444';
        if (level >= 2) return '#F59E0B';
        return '#10B981';
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'checked-in') return { bg: '#DBEAFE', text: '#1E40AF', label: 'Queue' };
        if (statusLower === 'draft_checkout') return { bg: '#E9D5FF', text: '#7C3AED', label: 'Draft' };
        if (statusLower === 'completed') return { bg: '#D1FAE5', text: '#047857', label: 'Complete' };
        return { bg: '#F3F4F6', text: '#6B7280', label: status };
    };

    // Find the selected patient object
    const selectedPatient = allPatients.find(p => p.visit_id === selectedPatientId);

    return (
        <div className="h-full flex flex-row bg-slate-100">
            {/* Patient Queue Sidebar */}
            <div className="w-32 bg-white border-r border-slate-200 overflow-y-auto p-3 flex flex-col">
                <button
                    onClick={() => setIsSubSidebarOpen(!isSubSidebarOpen)}
                    className="w-full mb-3 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
                    title="Toggle filters"
                >
                    {isSubSidebarOpen ? (
                        <ChevronsLeft size={20} className="text-blue-600" />
                    ) : (
                        <ChevronsRight size={20} className="text-blue-600" />
                    )}
                </button>

                <h3 className="text-xs font-semibold text-slate-700 mb-3 text-center">Patients</h3>

                {allPatients.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center">No patients</p>
                ) : (
                    allPatients.map((patient) => {
                        const statusBadge = getStatusBadge(patient.status);

                        // Calculate waiting time in minutes
                        const checkInTime = new Date(patient.check_in_time);
                        const now = new Date();
                        const waitingMinutes = Math.floor((now - checkInTime) / (1000 * 60));

                        // Determine warning indicators
                        const showRedExclamation = waitingMinutes > 15;
                        const showRedBox = waitingMinutes > 45;

                        return (
                            <div
                                key={patient.visit_id}
                                onClick={() => {
                                    console.log('Selected patient:', patient.dn, patient.visit_id);
                                    setSelectedPatientId(patient.visit_id);
                                }}
                                className="relative p-2 mb-2 rounded-lg cursor-pointer transition-all"
                                style={{
                                    backgroundColor: showRedBox ? '#FEE2E2' : (selectedPatientId === patient.visit_id ? '#E0F2FE' : '#F9FAFB'),
                                    border: `2px solid ${showRedBox ? '#EF4444' : getAlertColor(patient.alert_level)}`
                                }}
                            >
                                <div
                                    className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                                    style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                                >
                                    {statusBadge.label}
                                </div>
                                <div className="font-bold text-sm text-center mt-3 flex items-center justify-center gap-1" style={{ color: getAlertColor(patient.alert_level) }}>
                                    {showRedExclamation && <span className="text-red-600 font-bold">!</span>}
                                    {patient.dn}
                                </div>
                                <div className="text-xs text-slate-600 text-center truncate">
                                    {patient.first_name_th}
                                </div>
                                <div className="text-xs text-slate-400 text-center mt-1">
                                    {new Date(patient.check_in_time).toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sub-Sidebar */}
            {isSubSidebarOpen && (
                <DoctorSubSidebar
                    statusFilters={statusFilters}
                    onStatusFilterChange={(filter, checked) => setStatusFilters(prev => ({ ...prev, [filter]: checked }))}
                    checkoutDateRange={checkoutDateRange}
                    onCheckoutDateChange={(field, value) => setCheckoutDateRange(prev => ({ ...prev, [field]: value }))}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {!selectedPatient ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <h2 className="text-2xl font-semibold">Doctor Dashboard</h2>
                            <p className="mt-2">Select a patient from the queue to begin</p>
                        </div>
                    </div>
                ) : (
                    <DoctorMainContent
                        key={selectedPatient.visit_id}
                        selectedPatient={selectedPatient}
                        onShowCheckoutModal={() => setShowCheckoutModal(true)}
                        onRefreshQueue={fetchQueue}
                    />
                )}
            </main>

            {/* Checkout Modal */}
            {showCheckoutModal && selectedPatient && (
                <CheckoutModal
                    patient={selectedPatient}
                    onClose={() => setShowCheckoutModal(false)}
                    onCheckout={handleCheckout}
                />
            )}
        </div>
    );
};

export default DoctorDashboard;
