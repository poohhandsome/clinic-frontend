// src/components/TreatmentPlanPage.jsx (FINAL)

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Stethoscope, ClipboardList, Microscope, UploadCloud, FileText, Download, Save, Send, Printer } from 'lucide-react';
import authorizedFetch from '../api'; // Assuming your API wrapper is set up

// --- Main Component ---
export default function TreatmentPlanPage({ patientId }) { // Now accepts a patientId prop
    const [activeTab, setActiveTab] = useState('history');
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState({ plans: [], items: [], findings: [], documents: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (patientId) {
            setIsLoading(true);
            // Fetch patient details and their full treatment history
            Promise.all([
                authorizedFetch(`/api/patients/${patientId}`),
                authorizedFetch(`/api/patients/${patientId}/treatment-history`)
            ])
            .then(async ([patientRes, historyRes]) => {
                if (!patientRes.ok || !historyRes.ok) throw new Error('Failed to fetch patient data.');
                const patientData = await patientRes.json();
                const historyData = await historyRes.json();
                setPatient(patientData);
                setHistory(historyData);
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
        }
    }, [patientId]);

    const tabs = [
        { id: 'history', label: 'History Review', icon: <Clock size={16} /> },
        { id: 'create', label: 'Ex & Tx Created', icon: <Stethoscope size={16} /> },
        { id: 'processing', label: 'Treatment Processing', icon: <ClipboardList size={16} /> },
        { id: 'scans', label: 'Scan Documents', icon: <Microscope size={16} /> },
    ];

    const renderContent = () => {
        if (isLoading) return <div>Loading patient data...</div>;
        if (!patient) return <div>No patient selected.</div>;

        switch (activeTab) {
            case 'history': return <HistoryReview history={history} />;
            case 'create': return <ExTxCreated patientId={patient.patient_id} />;
            case 'processing': return <TreatmentProcessing plans={history.plans} items={history.items} />;
            case 'scans': return <ScanDocuments patientId={patient.patient_id} documents={history.documents} />;
            default: return null;
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            {patient && <PatientHeader patient={patient} />}

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
        </div>
    );
}


// --- Child Components (with minor adjustments for real data) ---

const PatientHeader = ({ patient }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{patient.first_name_th} {patient.last_name_th}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span>ID: {patient.dn}</span>
                    <span>Age: {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}` : 'N/A'}</span>
                    <span>Gender: {patient.gender}</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                    Allergies: {patient.allergies || 'None'}
                </div>
            </div>
        </div>
    </div>
);


const HistoryReview = ({ history }) => {
    // Combine and sort all history items by date for a timeline view
    const timeline = [
        ...history.findings.map(f => ({ ...f, type: 'Exam Finding', date: f.finding_date })),
        ...history.plans.map(p => ({ ...p, type: 'Treatment Plan Created', date: p.plan_date }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-4">
            {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                    <div className="flex-shrink-0 w-24 text-right">
                        <div className="font-semibold text-slate-700">{format(new Date(item.date), 'd MMM yyyy')}</div>
                        <div className="text-xs text-slate-500">{item.type}</div>
                    </div>
                    <div className="border-l-2 border-slate-200 pl-4">
                        <p className="text-slate-800">
                            {item.chief_complaint && `Complaint: ${item.chief_complaint}`}
                            {item.clinical_findings && `Findings: ${item.clinical_findings}`}
                            {item.notes && `Plan Notes: ${item.notes}`}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};


const TreatmentProcessing = ({ plans, items }) => (
    <div className="bg-white rounded-lg border divide-y">
        {items.filter(i => i.status !== 'Completed').map(item => {
            const plan = plans.find(p => p.plan_id === item.plan_id);
            return (
                <div key={item.item_id} className="p-4 grid grid-cols-3 items-center gap-4">
                    <div>
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        <div className="text-xs text-slate-500">Plan from: {format(new Date(plan.plan_date), 'd MMM yyyy')}</div>
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


// --- Other components like TabButton, ExTxCreated, ScanDocuments, StatusTag remain the same as the previous response ---

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


const ExTxCreated = ({ patientId }) => (
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
            <span className="text-xs text-slate-500">Last saved: Just now</span>
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
            {documents.map(doc => (
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
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status]}`}>{status}</span>;
};