// src/components/AddNewPatientModal.jsx (REPLACE)

import React, { useState } from 'react';
import { Upload, User, PlusCircle } from 'lucide-react';
import authorizedFetch from '../api';

const InputField = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
    </div>
);
const TextareaField = ({ label, name, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
    </div>
);

export default function AddNewPatientModal({ onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        dn: '', dn_old: '', id_verification_type: 'สมุด DC', id_number: '', title_th: '', first_name_th: '', last_name_th: '',
        title_en: '', first_name_en: '', last_name_en: '', nickname: '', gender: '', date_of_birth: '',
        chronic_diseases: '', allergies: '', mobile_phone: '', home_phone: '', line_id: '', email: '',
        address: '', sub_district: '', district: '', province: '', country: 'Thailand', zip_code: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authorizedFetch('/api/patients', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to create patient.');
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Add New Patient</h2>
                     <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1, 2, 3... */}
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                    <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                        <PlusCircle size={18}/> สร้างคนไข้ใหม่
                    </button>
                </div>
            </form>
        </div>
    );
}