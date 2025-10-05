import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';
import {
    Calendar, Search, Filter, Download, Users, DollarSign, Clock,
    Activity, Eye, Printer, RefreshCw, MoreVertical, AlertCircle,
    CheckCircle, XCircle, FileText
} from 'lucide-react';

const OperationsDashboard = ({ selectedClinic }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Date and filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Data
    const [kpiData, setKpiData] = useState({
        totalPatients: 0,
        totalRevenue: 0,
        averageWaitTime: 0,
        statusCounts: {}
    });
    const [patients, setPatients] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'check_in_time', direction: 'desc' });
    const [selectedAction, setSelectedAction] = useState(null);

    // Fetch KPI data
    const fetchKPIData = useCallback(async () => {
        if (!selectedClinic) return;

        try {
            const res = await authorizedFetch(
                `/api/operations/kpi?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}`
            );
            if (res.ok) {
                const data = await res.json();
                setKpiData(data);
            }
        } catch (err) {
            console.error('Error fetching KPI data:', err);
        }
    }, [selectedClinic, startDate, endDate]);

    // Fetch patient log
    const fetchPatientLog = useCallback(async () => {
        if (!selectedClinic) return;

        setIsLoading(true);
        try {
            const res = await authorizedFetch(
                `/api/operations/patient-log?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}`
            );
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (err) {
            console.error('Error fetching patient log:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedClinic, startDate, endDate]);

    useEffect(() => {
        if (selectedClinic) {
            fetchKPIData();
            fetchPatientLog();
        }
    }, [selectedClinic, startDate, endDate, fetchKPIData, fetchPatientLog]);

    // Sort patients
    const sortedPatients = React.useMemo(() => {
        let sorted = [...patients];

        if (sortConfig.key) {
            sorted.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'check_in_time' || sortConfig.key === 'check_out_time') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sorted;
    }, [patients, sortConfig]);

    // Filter patients
    const filteredPatients = sortedPatients.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesSearch = !searchTerm ||
            p.dn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.first_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.last_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.mobile_phone?.includes(searchTerm);

        return matchesStatus && matchesSearch;
    });

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Status badge
    const getStatusBadge = (status) => {
        const configs = {
            'waiting': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Waiting', icon: Clock },
            'in_progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Consultation', icon: Activity },
            'draft_checkout': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Waiting for Payment', icon: AlertCircle },
            'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed', icon: CheckCircle },
            'cancelled': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled', icon: XCircle }
        };

        const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: Activity };
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <Icon size={12} className="mr-1" />
                {config.label}
            </span>
        );
    };

    // Calculate duration in status
    const calculateDuration = (statusChangedAt) => {
        if (!statusChangedAt) return '-';
        const now = new Date();
        const changed = new Date(statusChangedAt);
        const diffMs = now - changed;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    // Reprint receipt
    const handleReprintReceipt = async (patient) => {
        try {
            // Fetch visit treatments
            const res = await authorizedFetch(`/api/visits/${patient.visit_id}/treatments`);
            if (!res.ok) throw new Error('Failed to fetch bill details');
            const treatments = await res.json();

            const subtotal = treatments.reduce((sum, item) => sum + parseFloat(item.actual_price || 0), 0);
            const billDetails = {
                patient,
                treatments,
                subtotal,
                discount: 0,
                grandTotal: subtotal
            };

            // Generate receipt
            const printWindow = window.open('', '_blank');
            const receiptHTML = generateReceiptHTML(billDetails, patient.payment_method || 'cash', patient.amount_paid || subtotal, 0, user);
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            printWindow.print();
        } catch (err) {
            console.error('Error reprinting receipt:', err);
            alert('Failed to reprint receipt');
        }
    };

    // Export data
    const handleExport = async (format, reportType) => {
        try {
            const res = await authorizedFetch(
                `/api/operations/export?clinic_id=${selectedClinic}&start_date=${startDate}&end_date=${endDate}&format=${format}&type=${reportType}`
            );

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportType}_${startDate}_${endDate}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Error exporting data:', err);
            alert('Failed to export data');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Main Header & KPI Dashboard */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-slate-800">Clinic Operations Dashboard</h1>
                    <button
                        onClick={() => setSelectedAction('export')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <Download size={20} />
                        <span>Export Reports</span>
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Patients</p>
                                <p className="text-3xl font-bold text-slate-800">{kpiData.totalPatients}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users size={32} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-600">฿{kpiData.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign size={32} className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Avg Wait Time</p>
                                <p className="text-3xl font-bold text-orange-600">{kpiData.averageWaitTime} min</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock size={32} className="text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Active Patients</p>
                                <div className="space-y-1 mt-2">
                                    <p className="text-sm"><span className="font-semibold text-yellow-600">{kpiData.statusCounts?.waiting || 0}</span> Waiting</p>
                                    <p className="text-sm"><span className="font-semibold text-orange-600">{kpiData.statusCounts?.draft_checkout || 0}</span> For Payment</p>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Activity size={32} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="waiting">Waiting</option>
                            <option value="in_progress">In Consultation</option>
                            <option value="draft_checkout">Waiting for Payment</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Name, ID, Phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold">{filteredPatients.length}</span> of <span className="font-semibold">{patients.length}</span> patients
                    </p>
                    <button
                        onClick={() => { fetchKPIData(); fetchPatientLog(); }}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Main Patient Log Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th
                                    onClick={() => handleSort('dn')}
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200"
                                >
                                    Patient Info {sortConfig.key === 'dn' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('check_in_time')}
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200"
                                >
                                    Check-in Time {sortConfig.key === 'check_in_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Doctor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th
                                    onClick={() => handleSort('total_amount')}
                                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200"
                                >
                                    Total Bill {sortConfig.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        Loading patient data...
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        No patients found
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.visit_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800">
                                                {patient.first_name_th} {patient.last_name_th}
                                            </div>
                                            <div className="text-sm text-slate-500">DN: {patient.dn}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(patient.check_in_time).toLocaleString('th-TH', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: 'short'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {patient.doctor_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(patient.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {calculateDuration(patient.status_changed_at || patient.check_in_time)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                            ฿{parseFloat(patient.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {patient.payment_status === 'paid' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                    <CheckCircle size={12} className="mr-1" />
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    <XCircle size={12} className="mr-1" />
                                                    Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedAction({ type: 'view', patient })}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {patient.payment_status === 'paid' && (
                                                    <button
                                                        onClick={() => handleReprintReceipt(patient)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Reprint Receipt"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedAction({ type: 'update', patient })}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Update Status"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Modal */}
            {selectedAction?.type === 'export' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Export Reports</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Select Report Type:</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleExport('pdf', 'daily-income')}
                                        className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="font-semibold">Daily Income Summary</div>
                                        <div className="text-sm text-slate-500">Revenue, payment methods, transactions</div>
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv', 'patient-log')}
                                        className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="font-semibold">Patient Visit Log</div>
                                        <div className="text-sm text-slate-500">Complete patient visit records</div>
                                    </button>
                                    <button
                                        onClick={() => handleExport('xlsx', 'service-report')}
                                        className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="font-semibold">Service/Procedure Report</div>
                                        <div className="text-sm text-slate-500">Treatment frequency and summary</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedAction(null)}
                                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedAction?.type === 'view' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Patient Visit Details</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-600">Patient Name</p>
                                    <p className="font-semibold">{selectedAction.patient.first_name_th} {selectedAction.patient.last_name_th}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Patient ID</p>
                                    <p className="font-semibold">{selectedAction.patient.dn}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Check-in Time</p>
                                    <p className="font-semibold">{new Date(selectedAction.patient.check_in_time).toLocaleString('th-TH')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Doctor</p>
                                    <p className="font-semibold">{selectedAction.patient.doctor_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Status</p>
                                    <div>{getStatusBadge(selectedAction.patient.status)}</div>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Payment Status</p>
                                    <p className="font-semibold">{selectedAction.patient.payment_status === 'paid' ? '✓ Paid' : '✗ Unpaid'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedAction(null)}
                                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {selectedAction?.type === 'update' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Update Patient Status</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Current Status: {getStatusBadge(selectedAction.patient.status)}</p>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">New Status</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="waiting">Waiting</option>
                                    <option value="in_progress">In Consultation</option>
                                    <option value="draft_checkout">Waiting for Payment</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedAction(null)}
                                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Update status logic here
                                    alert('Status update functionality will be implemented');
                                    setSelectedAction(null);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Receipt HTML Generator (reused from Counter page)
const generateReceiptHTML = (billDetails, paymentMethod, amountPaid, changeDue, employee) => {
    const now = new Date();
    const receiptNo = `R${now.getTime()}`;

    const paymentMethodLabels = {
        'cash': 'Cash (เงินสด)',
        'card': 'Credit/Debit Card (บัตร)',
        'qr': 'QR Payment (พร้อมเพย์)',
        'transfer': 'Bank Transfer (โอนเงิน)'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${billDetails.patient.dn}</title>
    <style>
        body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
        .header { display: flex; align-items: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
        .clinic-name { font-size: 16px; font-weight: bold; }
        .separator { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
        td { padding: 3px 0; }
        .right { text-align: right; }
        .grand-total { font-size: 16px; font-weight: bold; }
        .footer { margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="clinic-name">Newtrend Dental Clinic</div>
            <div>123 Main Street, Bangkok 10110</div>
            <div>Tel: 02-xxx-xxxx</div>
        </div>
    </div>
    <div class="separator"></div>
    <div>
        <table>
            <tr><td><strong>Receipt No:</strong></td><td class="right">${receiptNo}</td></tr>
            <tr><td><strong>Date:</strong></td><td class="right">${now.toLocaleDateString('th-TH')}</td></tr>
            <tr><td><strong>Patient:</strong></td><td class="right">${billDetails.patient.first_name_th} ${billDetails.patient.last_name_th}</td></tr>
        </table>
    </div>
    <div class="separator"></div>
    <table>
        <thead><tr><th>Item</th><th class="right">Total</th></tr></thead>
        <tbody>
            ${billDetails.treatments.map(item => `
                <tr><td>${item.name}</td><td class="right">${parseFloat(item.actual_price || 0).toFixed(2)}</td></tr>
            `).join('')}
        </tbody>
    </table>
    <div class="separator"></div>
    <table>
        <tr class="grand-total"><td><strong>Grand Total:</strong></td><td class="right"><strong>${billDetails.grandTotal.toFixed(2)} THB</strong></td></tr>
        <tr><td><strong>Payment Method:</strong></td><td class="right">${paymentMethodLabels[paymentMethod] || paymentMethod}</td></tr>
    </table>
    <div class="footer">
        <div><strong>Received by:</strong> ${employee?.full_name || employee?.username || 'Staff'}</div>
        <div style="text-align: center; margin-top: 10px;">Thank you for visiting!</div>
    </div>
</body>
</html>
    `;
};

export default OperationsDashboard;
