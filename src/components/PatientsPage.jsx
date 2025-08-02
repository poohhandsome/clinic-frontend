// src/components/PatientsPage.jsx (REPLACE)

import React, { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import AddNewPatientModal from './AddNewPatientModal'; // Import Add modal
import SearchPatientModal from './SearchPatientModal'; // Import Search modal

// Placeholder data for the patient table
const placeholderPatients = [
    { dn: 'DN001', dn_old: 'D001', fname: 'สมชาย', lname: 'แข็งแรง', phone: '081-234-5678' },
    { dn: 'DN002', dn_old: '', fname: 'สมศรี', lname: 'สุขใจ', phone: '082-345-6789' },
    { dn: 'DN003', dn_old: 'D003', fname: 'John', lname: 'Doe', phone: '099-876-5432' },
];

export default function PatientsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [patients, setPatients] = useState(placeholderPatients);

    // TODO: Implement API calls for search and add

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Patients</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsSearchModalOpen(true)}
                        className="flex items-center gap-2 w-80 px-4 py-2 text-left bg-white text-slate-500 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50"
                    >
                        <Search size={20} />
                        ค้นหาจาก ชื่อ-สกุล, เบอร์โทร หรือ DN
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700"
                    >
                        <PlusCircle size={18} />
                        Add New Patient
                    </button>
                </div>
            </div>

            {/* Patient Table View */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DN / DN(เดิม)</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ชื่อ</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">นามสกุล</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">เบอร์โทร</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {patients.map((patient, index) => (
                            <tr key={index}>
                                <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{patient.dn}{patient.dn_old && ` (${patient.dn_old})`}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.fname}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.lname}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.phone}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {patients.length === 0 && <p className="text-center text-slate-500 py-8">No patients found.</p>}
            </div>

            {isAddModalOpen && <AddNewPatientModal onClose={() => setIsAddModalOpen(false)} />}
            {isSearchModalOpen && <SearchPatientModal onClose={() => setIsSearchModalOpen(false)} />}
        </div>
    );
}