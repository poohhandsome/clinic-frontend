// src/components/AddNewPatientModal.jsx (NEW FILE)

import React, { useState } from 'react';
import { Upload, User, Mail, Phone, Home, PlusCircle } from 'lucide-react';

// A reusable input component for this form
const InputField = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
    </div>
);

// A reusable textarea component
const TextareaField = ({ label, name, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
    </div>
);


export default function AddNewPatientModal({ onClose }) {
    const [formData, setFormData] = useState({
        dn: '',
        dn_old: '',
        id_type: 'สมุด DC',
        id_number: '',
        title_th: '',
        fname_th: '',
        lname_th: '',
        title_en: '',
        fname_en: '',
        lname_en: '',
        nickname: '',
        gender: '',
        dob: '',
        chronic_diseases: '',
        allergies: '',
        mobile_phone: '',
        home_phone: '',
        line_id: '',
        email: '',
        address: '',
        sub_district: '',
        district: '',
        province: '',
        country: 'Thailand',
        zip_code: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement API call to save new patient
        console.log("New Patient Data:", formData);
        onClose(); // Close modal on submit
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
                    {/* --- Column 1: Photo & ID --- */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <InputField label="Patient ID (DN)" name="dn" value={formData.dn} onChange={handleChange} placeholder="Auto-generated" />
                            <InputField label="DN(เดิม)" name="dn_old" value={formData.dn_old} onChange={handleChange} placeholder="Optional" />
                        </div>
                        <div className="w-full h-48 bg-slate-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed">
                             <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2">
                                <User size={32} />
                            </div>
                            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600">
                                <Upload size={16} /> อัปโหลดรูป
                            </button>
                        </div>
                    </div>

                    {/* --- Column 2: Personal Info --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 border-b pb-2">ประวัติส่วนตัว (Personal Info)</h3>
                         <div>
                            <div className="flex gap-2 mb-2">
                                <button type="button" className={`px-3 py-1 text-sm rounded-full ${formData.id_type === 'สมุด DC' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`} onClick={() => setFormData(p => ({...p, id_type: 'สมุด DC'}))}>สมุด DC</button>
                                <button type="button" className={`px-3 py-1 text-sm rounded-full ${formData.id_type === 'สมุด MOI' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`} onClick={() => setFormData(p => ({...p, id_type: 'สมุด MOI'}))}>สมุด MOI</button>
                                <button type="button" className={`px-3 py-1 text-sm rounded-full ${formData.id_type === 'เลขที่บัตร' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`} onClick={() => setFormData(p => ({...p, id_type: 'เลขที่บัตร'}))}>เลขที่บัตร</button>
                            </div>
                            <InputField label="" name="id_number" value={formData.id_number} onChange={handleChange} placeholder={`Enter ${formData.id_type}`} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                             <InputField label="คำนำหน้า" name="title_th" value={formData.title_th} onChange={handleChange} placeholder="นาย/นาง" />
                             <div className="col-span-2"><InputField label="ชื่อ" name="fname_th" value={formData.fname_th} onChange={handleChange} /></div>
                        </div>
                         <InputField label="สกุล" name="lname_th" value={formData.lname_th} onChange={handleChange} />
                         <div className="grid grid-cols-3 gap-2">
                             <InputField label="Title" name="title_en" value={formData.title_en} onChange={handleChange} placeholder="Mr./Mrs." />
                             <div className="col-span-2"><InputField label="First Name" name="fname_en" value={formData.fname_en} onChange={handleChange} /></div>
                        </div>
                         <InputField label="Last Name" name="lname_en" value={formData.lname_en} onChange={handleChange} />
                         <InputField label="ชื่อเล่น" name="nickname" value={formData.nickname} onChange={handleChange} />
                         <div className="grid grid-cols-2 gap-4">
                            <InputField label="เพศ (Gender)" name="gender" value={formData.gender} onChange={handleChange} />
                            <InputField label="วันเกิด (Date of Birth)" name="dob" value={formData.dob} onChange={handleChange} type="date"/>
                         </div>
                         <TextareaField label="โรคประจำตัว (Chronic Diseases)" name="chronic_diseases" value={formData.chronic_diseases} onChange={handleChange} />
                         <TextareaField label="อาการแพ้ (Allergies)" name="allergies" value={formData.allergies} onChange={handleChange} />
                    </div>

                    {/* --- Column 3: Contact Details --- */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-slate-700 border-b pb-2">รายละเอียดติดต่อ (Contact Details)</h3>
                         <InputField label="เบอร์โทรศัพท์มือถือ" name="mobile_phone" value={formData.mobile_phone} onChange={handleChange} />
                         <InputField label="เบอร์โทรบ้าน" name="home_phone" value={formData.home_phone} onChange={handleChange} />
                         <InputField label="Line ID" name="line_id" value={formData.line_id} onChange={handleChange} />
                         <InputField label="Email" name="email" value={formData.email} onChange={handleChange} type="email"/>
                         <TextareaField label="ที่อยู่" name="address" value={formData.address} onChange={handleChange} />
                         <div className="grid grid-cols-2 gap-4">
                             <InputField label="ตำบล" name="sub_district" value={formData.sub_district} onChange={handleChange} />
                             <InputField label="อำเภอ" name="district" value={formData.district} onChange={handleChange} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <InputField label="จังหวัด" name="province" value={formData.province} onChange={handleChange} />
                             <InputField label="รหัสไปรษณีย์" name="zip_code" value={formData.zip_code} onChange={handleChange} />
                         </div>
                          <InputField label="ประเทศ" name="country" value={formData.country} onChange={handleChange} />
                    </div>
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