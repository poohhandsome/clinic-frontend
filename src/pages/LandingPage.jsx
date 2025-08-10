import React from 'react';
import { Stethoscope, User, Briefcase } from 'lucide-react';
import clinicLogo from '../assets/clinic-logo.png'; // Make sure this path is correct

const RoleCard = ({ href, icon, title, description }) => (
    <a 
        href={href}
        className="group block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
    >
        <div className="p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-sky-100 text-sky-600 rounded-full mb-6 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500">{description}</p>
        </div>
    </a>
);

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <header className="text-center mb-12">
                <img src={clinicLogo} alt="Clinic Logo" className="w-24 h-24 mx-auto mb-4 rounded-full shadow-md" />
                <h1 className="text-4xl font-extrabold text-slate-800">Newtrend Dental Clinic</h1>
                <p className="text-slate-500 mt-2">Please select your role to proceed.</p>
            </header>

            <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
                <RoleCard 
                    href="#/doctor"
                    icon={<Stethoscope size={32} />}
                    title="Doctors Page"
                    description="Access patient records, create and manage treatment plans, and review clinical history."
                />
                <RoleCard 
                    href="#/nurse"
                    icon={<User size={32} />}
                    title="Nurse Page"
                    description="Manage daily appointments, view schedules, and handle patient check-ins."
                />
                <RoleCard 
                    href="#"
                    icon={<Briefcase size={32} />}
                    title="To Be Announced"
                    description="This section is currently under development. More features coming soon."
                />
            </main>
        </div>
    );
}