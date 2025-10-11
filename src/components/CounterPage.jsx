import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';
import { Search, RefreshCw, User, Printer, X } from 'lucide-react';
import clinicLogo from '../assets/clinic-logo.png';

const CounterPage = ({ selectedClinic }) => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    // Check role authorization
    useEffect(() => {
        if (user && !['nurse', 'admin'].includes(user.role)) {
            alert('Access denied. This page is for nurses and admins only.');
            window.history.back();
        }
    }, [user]);

    // Fetch patients ready for checkout
    const fetchReadyPatients = useCallback(async () => {
        if (!selectedClinic) return;

        setIsLoading(true);
        try {
            const res = await authorizedFetch(`/api/visits?clinic_id=${selectedClinic}&status=draft_checkout`);
            if (!res.ok) throw new Error('Failed to fetch patients');
            const data = await res.json();
            setPatients(data);
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedClinic]);

    useEffect(() => {
        if (selectedClinic) {
            fetchReadyPatients();
        }
    }, [selectedClinic, fetchReadyPatients]);

    // Auto-refresh based on configured interval
    useEffect(() => {
        if (autoRefresh && selectedClinic) {
            const refreshInterval = parseInt(import.meta.env.VITE_AUTO_REFRESH_INTERVAL) || 30000;
            const interval = setInterval(fetchReadyPatients, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, selectedClinic, fetchReadyPatients]);

    // Fetch bill details when patient is selected
    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);

        try {
            // Fetch visit treatments
            const res = await authorizedFetch(`/api/visits/${patient.visit_id}/treatments`);
            if (!res.ok) throw new Error('Failed to fetch bill details');
            const treatments = await res.json();

            // Calculate totals
            const subtotal = treatments.reduce((sum, item) => sum + parseFloat(item.actual_price || 0), 0);
            const discount = 0; // You can add discount logic here
            const grandTotal = subtotal - discount;

            setBillDetails({
                patient,
                treatments,
                subtotal,
                discount,
                grandTotal
            });

            // Set default amount received to grand total
            setAmountReceived(grandTotal.toFixed(2));
        } catch (err) {
            console.error('Error fetching bill details:', err);
            alert('Failed to load bill details');
        }
    };

    // Calculate change
    const changeDue = paymentMethod === 'cash' && amountReceived
        ? Math.max(0, parseFloat(amountReceived) - (billDetails?.grandTotal || 0))
        : 0;

    // Process payment
    const handleConfirmPayment = async () => {
        if (!selectedPatient || !billDetails) {
            alert('No patient selected');
            return;
        }

        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < billDetails.grandTotal)) {
            alert('Amount received is less than the total amount');
            return;
        }

        if (['card', 'qr', 'transfer'].includes(paymentMethod) && !transactionRef) {
            alert('Please enter transaction reference number');
            return;
        }

        try {
            // Update visit status to completed
            const res = await authorizedFetch(`/api/visits/${selectedPatient.visit_id}/checkout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed',
                    payment_method: paymentMethod,
                    amount_paid: paymentMethod === 'cash' ? parseFloat(amountReceived) : billDetails.grandTotal,
                    transaction_ref: transactionRef || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to process payment');
            }

            alert('✅ Payment processed successfully!');

            // Update patient status in list
            setPatients(prev => prev.map(p =>
                p.visit_id === selectedPatient.visit_id
                    ? { ...p, payment_status: 'paid' }
                    : p
            ));

            // Clear selection after short delay
            setTimeout(() => {
                setSelectedPatient(null);
                setBillDetails(null);
                setAmountReceived('');
                setTransactionRef('');
                setPaymentMethod('cash');
                fetchReadyPatients();
            }, 1500);

        } catch (err) {
            console.error('Error processing payment:', err);
            alert(err.message);
        }
    };

    // Print receipt
    const handlePrintReceipt = () => {
        if (!billDetails) return;

        const printWindow = window.open('', '_blank');
        const receiptHTML = generateReceiptHTML(billDetails, paymentMethod, amountReceived, changeDue, user);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
    };

    // Filter patients by search term
    const filteredPatients = patients.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        return (
            p.dn?.toLowerCase().includes(searchLower) ||
            p.first_name_th?.toLowerCase().includes(searchLower) ||
            p.last_name_th?.toLowerCase().includes(searchLower) ||
            p.first_name_en?.toLowerCase().includes(searchLower) ||
            p.last_name_en?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="flex h-screen bg-slate-50">
            {/* LEFT SIDEBAR - Patient Queue Panel (25-30%) */}
            <div className="w-[30%] bg-white border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-slate-800">Ready for Checkout</h2>
                        <button
                            onClick={fetchReadyPatients}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="p-8 text-center text-slate-500">Loading patients...</div>
                    )}

                    {!isLoading && filteredPatients.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            {searchTerm ? 'No patients found' : 'No patients ready for checkout'}
                        </div>
                    )}

                    {!isLoading && filteredPatients.map((patient) => {
                        const isActive = selectedPatient?.visit_id === patient.visit_id;
                        const isPaid = patient.payment_status === 'paid';
                        const statusColor = isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                        const statusText = isPaid ? 'Paid' : 'Waiting';

                        return (
                            <div
                                key={patient.visit_id}
                                onClick={() => !isPaid && handleSelectPatient(patient)}
                                className={`p-4 m-2 rounded-lg cursor-pointer transition-all ${
                                    isActive
                                        ? 'bg-sky-50 border-2 border-sky-400 shadow-md'
                                        : isPaid
                                        ? 'bg-slate-50 opacity-60'
                                        : 'bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-slate-800">
                                            {patient.first_name_th} {patient.last_name_th}
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            DN: {patient.dn} • {patient.doctor_name || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Check-in: {new Date(patient.check_in_time).toLocaleTimeString('th-TH')}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT SIDE - Main Payment Panel (70-75%) */}
            <div className="flex-1 flex flex-col">
                {!billDetails ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <User size={64} className="mx-auto mb-4" />
                            <p className="text-lg">Select a patient to process payment</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* A. Patient Identification Header */}
                        <div className="bg-white border-b border-slate-200 p-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                                    <User size={32} className="text-sky-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">
                                        {billDetails.patient.first_name_th} {billDetails.patient.last_name_th}
                                    </h1>
                                    <p className="text-slate-600">
                                        DN: {billDetails.patient.dn} • DOB: {billDetails.patient.date_of_birth ? new Date(billDetails.patient.date_of_birth).toLocaleDateString('th-TH') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* B. Itemized Bill Section */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Itemized Bill</h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200">
                                                <th className="text-left py-3 px-2 text-slate-600 font-semibold">Item/Service</th>
                                                <th className="text-center py-3 px-2 text-slate-600 font-semibold">Qty</th>
                                                <th className="text-right py-3 px-2 text-slate-600 font-semibold">Unit Price</th>
                                                <th className="text-right py-3 px-2 text-slate-600 font-semibold">Total Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billDetails.treatments.map((item, index) => (
                                                <tr key={index} className="border-b border-slate-100">
                                                    <td className="py-3 px-2">
                                                        <div className="font-medium text-slate-800">{item.name}</div>
                                                        <div className="text-sm text-slate-500">
                                                            Code: {item.code}
                                                            {item.tooth_numbers && ` • Tooth: ${item.tooth_numbers}`}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">1</td>
                                                    <td className="py-3 px-2 text-right">฿{parseFloat(item.actual_price || 0).toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-right font-semibold">฿{parseFloat(item.actual_price || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary Box */}
                                <div className="mt-6 pt-6 border-t-2 border-slate-200 space-y-2">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal:</span>
                                        <span>฿{billDetails.subtotal.toFixed(2)}</span>
                                    </div>
                                    {billDetails.discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount:</span>
                                            <span>-฿{billDetails.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-2xl font-bold text-sky-600 pt-2">
                                        <span>Grand Total:</span>
                                        <span>฿{billDetails.grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* C. Payment Processing Section */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Select Payment Method</h2>

                                {/* Payment Method Buttons */}
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {[
                                        { value: 'cash', label: 'Cash (เงินสด)', icon: '💵' },
                                        { value: 'card', label: 'Card (บัตร)', icon: '💳' },
                                        { value: 'qr', label: 'QR Payment', icon: '📱' },
                                        { value: 'transfer', label: 'Bank Transfer', icon: '🏦' }
                                    ].map(method => (
                                        <button
                                            key={method.value}
                                            onClick={() => {
                                                setPaymentMethod(method.value);
                                                if (method.value === 'cash') {
                                                    setAmountReceived(billDetails.grandTotal.toFixed(2));
                                                } else {
                                                    setAmountReceived(billDetails.grandTotal.toFixed(2));
                                                }
                                            }}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                paymentMethod === method.value
                                                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg'
                                                    : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
                                            }`}
                                        >
                                            <div className="text-2xl mb-1">{method.icon}</div>
                                            <div className="text-sm font-semibold">{method.label}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic Payment Input Area */}
                                <div className="space-y-4">
                                    {paymentMethod === 'cash' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Amount Received (฿)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={amountReceived}
                                                    onChange={(e) => setAmountReceived(e.target.value)}
                                                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-green-700">Change Due:</span>
                                                    <span className="text-2xl font-bold text-green-700">
                                                        ฿{changeDue.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {['card', 'qr', 'transfer'].includes(paymentMethod) && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Transaction Reference No.
                                            </label>
                                            <input
                                                type="text"
                                                value={transactionRef}
                                                onChange={(e) => setTransactionRef(e.target.value)}
                                                placeholder="Enter transaction reference number"
                                                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* D. Action Bar (Footer) */}
                        <div className="bg-white border-t border-slate-200 p-6">
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={handlePrintReceipt}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors flex items-center space-x-2"
                                >
                                    <Printer size={20} />
                                    <span>Print Receipt</span>
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={
                                        (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < billDetails.grandTotal)) ||
                                        (['card', 'qr', 'transfer'].includes(paymentMethod) && !transactionRef)
                                    }
                                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    <span>✓ Confirm Payment</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Receipt HTML Generator
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
        body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
        }
        .logo {
            width: 50px;
            height: 50px;
            margin-right: 10px;
        }
        .clinic-info {
            flex: 1;
        }
        .clinic-name {
            font-size: 16px;
            font-weight: bold;
        }
        .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        .double-separator {
            border-top: 2px solid #000;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 5px 0;
        }
        td {
            padding: 3px 0;
        }
        .right {
            text-align: right;
        }
        .center {
            text-align: center;
        }
        .bold {
            font-weight: bold;
        }
        .total-section {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
        }
        .grand-total {
            font-size: 16px;
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            border-top: 2px dashed #000;
            padding-top: 10px;
        }
        @media print {
            body { margin: 0; padding: 5px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${clinicLogo}" class="logo" alt="Logo">
        <div class="clinic-info">
            <div class="clinic-name">Newtrend Dental Clinic</div>
            <div>123 Main Street, Bangkok 10110</div>
            <div>Tel: 02-xxx-xxxx</div>
            <div>Tax ID: 0-0000-00000-00-0</div>
        </div>
    </div>

    <div class="separator"></div>

    <div>
        <table>
            <tr>
                <td><strong>Receipt No:</strong></td>
                <td class="right">${receiptNo}</td>
            </tr>
            <tr>
                <td><strong>Date:</strong></td>
                <td class="right">${now.toLocaleDateString('th-TH')}</td>
            </tr>
            <tr>
                <td><strong>Time:</strong></td>
                <td class="right">${now.toLocaleTimeString('th-TH')}</td>
            </tr>
            <tr>
                <td><strong>Patient:</strong></td>
                <td class="right">${billDetails.patient.first_name_th} ${billDetails.patient.last_name_th}</td>
            </tr>
            <tr>
                <td><strong>Patient ID:</strong></td>
                <td class="right">${billDetails.patient.dn}</td>
            </tr>
        </table>
    </div>

    <div class="separator"></div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="center">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${billDetails.treatments.map(item => `
                <tr>
                    <td>${item.name}<br><small>${item.code}${item.tooth_numbers ? ' • ' + item.tooth_numbers : ''}</small></td>
                    <td class="center">1</td>
                    <td class="right">${parseFloat(item.actual_price || 0).toFixed(2)}</td>
                    <td class="right">${parseFloat(item.actual_price || 0).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total-section">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td class="right">${billDetails.subtotal.toFixed(2)} THB</td>
            </tr>
            ${billDetails.discount > 0 ? `
            <tr>
                <td>Discount:</td>
                <td class="right">${billDetails.discount.toFixed(2)} THB</td>
            </tr>
            ` : ''}
            <tr class="grand-total">
                <td><strong>Grand Total:</strong></td>
                <td class="right"><strong>${billDetails.grandTotal.toFixed(2)} THB</strong></td>
            </tr>
        </table>
    </div>

    <div class="separator"></div>

    <table>
        <tr>
            <td><strong>Payment Method:</strong></td>
            <td class="right">${paymentMethodLabels[paymentMethod] || paymentMethod}</td>
        </tr>
        ${paymentMethod === 'cash' ? `
        <tr>
            <td><strong>Amount Paid:</strong></td>
            <td class="right">${parseFloat(amountPaid).toFixed(2)} THB</td>
        </tr>
        <tr>
            <td><strong>Change Due:</strong></td>
            <td class="right">${changeDue.toFixed(2)} THB</td>
        </tr>
        ` : `
        <tr>
            <td><strong>Amount Paid:</strong></td>
            <td class="right">${billDetails.grandTotal.toFixed(2)} THB</td>
        </tr>
        `}
    </table>

    <div class="footer">
        <div><strong>Received by:</strong> ${employee?.full_name || employee?.username || 'Staff'}</div>
        <div style="margin-top: 15px; text-align: center;">
            <div>Thank you for visiting!</div>
            <div>Please get well soon.</div>
        </div>
        <div style="margin-top: 10px; text-align: center; font-size: 10px;">
            <div>Opening Hours: Mon-Sat 9:00-18:00</div>
            <div>www.newtrenddental.com</div>
        </div>
    </div>
</body>
</html>
    `;
};

export default CounterPage;
