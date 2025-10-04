// src/components/SearchPatientModal.jsx (REPLACE)

import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import authorizedFetch from '../api';

export default function SearchPatientModal({ onClose, onSelectPatient }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search function
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await authorizedFetch(`/api/patients?query=${encodeURIComponent(query.trim())}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Patient search error:', err);
            setResults([]);
            alert('Failed to search patients. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce effect - auto-search after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchTerm);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm, performSearch]);

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(searchTerm); // Also allow immediate search on Enter
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                                            <p className="text-sm text-slate-500">Searching...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        {searchTerm ? 'No patients found' : 'Enter search term above'}
                                    </td>
                                </tr>
                            ) : (
                                results.map((patient) => (
                                    <tr key={patient.patient_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { onSelectPatient(patient); onClose(); }}>
                                        <td className="p-3 whitespace-nowrap text-sm font-medium text-slate-900">{patient.dn}{patient.dn_old && ` (${patient.dn_old})`}</td>
                                        <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.first_name_th}</td>
                                        <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.last_name_th}</td>
                                        <td className="p-3 whitespace-nowrap text-sm text-slate-700">{patient.mobile_phone}</td>
                                    </tr>
                                ))
                            )}
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