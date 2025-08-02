// src/components/SearchPatientModal.jsx (NEW FILE)

import React, { useState } from 'react';
import { Search } from 'lucide-react';

const placeholderPatients = [
    { dn: 'DN001', dn_old: 'D001', fname: 'สมชาย', lname: 'แข็งแรง', phone: '081-234-5678' },
    { dn: 'DN002', dn_old: '', fname: 'สมศรี', lname: 'สุขใจ', phone: '082-345-6789' },
    { dn: 'DN003', dn_old: 'D003', fname: 'John', lname: 'Doe', phone: '099-876-5432' },
];

export default function SearchPatientModal({ onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchAllBranches, setSearchAllBranches] = useState(true);
    const [results, setResults] = useState(placeholderPatients);

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement API call for search
        console.log(`Searching for "${searchTerm}" across ${searchAllBranches ? 'all branches' : 'this branch'}`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[70vh] flex flex-col">
                <div className="p-4 border-b">
                    <form onSubmit={handleSearch} className="flex items-center gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาจาก ชื่อ-สกุล, เบอร์โทร หรือ DN"
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-2">
                             <label htmlFor="all-branches" className="text-sm font-medium text-slate-600">ทุกสาขา</label>
                             <button
                                type="button"
                                role="switch"
                                aria-checked={searchAllBranches}
                                onClick={() => setSearchAllBranches(!searchAllBranches)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${searchAllBranches ? 'bg-sky-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${searchAllBranches ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                    </form>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DN / DN(เดิม)</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ชื่อ</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">นามสกุล</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">เบอร์โทร</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                             {results.map((patient, index) => (
                                <tr key={index} className="hover:bg-slate-50 cursor-pointer">
                                    <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{patient.dn}{patient.dn_old && ` (${patient.dn_old})`}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.fname}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.lname}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-2 bg-slate-50 border-t flex justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300">Close</button>
                </div>
            </div>
        </div>
    );
}