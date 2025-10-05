// src/components/TreatmentPlanPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Stethoscope, ClipboardList, Microscope, UploadCloud, FileText, Download, Save, Send, Printer } from 'lucide-react';
import authorizedFetch from '../api';
import PatientInfoColumn from './PatientInfoColumn';

// --- Main Component ---
export default function TreatmentPlanPage({ user, patientId, checkInTime }) {
    const [activeTab, setActiveTab] = useState('history');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // This single, powerful useEffect handles ALL patient data loading.
    // It runs whenever the patientId from the URL changes.
    useEffect(() => {
        if (patientId) {
            setIsLoading(true);
            // Fetch both the patient's main details and their history at the same time.
            Promise.all([
                authorizedFetch(`/api/patients/${patientId}`),
                authorizedFetch(`/api/patients/${patientId}/treatment-history`)
            ])
            .then(async ([patientRes, historyRes]) => {
                if (!patientRes.ok) throw new Error('Failed to fetch patient details.');
                if (!historyRes.ok) throw new Error('Failed to fetch patient history.');
                
                const patientData = await patientRes.json();
                const historyData = await historyRes.json();
                
                setSelectedPatient(patientData);
                setHistory(historyData);
            })
            .catch(err => {
                console.error("Error fetching patient data:", err);
                setSelectedPatient(null);
                setHistory(null);
            })
            .finally(() => setIsLoading(false));
        } else {
            // If there's no patientId in the URL, clear everything.
            setSelectedPatient(null);
            setHistory(null);
            setIsLoading(false);
        }
    }, [patientId]); // The key: This effect only depends on the ID from the URL.

    // This function's ONLY job is to change the URL.
    // The useEffect above will handle the rest.
    const handlePatientSelect = (patient) => {
        window.location.hash = `#/treatment-plan/${patient.patient_id}`;
    };

    const tabs = [
        { id: 'history', label: 'History Review', icon: <Clock size={16} /> },
        { id: 'create', label: 'Ex & Tx Created', icon: <Stethoscope size={16} /> },
        { id: 'processing', label: 'Treatment Processing', icon: <ClipboardList size={16} /> },
        { id: 'scans', label: 'Scan Documents', icon: <Microscope size={16} /> },
    ];

    return (
        <div className="h-full flex flex-row bg-slate-50">
            {/* Column 1: Patient Information */}
            <PatientInfoColumn 
                patient={selectedPatient} 
                onPatientSelect={handlePatientSelect}
                checkInTime={checkInTime}
            />

            {/* Column 2: Treatment Plan Tabs */}
            <main className="flex-1 p-6 overflow-y-auto">
                {!selectedPatient ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <Stethoscope size={48} className="mx-auto text-slate-400" />
                            <h2 className="mt-4 text-xl font-semibold text-slate-600">No Patient Selected</h2>
                            <p className="text-slate-500">Please search for a patient to view or create a treatment plan.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-slate-200">
                            <nav className="-mb-px flex space-x-6">
                                {tabs.map(tab => (
                                    <TabButton
                                        key={tab.id}
                                        active={activeTab === tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        icon={tab.icon}
                                    >
                                        {tab.label}
                                    </TabButton>
                                ))}
                            </nav>
                        </div>
                        <div className="mt-6">
                            {isLoading && <p>Loading history...</p>}
                            {!isLoading && history && (
                                <>
                                    {activeTab === 'history' && <HistoryReview history={history} />}
                                    {activeTab === 'create' && <ExTxCreated patientId={selectedPatient.patient_id} doctorId={user.id} />}
                                    {activeTab === 'processing' && <TreatmentProcessing plans={history.plans} items={history.items} />}
                                    {activeTab === 'scans' && <ScanDocuments patientId={selectedPatient.patient_id} documents={history.documents} />}
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}


// --- Child and Helper Components (No changes needed below this line) ---
// ... The rest of the page components (HistoryReview, PatientInfoColumn, etc.) remain the same ...

const HistoryReview = ({ history }) => {
    const timeline = [
        ...(history.findings || []).map(f => ({ ...f, type: 'Exam Finding', date: f.finding_date, details: `Complaint: ${f.chief_complaint || 'N/A'}. Findings: ${f.clinical_findings || 'N/A'}` })),
        ...(history.plans || []).map(p => ({ ...p, type: 'Treatment Plan Created', date: p.plan_date, details: p.notes || 'Plan initiated.' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-4">
            {timeline.length === 0 && <p className="text-slate-500 text-center py-4">No history found for this patient.</p>}
            {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                    <div className="flex-shrink-0 w-24 text-right">
                        <div className="font-semibold text-slate-700">{format(new Date(item.date), 'd MMM yyyy')}</div>
                        <div className="text-xs text-slate-500">{item.type}</div>
                    </div>
                    <div className="border-l-2 border-slate-200 pl-4">
                        <p className="text-slate-800">{item.details}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TreatmentProcessing = ({ plans, items }) => {
    const [upperSectionTreatments, setUpperSectionTreatments] = useState([]);
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [showRecordBox, setShowRecordBox] = useState(null);
    const [treatmentRecords, setTreatmentRecords] = useState({});
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Toggle plan selection - moves to upper section when checked
    const toggleSelectPlan = (plan) => {
        if (selectedPlans.includes(plan.plan_id)) {
            // Uncheck - remove from selected
            setSelectedPlans(selectedPlans.filter(id => id !== plan.plan_id));
            setUpperSectionTreatments(upperSectionTreatments.filter(t => t.plan_id !== plan.plan_id));
        } else {
            // Check - add to upper section
            setSelectedPlans([...selectedPlans, plan.plan_id]);
            setUpperSectionTreatments([...upperSectionTreatments, { ...plan, status: 'In Progress' }]);
        }
    };

    // Save treatment record
    const saveTreatmentRecord = async (treatmentId) => {
        const record = treatmentRecords[treatmentId];
        if (!record || !record.trim()) {
            alert('Please write treatment details before saving');
            return;
        }

        try {
            const res = await authorizedFetch('/api/treatment-plans/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_id: treatmentId,
                    treatment_record: record,
                    recorded_at: new Date()
                })
            });

            if (!res.ok) throw new Error('Failed to save record');

            alert('Treatment record saved successfully');
            setShowRecordBox(null);
        } catch (error) {
            alert('Error saving record: ' + error.message);
        }
    };

    // Mark treatment as complete
    const markComplete = async (treatment) => {
        try {
            const res = await authorizedFetch(`/api/treatment-plans/${treatment.plan_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            if (!res.ok) throw new Error('Failed to mark complete');

            // Remove from upper section
            setUpperSectionTreatments(upperSectionTreatments.filter(t => t.plan_id !== treatment.plan_id));
            setSelectedPlans(selectedPlans.filter(id => id !== treatment.plan_id));

            alert('Treatment marked as complete');
        } catch (error) {
            alert('Error marking complete: ' + error.message);
        }
    };

    // Continue treatment later
    const continueLater = async (treatment) => {
        try {
            const res = await authorizedFetch(`/api/treatment-plans/${treatment.plan_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'In Progress' })
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Move back to lower section only
            setUpperSectionTreatments(upperSectionTreatments.filter(t => t.plan_id !== treatment.plan_id));
            setSelectedPlans(selectedPlans.filter(id => id !== treatment.plan_id));

            alert('Treatment will continue next visit');
        } catch (error) {
            alert('Error updating treatment: ' + error.message);
        }
    };

    const handleCheckout = () => {
        if (upperSectionTreatments.length === 0) {
            alert('No treatments in progress. Please select treatments first.');
            return;
        }

        alert('Checkout functionality - only completed treatments will be billed');
    };

    return (
        <div className="space-y-6">
            {/* UPPER SECTION: Treatments In Progress */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Treatments In Progress</h3>
                {upperSectionTreatments.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 italic">
                        No treatments selected yet. Select from available plans below.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upperSectionTreatments.map(treatment => (
                            <div key={treatment.plan_id} className="border border-slate-300 rounded-lg p-4 bg-slate-50 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-2">{treatment.description || treatment.notes || 'Treatment'}</h4>
                                <p className="text-sm text-slate-600">
                                    <strong>Tooth:</strong> {treatment.tooth_numbers || 'N/A'}
                                </p>
                                <p className="text-sm text-slate-600 mb-3">
                                    <strong>Cost:</strong> ฿{treatment.cost || treatment.estimated_cost || 0}
                                </p>

                                {/* Write Record Button */}
                                <button
                                    onClick={() => setShowRecordBox(showRecordBox === treatment.plan_id ? null : treatment.plan_id)}
                                    className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 mb-2 flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} />
                                    {showRecordBox === treatment.plan_id ? 'Hide Record' : 'Write Record ✍️'}
                                </button>

                                {/* Text Box for Treatment Record */}
                                {showRecordBox === treatment.plan_id && (
                                    <div className="mb-2">
                                        <textarea
                                            placeholder="Write treatment details (what was done today)..."
                                            value={treatmentRecords[treatment.plan_id] || ''}
                                            onChange={(e) => setTreatmentRecords({
                                                ...treatmentRecords,
                                                [treatment.plan_id]: e.target.value
                                            })}
                                            rows="4"
                                            className="w-full p-2 border border-slate-300 rounded-md text-sm mb-2"
                                        />
                                        <button
                                            onClick={() => saveTreatmentRecord(treatment.plan_id)}
                                            className="w-full px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                                        >
                                            Save Record
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => markComplete(treatment)}
                                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700"
                                    >
                                        ✓ Mark Complete
                                    </button>
                                    <button
                                        onClick={() => continueLater(treatment)}
                                        className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-md hover:bg-yellow-700"
                                    >
                                        → Continue Later
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LOWER SECTION: Available Treatment Plans */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Available Treatment Plans</h3>
                {(!plans || plans.length === 0) ? (
                    <p className="text-slate-500 text-center py-8">No treatment plans found for this patient.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div key={plan.plan_id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlans.includes(plan.plan_id)}
                                        onChange={() => toggleSelectPlan(plan)}
                                        className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800">{plan.description || plan.notes || 'Treatment Plan'}</h4>
                                        <p className="text-sm text-slate-600 mt-1">
                                            <strong>Tooth:</strong> {plan.tooth_numbers || 'N/A'}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            <strong>Status:</strong> <StatusTag status={plan.status || 'Pending'} />
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            <strong>Cost:</strong> ฿{plan.cost || plan.estimated_cost || 0}
                                        </p>
                                        {plan.plan_date && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Created: {format(new Date(plan.plan_date), 'd MMM yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Checkout Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isCheckingOut ? 'Processing...' : 'Check Out'}
                </button>
            </div>
        </div>
    );
};

const ExTxCreated = ({ patientId, doctorId }) => (
     <div className="p-4 bg-white rounded-lg border space-y-6">
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-2">Examination Findings (Ex)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea placeholder="Chief Complaint..." rows="3" className="w-full p-2 border rounded-md"></textarea>
                <textarea placeholder="Clinical Findings..." rows="3" className="w-full p-2 border rounded-md"></textarea>
            </div>
        </div>
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-2">Treatment Plan (Tx)</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Treatment Item (e.g., Crown on #14)" className="flex-grow p-2 border rounded-md" />
                    <select className="p-2 border rounded-md bg-white">
                        <option>High Priority</option>
                        <option>Medium Priority</option>
                        <option>Low Priority</option>
                    </select>
                    <button className="px-3 py-2 bg-slate-200 rounded-md hover:bg-slate-300 text-sm">Add</button>
                </div>
            </div>
        </div>
        <div className="flex justify-end items-center gap-4 pt-4 border-t">
            <span className="text-xs text-slate-500">Last saved: Not saved</span>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                <Save size={16} /> Save Plan
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700">
                <Send size={16} /> Submit for Approval
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-600">
                <Printer size={16} /> Print
            </button>
        </div>
    </div>
);

const ScanDocuments = ({ patientId, documents }) => (
    <div className="bg-white p-4 rounded-lg border">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mb-6">
            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">Drag & drop files here or click to upload</p>
            <input type="file" className="hidden" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(!documents || documents.length === 0) && <p className="text-slate-500 text-center py-4 col-span-full">No documents uploaded.</p>}
            {(documents || []).map(doc => (
                <div key={doc.document_id} className="border rounded-lg p-3 flex items-center gap-3">
                    <FileText className="h-10 w-10 text-slate-500 flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-sm font-semibold truncate">{doc.file_name}</p>
                        <p className="text-xs text-slate-500">{doc.document_type}</p>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <Download size={16} />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const StatusTag = ({ status }) => {
    const statusMap = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
    };
    const style = statusMap[status] || 'bg-slate-100 text-slate-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>{status}</span>;
};

const TabButton = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            active
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
    >
        {icon}
        {children}
    </button>
);