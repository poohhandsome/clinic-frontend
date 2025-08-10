// src/components/EditPatientModal.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
import { Upload, User, Save } from 'lucide-react';
import authorizedFetch from '../api';
import { format } from 'date-fns';

// Reusable input components
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
    </div>
);

const TextareaField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea {...props} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
    </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <div className="flex items-center">
        <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded text-sky-600 border-gray-300 focus:ring-sky-500" />
        <label htmlFor={name} className="ml-2 block text-sm font-medium text-slate-700">{label}</label>
    </div>
);


export default function EditPatientModal({ patient, onClose, onUpdate }) {
    const [formData, setFormData] = useState({ ...patient });

    useEffect(() => {
        // Format date for the input field
        const formattedPatient = {
            ...patient,
            date_of_birth: patient.date_of_birth ? format(new Date(patient.date_of_birth), 'yyyy-MM-dd') : ''
        };
        setFormData(formattedPatient);
    }, [patient]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authorizedFetch(`/api/patients/${patient.patient_id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to update patient.');
            const updatedPatient = await res.json();
            onUpdate(updatedPatient); // Pass updated data back to the parent
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
                    <h2 className="text-xl font-bold text-slate-800">Edit Patient: {patient.first_name_th} {patient.last_name_th}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Personal & Alerts */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 border-b pb-2">Personal Info</h3>
                        <div className="grid grid-cols-3 gap-2">
                             <InputField label="คำนำหน้า" name="title_th" value={formData.title_th || ''} onChange={handleChange} />
                             <div className="col-span-2"><InputField label="ชื่อ" name="first_name_th" value={formData.first_name_th || ''} onChange={handleChange} /></div>
                        </div>
                        <InputField label="สกุล" name="last_name_th" value={formData.last_name_th || ''} onChange={handleChange} />
                        <InputField label="ชื่อเล่น" name="nickname" value={formData.nickname || ''} onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="เพศ" name="gender" value={formData.gender || ''} onChange={handleChange} />
                            <InputField label="วันเกิด" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} type="date"/>
                        </div>
                        <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Alerts</h3>
                        <TextareaField label="Extreme Care Drugs" name="extreme_care_drugs" value={formData.extreme_care_drugs || ''} onChange={handleChange} />
                        <TextareaField label="Allergies" name="allergies" value={formData.allergies || ''} onChange={handleChange} />
                        <CheckboxField label="Is Pregnant?" name="is_pregnant" checked={!!formData.is_pregnant} onChange={handleChange} />
                    </div>

                    {/* Column 2: Contact Details */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-slate-700 border-b pb-2">Contact Details</h3>
                         <InputField label="เบอร์โทรศัพท์มือถือ" name="mobile_phone" value={formData.mobile_phone || ''} onChange={handleChange} />
                         <InputField label="เบอร์โทรบ้าน" name="home_phone" value={formData.home_phone || ''} onChange={handleChange} />
                         <InputField label="Line ID" name="line_id" value={formData.line_id || ''} onChange={handleChange} />
                         <InputField label="Email" name="email" value={formData.email || ''} onChange={handleChange} type="email"/>
                         <TextareaField label="ที่อยู่" name="address" value={formData.address || ''} onChange={handleChange} />
                         <div className="grid grid-cols-2 gap-4">
                             <InputField label="ตำบล" name="sub_district" value={formData.sub_district || ''} onChange={handleChange} />
                             <InputField label="อำเภอ" name="district" value={formData.district || ''} onChange={handleChange} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <InputField label="จังหวัด" name="province" value={formData.province || ''} onChange={handleChange} />
                             <InputField label="รหัสไปรษณีย์" name="zip_code" value={formData.zip_code || ''} onChange={handleChange} />
                         </div>
                    </div>

                    {/* Column 3: Clinic Identifiers */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 border-b pb-2">Identifiers</h3>
                        <InputField label="Patient ID (DN)" name="dn" value={formData.dn || ''} onChange={handleChange} />
                        <InputField label="DN(เดิม)" name="dn_old" value={formData.dn_old || ''} onChange={handleChange} />
                        <InputField label="ID Number" name="id_number" value={formData.id_number || ''} onChange={handleChange} />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end">
                    <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                        <Save size={18}/> Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}