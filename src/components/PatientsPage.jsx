// src/components/PatientsPage.jsx (NEW FILE)

import React, { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';

// Placeholder data for the patient table
const placeholderPatients = [
    { dn: 'DN001', dn_old: 'D001', fname: 'สมชาย', lname: 'แข็งแรง', phone: '081-234-5678' },
    { dn: 'DN002', dn_old: '', fname: 'สมศรี', lname: 'สุขใจ', phone: '082-345-6789' },
    { dn: 'DN003', dn_old: 'D003', fname: 'John', lname: 'Doe', phone: '099-876-5432' },
];

export default function PatientsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchResults, setSearchResults] = useState(placeholderPatients);

    // TODO: Implement API calls for search and add

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manage Patients</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาจาก ชื่อ-สกุล, เบอร์โทร หรือ DN"
                            className="w-80 pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
                            onFocus={() => setIsSearchModalOpen(true)} // This will later open the search modal
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)} // This will later open the add modal
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
                        {searchResults.map((patient, index) => (
                            <tr key={index}>
                                <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{patient.dn}{patient.dn_old && ` (${patient.dn_old})`}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.fname}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.lname}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.phone}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {searchResults.length === 0 && <p className="text-center text-slate-500 py-8">No patients found.</p>}
            </div>

            {/* Modals will be rendered here later */}
            {/* {isAddModalOpen && <AddNewPatientModal onClose={() => setIsAddModalOpen(false)} />} */}
            {/* {isSearchModalOpen && <SearchPatientModal onClose={() => setIsSearchModalOpen(false)} />} */}
        </div>
    );
}