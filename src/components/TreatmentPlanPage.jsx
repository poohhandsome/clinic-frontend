// src/components/TreatmentPlanPage.jsx (REPLACE)

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Stethoscope, ClipboardList, Microscope, UploadCloud, FileText, Download, Save, Send, Printer, Search, X } from 'lucide-react';
import authorizedFetch from '../api';
// --- Main Component ---
export default function TreatmentPlanPage({ selectedClinic, user, patientId: initialPatientId }) {
    const [activeTab, setActiveTab] = useState('history');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (initialPatientId) {
            authorizedFetch(`/api/patients/${initialPatientId}`)
                .then(res => res.json())
                .then(patientData => {
                    setSelectedPatient(patientData); // This triggers the second useEffect
                })
                .catch(err => {
                    console.error("Failed to fetch initial patient:", err);
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [initialPatientId]);

    // Fetch history whenever a new patient is selected
    useEffect(() => {
        if (selectedPatient) {
            setIsLoading(true);
            authorizedFetch(`/api/patients/${selectedPatient.patient_id}/treatment-history`)
                .then(res => res.json())
                .then(historyData => setHistory(historyData))
                .catch(err => {
                    console.error("Error fetching patient history:", err);
                    setHistory(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setHistory(null);
        }
    }, [selectedPatient]);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
    };
    const handleClearPatient = () => {
        setSelectedPatient(null);
        // Also clear the URL hash to go back to the search state
        window.location.hash = '#/treatment-plan';
    };

    const tabs = [
        { id: 'history', label: 'History Review', icon: <Clock size={16} /> },
        { id: 'create', label: 'Ex & Tx Created', icon: <Stethoscope size={16} /> },
        { id: 'processing', label: 'Treatment Processing', icon: <ClipboardList size={16} /> },
        { id: 'scans', label: 'Scan Documents', icon: <Microscope size={16} /> },
    ];

    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8">Loading patient data...</div>;
        if (!history) return <div className="text-center p-8 text-slate-500">No history to display.</div>;

        switch (activeTab) {
            case 'history': return <HistoryReview history={history} />;
            case 'create': return <ExTxCreated patientId={selectedPatient.patient_id} doctorId={user.id} />;
            case 'processing': return <TreatmentProcessing plans={history.plans} items={history.items} />;
            case 'scans': return <ScanDocuments patientId={selectedPatient.patient_id} documents={history.documents} />;
            default: return null;
        }
    };
    if (isLoading && !selectedPatient) {
        return <div className="p-6 text-center">Loading...</div>;
    }


    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            {!selectedPatient ? (
                <PatientSearch onPatientSelect={setSelectedPatient} />
            ) : (
                <>
                    <PatientHeader patient={selectedPatient} onClearPatient={handleClearPatient} />
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
                        {renderContent()}
                    </div>
                </>
            )}
        </div>
    );
}

// --- New Search Component ---
const PatientSearch = ({ onPatientSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setIsSearching(true);
        try {
            const res = await authorizedFetch(`/api/patients?query=${searchTerm}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-700 mb-4">Find a Patient</h2>
            <p className="text-center text-slate-500 mb-6">Search by name, DN, or phone number to begin managing a treatment plan.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for patient..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    autoFocus
                />
                <button type="submit" disabled={isSearching} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 disabled:opacity-50">
                    <Search size={20} />
                </button>
            </form>
            <div className="mt-4 bg-white rounded-lg border max-h-96 overflow-y-auto">
                {results.map(patient => (
                    <div
                        key={patient.patient_id}
                        onClick={() => onPatientSelect(patient)}
                        className="p-4 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                    >
                        <p className="font-semibold text-slate-800">{patient.first_name_th} {patient.last_name_th}</p>
                        <p className="text-sm text-slate-500">DN: {patient.dn} | Phone: {patient.mobile_phone}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Child & Helper Components ---

const PatientHeader = ({ patient, onClearPatient }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{patient.first_name_th} {patient.last_name_th}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span>ID: {patient.dn}</span>
                <span>Age: {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}` : 'N/A'}</span>
                <span>Gender: {patient.gender}</span>
            </div>
        </div>
        <div className="text-right">
             <button onClick={onClearPatient} className="text-sm font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1 mb-2">
                <X size={14} /> Change Patient
            </button>
            <div className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                Allergies: {patient.allergies || 'None recorded'}
            </div>
        </div>
    </div>
);

// ... The rest of the components (HistoryReview, TreatmentProcessing, etc.) remain the same as the previous correct version ...

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

const TreatmentProcessing = ({ plans, items }) => (
    <div className="bg-white rounded-lg border divide-y">
         {(!items || items.filter(i => i.status !== 'Completed').length === 0) && <p className="text-slate-500 text-center py-4">No active treatments.</p>}
        {(items || []).filter(i => i.status !== 'Completed').map(item => {
            const plan = (plans || []).find(p => p.plan_id === item.plan_id);
            return (
                <div key={item.item_id} className="p-4 grid grid-cols-3 items-center gap-4">
                    <div>
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        {plan && <div className="text-xs text-slate-500">Plan from: {format(new Date(plan.plan_date), 'd MMM yyyy')}</div>}
                    </div>
                    <div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <StatusTag status={item.status} />
                        <button className="text-sm font-semibold text-blue-600 hover:underline">Update</button>
                    </div>
                </div>
            );
        })}
    </div>
);

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