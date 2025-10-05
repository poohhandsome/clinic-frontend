import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';
import {
    Calendar, Download, FileText, Settings, Plus, Trash2, Save,
    DollarSign, Users, TrendingUp, Filter, X
} from 'lucide-react';

const BillingPage = ({ selectedClinic }) => {
    const { user } = useAuth();

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [isCustomDate, setIsCustomDate] = useState(false);
    const [selectedDoctors, setSelectedDoctors] = useState([]);

    // Data
    const [doctors, setDoctors] = useState([]);
    const [billingData, setBillingData] = useState([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalDoctorPayments: 0,
        totalClinicRevenue: 0,
        doctorPayments: {}
    });

    // Rules
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [compensationRules, setCompensationRules] = useState({
        defaultRate: 50,
        procedureRules: []
    });
    const [treatments, setTreatments] = useState([]);

    // Loading
    const [isLoading, setIsLoading] = useState(false);

    // Fetch doctors
    const fetchDoctors = useCallback(async () => {
        if (!selectedClinic) return;

        try {
            const res = await authorizedFetch(`/api/doctors/unique?clinic_id=${selectedClinic}`);
            if (res.ok) {
                const data = await res.json();
                setDoctors(data);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    }, [selectedClinic]);

    // Fetch treatments
    const fetchTreatments = useCallback(async () => {
        try {
            const res = await authorizedFetch('/api/treatments');
            if (res.ok) {
                const data = await res.json();
                setTreatments(data);
            }
        } catch (err) {
            console.error('Error fetching treatments:', err);
        }
    }, []);

    // Fetch compensation rules
    const fetchCompensationRules = useCallback(async () => {
        if (!selectedClinic) return;

        try {
            const res = await authorizedFetch(`/api/billing/compensation-rules?clinic_id=${selectedClinic}`);
            if (res.ok) {
                const data = await res.json();
                setCompensationRules(data);
            }
        } catch (err) {
            console.error('Error fetching compensation rules:', err);
        }
    }, [selectedClinic]);

    // Save compensation rules
    const saveCompensationRules = async () => {
        if (!selectedClinic) return;

        try {
            const res = await authorizedFetch(`/api/billing/compensation-rules?clinic_id=${selectedClinic}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(compensationRules)
            });

            if (res.ok) {
                alert('✅ Compensation rules saved successfully!');
                setShowRulesModal(false);
            } else {
                throw new Error('Failed to save rules');
            }
        } catch (err) {
            console.error('Error saving compensation rules:', err);
            alert('Failed to save compensation rules');
        }
    };

    // Generate report
    const generateReport = useCallback(async () => {
        if (!selectedClinic) return;

        setIsLoading(true);
        try {
            const startDate = isCustomDate ? customDateRange.start : `${selectedMonth}-01`;
            const endDate = isCustomDate
                ? customDateRange.end
                : `${selectedMonth}-${new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate()}`;

            const doctorFilter = selectedDoctors.length > 0 ? `&doctor_ids=${selectedDoctors.join(',')}` : '';

            const res = await authorizedFetch(
                `/api/billing/payroll-report?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}${doctorFilter}`
            );

            if (res.ok) {
                const data = await res.json();
                setBillingData(data.breakdown);
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    }, [selectedClinic, selectedMonth, customDateRange, isCustomDate, selectedDoctors]);

    // Export to Excel
    const exportToExcel = async () => {
        if (!selectedClinic) return;

        try {
            const startDate = isCustomDate ? customDateRange.start : `${selectedMonth}-01`;
            const endDate = isCustomDate
                ? customDateRange.end
                : `${selectedMonth}-${new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate()}`;

            const doctorFilter = selectedDoctors.length > 0 ? `&doctor_ids=${selectedDoctors.join(',')}` : '';

            const res = await authorizedFetch(
                `/api/billing/export-excel?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}${doctorFilter}`
            );

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payroll_report_${startDate}_${endDate}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Error exporting to Excel:', err);
            alert('Failed to export to Excel');
        }
    };

    // Print doctor summaries
    const printDoctorSummaries = async () => {
        if (!selectedClinic) return;

        try {
            const startDate = isCustomDate ? customDateRange.start : `${selectedMonth}-01`;
            const endDate = isCustomDate
                ? customDateRange.end
                : `${selectedMonth}-${new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate()}`;

            const doctorFilter = selectedDoctors.length > 0 ? `&doctor_ids=${selectedDoctors.join(',')}` : '';

            const res = await authorizedFetch(
                `/api/billing/doctor-summaries-pdf?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}${doctorFilter}`
            );

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const printWindow = window.open(url, '_blank');
                if (printWindow) {
                    printWindow.addEventListener('load', () => {
                        printWindow.print();
                    });
                }
            }
        } catch (err) {
            console.error('Error printing doctor summaries:', err);
            alert('Failed to print doctor summaries');
        }
    };

    // Add new rule
    const addNewRule = () => {
        setCompensationRules(prev => ({
            ...prev,
            procedureRules: [
                ...prev.procedureRules,
                { treatment_id: '', rule_type: 'percentage', value: 50 }
            ]
        }));
    };

    // Remove rule
    const removeRule = (index) => {
        setCompensationRules(prev => ({
            ...prev,
            procedureRules: prev.procedureRules.filter((_, i) => i !== index)
        }));
    };

    // Update rule
    const updateRule = (index, field, value) => {
        setCompensationRules(prev => ({
            ...prev,
            procedureRules: prev.procedureRules.map((rule, i) =>
                i === index ? { ...rule, [field]: value } : rule
            )
        }));
    };

    // Generate month options
    const generateMonthOptions = () => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };

    useEffect(() => {
        if (selectedClinic) {
            fetchDoctors();
            fetchTreatments();
            fetchCompensationRules();
        }
    }, [selectedClinic, fetchDoctors, fetchTreatments, fetchCompensationRules]);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Main Header & Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Doctor Payroll & Financial Reporting</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowRulesModal(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                            <Settings size={20} />
                            <span>Manage Compensation Rules</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                            <Download size={20} />
                            <span>Export to Excel</span>
                        </button>
                        <button
                            onClick={printDoctorSummaries}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <FileText size={20} />
                            <span>Print Doctor Summaries</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                        {!isCustomDate ? (
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setIsCustomDate(true);
                                    } else {
                                        setSelectedMonth(e.target.value);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {generateMonthOptions().map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                                <option value="custom">Custom Date Range...</option>
                            </select>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Start Date"
                                />
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="End Date"
                                />
                                <button
                                    onClick={() => setIsCustomDate(false)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    ← Back to monthly
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Doctor</label>
                        <select
                            multiple
                            value={selectedDoctors}
                            onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedDoctors(values);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            size={5}
                        >
                            <option value="">All Doctors</option>
                            {doctors.map(doc => (
                                <option key={doc.doctor_id} value={doc.doctor_id}>
                                    {doc.full_name}
                                </option>
                            ))}
                        </select>
                        {selectedDoctors.length > 0 && (
                            <button
                                onClick={() => setSelectedDoctors([])}
                                className="mt-2 text-sm text-blue-600 hover:underline flex items-center"
                            >
                                <X size={14} className="mr-1" />
                                Clear selection
                            </button>
                        )}
                    </div>

                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Panel */}
            {billingData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold text-blue-600">฿{summary.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TrendingUp size={32} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Doctor Payments</p>
                                <p className="text-3xl font-bold text-green-600">฿{summary.totalDoctorPayments.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users size={32} className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Clinic Revenue</p>
                                <p className="text-3xl font-bold text-purple-600">฿{summary.totalClinicRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DollarSign size={32} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor Payment Summary */}
            {billingData.length > 0 && Object.keys(summary.doctorPayments).length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Payment Summary by Doctor</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(summary.doctorPayments).map(([doctorName, amount]) => (
                            <div key={doctorName} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-600 mb-1">{doctorName}</p>
                                <p className="text-2xl font-bold text-green-600">฿{parseFloat(amount).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Billing Breakdown Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Billing Breakdown</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        {billingData.length} procedures found
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Patient Case #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Procedure</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Cost</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Performing Doctor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Compensation Rule</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Doctor's Share</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Clinic's Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        Generating report...
                                    </td>
                                </tr>
                            ) : billingData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        No data found. Please select filters and click "Generate Report"
                                    </td>
                                </tr>
                            ) : (
                                billingData.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(item.date).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {item.patient_case}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-800">
                                            {item.procedure_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">
                                            ฿{parseFloat(item.total_cost).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.doctor_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-blue-600">
                                            {item.rule_applied}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            ฿{parseFloat(item.doctor_share).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">
                                            ฿{parseFloat(item.clinic_share).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compensation Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-800">Manage Compensation Rules</h2>
                                <button
                                    onClick={() => setShowRulesModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Default Rate */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Default Rate</h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    This rate applies to any procedure not covered by specific rules below.
                                </p>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        value={compensationRules.defaultRate}
                                        onChange={(e) => setCompensationRules(prev => ({
                                            ...prev,
                                            defaultRate: parseFloat(e.target.value)
                                        }))}
                                        min="0"
                                        max="100"
                                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-lg font-semibold text-slate-700">%</span>
                                </div>
                            </div>

                            {/* Procedure-Specific Rules */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Procedure-Specific Rules</h3>
                                    <button
                                        onClick={addNewRule}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                                    >
                                        <Plus size={20} />
                                        <span>Add New Rule</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border border-slate-200 rounded-lg">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Procedure/Service</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Rule Type</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Value</th>
                                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {compensationRules.procedureRules.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                        No specific rules defined. Click "Add New Rule" to create one.
                                                    </td>
                                                </tr>
                                            ) : (
                                                compensationRules.procedureRules.map((rule, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={rule.treatment_id}
                                                                onChange={(e) => updateRule(index, 'treatment_id', e.target.value)}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="">Select Procedure...</option>
                                                                {treatments.map(t => (
                                                                    <option key={t.treatment_id} value={t.treatment_id}>
                                                                        {t.code} - {t.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={rule.rule_type}
                                                                onChange={(e) => updateRule(index, 'rule_type', e.target.value)}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="percentage">Percentage (%)</option>
                                                                <option value="fixed">Fixed Amount (THB)</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="number"
                                                                    value={rule.value}
                                                                    onChange={(e) => updateRule(index, 'value', parseFloat(e.target.value))}
                                                                    min="0"
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-slate-600">
                                                                    {rule.rule_type === 'percentage' ? '%' : 'THB'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => removeRule(index)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRulesModal(false)}
                                    className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCompensationRules}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <Save size={20} />
                                    <span>Save Rules</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
