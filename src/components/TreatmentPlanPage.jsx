// src/components/TreatmentPlanPage.jsx

import React, { useState } from 'react';
import { Clock, Stethoscope, ClipboardList, Microscope, UploadCloud, FileText, Download, Save, Send, Printer } from 'lucide-react';

// Dummy Data for Illustration
const dummyPatient = {
    name: 'John Doe',
    id: 'DN12345',
    age: 45,
    gender: 'Male',
    allergies: 'Penicillin',
    nextAppointment: '2025-08-15T10:00:00Z',
};

const dummyHistory = [
    { date: '2025-05-20', type: 'Visit Note', doctor: 'Dr. Alice', details: 'Routine check-up and cleaning. No issues found.' },
    { date: '2024-11-10', type: 'Treatment', doctor: 'Dr. Bob', details: 'Filled a cavity on molar #14.' },
    { date: '2024-02-01', type: 'Medical History', details: 'Updated medical history. Patient diagnosed with hypertension.' },
];

const dummyOngoingTreatments = [
    { id: 'tx-001', name: 'Root Canal Therapy on #19', status: 'in-progress', progress: 50 },
    { id: 'tx-002', name: 'Invisalign - Upper & Lower', status: 'pending', progress: 0 },
    { id: 'tx-003', name: 'Crown Placement on #30', status: 'completed', progress: 100 },
];

const dummyDocuments = [
    { id: 'doc-1', name: 'panoramic-xray-2025.jpg', type: 'Radiograph', uploaded: '2025-05-20' },
    { id: 'doc-2', name: 'referral-note-ortho.pdf', type: 'External Report', uploaded: '2024-11-15' },
];

// Reusable Components
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

const PatientHeader = ({ patient }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span>ID: {patient.id}</span>
                    <span>Age: {patient.age}</span>
                    <span>Gender: {patient.gender}</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                    Allergies: {patient.allergies}
                </div>
                <div className="text-sm text-slate-600 mt-2">
                    Next Appointment: {format(new Date(patient.nextAppointment), 'd MMM yyyy, h:mm a')}
                </div>
            </div>
        </div>
    </div>
);

// Tab Content Components
const HistoryReview = () => (
    <div className="space-y-4">
        {dummyHistory.map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                <div className="flex-shrink-0 w-24 text-right">
                    <div className="font-semibold text-slate-700">{format(new Date(item.date), 'd MMM yyyy')}</div>
                    <div className="text-xs text-slate-500">{item.type}</div>
                </div>
                <div className="border-l-2 border-slate-200 pl-4">
                    <p className="text-slate-800">{item.details}</p>
                    {item.doctor && <p className="text-xs text-slate-500 mt-1">Provider: {item.doctor}</p>}
                </div>
            </div>
        ))}
    </div>
);

const ExTxCreated = () => (
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

const TreatmentProcessing = () => (
    <div className="bg-white rounded-lg border divide-y">
        {dummyOngoingTreatments.map(tx => (
            <div key={tx.id} className="p-4 grid grid-cols-3 items-center gap-4">
                <div className="font-semibold text-slate-800">{tx.name}</div>
                <div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${tx.progress}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <StatusTag status={tx.status} />
                    <button className="text-sm font-semibold text-blue-600 hover:underline">Update</button>
                </div>
            </div>
        ))}
    </div>
);

const StatusTag = ({ status }) => {
    const statusMap = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status]}`}>{status.replace('-', ' ')}</span>;
};


const ScanDocuments = () => (
    <div className="bg-white p-4 rounded-lg border">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mb-6">
            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">Drag & drop files here or click to upload</p>
            <input type="file" className="hidden" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dummyDocuments.map(doc => (
                <div key={doc.id} className="border rounded-lg p-3 flex items-center gap-3">
                    <FileText className="h-10 w-10 text-slate-500 flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-sm font-semibold truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <Download size={16} />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export default function TreatmentPlanPage() {
    const [activeTab, setActiveTab] = useState('history');

    const tabs = [
        { id: 'history', label: 'History Review', icon: <Clock size={16} /> },
        { id: 'create', label: 'Ex & Tx Created', icon: <Stethoscope size={16} /> },
        { id: 'processing', label: 'Treatment Processing', icon: <ClipboardList size={16} /> },
        { id: 'scans', label: 'Scan Documents', icon: <Microscope size={16} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'history': return <HistoryReview />;
            case 'create': return <ExTxCreated />;
            case 'processing': return <TreatmentProcessing />;
            case 'scans': return <ScanDocuments />;
            default: return null;
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            <PatientHeader patient={dummyPatient} />

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