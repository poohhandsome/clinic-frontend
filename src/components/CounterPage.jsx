import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const CounterPage = ({ selectedClinic }) => {
    const { authorizedFetch, user } = useAuth();
    const [pendingBills, setPendingBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        payment_method: 'cash',
        paid_amount: ''
    });

    // Check role authorization
    useEffect(() => {
        if (user && !['nurse', 'admin'].includes(user.role)) {
            alert('Access denied. This page is for nurses and admins only.');
            window.history.back();
        }
    }, [user]);

    // Fetch pending bills
    const fetchPendingBills = useCallback(async () => {
        if (!selectedClinic) return;

        setIsLoading(true);
        try {
            const res = await authorizedFetch(`/api/billing/pending?clinic_id=${selectedClinic}`);
            if (!res.ok) throw new Error('Failed to fetch pending bills');
            const data = await res.json();
            setPendingBills(data);
        } catch (err) {
            console.error('Error fetching pending bills:', err);
            alert('Failed to load pending bills');
        } finally {
            setIsLoading(false);
        }
    }, [selectedClinic, authorizedFetch]);

    useEffect(() => {
        if (selectedClinic) {
            fetchPendingBills();
        }
    }, [selectedClinic, fetchPendingBills]);

    // Fetch bill details
    const fetchBillDetails = async (billingId) => {
        try {
            const res = await authorizedFetch(`/api/billing/${billingId}`);
            if (!res.ok) throw new Error('Failed to fetch bill details');
            const data = await res.json();
            setBillDetails(data);
            setPaymentForm({
                payment_method: 'cash',
                paid_amount: data.total_amount
            });
        } catch (err) {
            console.error('Error fetching bill details:', err);
            alert('Failed to load bill details');
        }
    };

    // Handle bill selection
    const handleSelectBill = (bill) => {
        setSelectedBill(bill);
        fetchBillDetails(bill.billing_id);
    };

    // Handle payment processing
    const handleProcessPayment = async (e) => {
        e.preventDefault();

        if (!selectedBill || !billDetails) {
            alert('No bill selected');
            return;
        }

        const paidAmount = parseFloat(paymentForm.paid_amount);
        const totalAmount = parseFloat(billDetails.total_amount);

        if (isNaN(paidAmount) || paidAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (Math.abs(paidAmount - totalAmount) > 0.01) {
            if (!confirm(`Amount mismatch! Expected: ฿${totalAmount.toFixed(2)}, Received: ฿${paidAmount.toFixed(2)}. Continue?`)) {
                return;
            }
        }

        try {
            const res = await authorizedFetch(`/api/billing/${selectedBill.billing_id}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentForm)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to process payment');
            }

            alert('Payment processed successfully!');
            setSelectedBill(null);
            setBillDetails(null);
            fetchPendingBills();
        } catch (err) {
            console.error('Error processing payment:', err);
            alert(err.message);
        }
    };

    // Print receipt
    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '20px' }}>Payment Counter</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left: Pending Bills List */}
                <div>
                    <h2 style={{ marginBottom: '15px' }}>Pending Bills</h2>

                    {isLoading && <p>Loading bills...</p>}

                    {!isLoading && !selectedClinic && (
                        <p style={{ color: '#999' }}>Please select a clinic to view pending bills</p>
                    )}

                    {!isLoading && selectedClinic && pendingBills.length === 0 && (
                        <p style={{ color: '#999' }}>No pending bills</p>
                    )}

                    {!isLoading && pendingBills.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                backgroundColor: 'white',
                                borderCollapse: 'collapse',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>DN</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Patient Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Visit Date</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingBills.map((bill) => (
                                        <tr
                                            key={bill.billing_id}
                                            style={{
                                                borderBottom: '1px solid #e5e7eb',
                                                backgroundColor: selectedBill?.billing_id === bill.billing_id ? '#e0f2fe' : 'white',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleSelectBill(bill)}
                                        >
                                            <td style={{ padding: '12px' }}>{bill.dn}</td>
                                            <td style={{ padding: '12px' }}>
                                                {bill.first_name_th} {bill.last_name_th}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {new Date(bill.visit_date).toLocaleDateString('th-TH')}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                                ฿{parseFloat(bill.total_amount).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectBill(bill);
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#3B82F6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Bill Details & Payment */}
                <div>
                    {!billDetails ? (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '40px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            color: '#999'
                        }}>
                            <p>Select a bill to view details and process payment</p>
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                                Bill Details
                            </h2>

                            {/* Patient Info */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '10px' }}>Patient Information</h3>
                                <p><strong>DN:</strong> {billDetails.dn}</p>
                                <p><strong>Name:</strong> {billDetails.first_name_th} {billDetails.last_name_th}</p>
                                <p><strong>Phone:</strong> {billDetails.mobile_phone || 'N/A'}</p>
                            </div>

                            {/* Visit Info */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '10px' }}>Visit Information</h3>
                                <p><strong>Date:</strong> {new Date(billDetails.visit_date).toLocaleDateString('th-TH')}</p>
                                <p><strong>Doctor:</strong> {billDetails.doctor_name || 'N/A'}</p>
                                <p><strong>Check-in:</strong> {new Date(billDetails.check_in_time).toLocaleTimeString('th-TH')}</p>
                                {billDetails.checkout_time && (
                                    <p><strong>Checkout:</strong> {new Date(billDetails.checkout_time).toLocaleTimeString('th-TH')}</p>
                                )}
                            </div>

                            {/* Itemized Treatments */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '10px' }}>Itemized Treatments</h3>
                                {billDetails.items && billDetails.items.length > 0 ? (
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '14px'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Code</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                                <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billDetails.items.map((item, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '8px' }}>{item.code}</td>
                                                    <td style={{ padding: '8px' }}>{item.name}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                                        ฿{parseFloat(item.price).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                                        ฿{parseFloat(item.total_price).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#999' }}>No treatments recorded</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div style={{
                                borderTop: '2px solid #e5e7eb',
                                paddingTop: '15px',
                                marginBottom: '20px'
                            }}>
                                {billDetails.discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Subtotal:</span>
                                        <span>฿{(parseFloat(billDetails.total_amount) + parseFloat(billDetails.discount)).toFixed(2)}</span>
                                    </div>
                                )}
                                {billDetails.discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#DC2626' }}>
                                        <span>Discount:</span>
                                        <span>-฿{parseFloat(billDetails.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#3B82F6'
                                }}>
                                    <span>Total Amount:</span>
                                    <span>฿{parseFloat(billDetails.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <form onSubmit={handleProcessPayment} style={{
                                borderTop: '2px solid #e5e7eb',
                                paddingTop: '20px'
                            }}>
                                <h3 style={{ marginBottom: '15px' }}>Process Payment</h3>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Payment Method *
                                    </label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value="cash">Cash (เงินสด)</option>
                                        <option value="card">Credit/Debit Card (บัตร)</option>
                                        <option value="transfer">Bank Transfer (โอน)</option>
                                        <option value="promptpay">PromptPay</option>
                                        <option value="other">Other (อื่นๆ)</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Amount Received (฿) *
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentForm.paid_amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                {/* Change calculation */}
                                {paymentForm.paid_amount && parseFloat(paymentForm.paid_amount) > parseFloat(billDetails.total_amount) && (
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#ecfdf5',
                                        borderRadius: '4px',
                                        marginBottom: '20px'
                                    }}>
                                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981' }}>
                                            Change: ฿{(parseFloat(paymentForm.paid_amount) - parseFloat(billDetails.total_amount)).toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            flex: 1,
                                            padding: '15px',
                                            backgroundColor: '#10B981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        Process Payment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePrintReceipt}
                                        style={{
                                            padding: '15px 20px',
                                            backgroundColor: '#6B7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Print
                                    </button>
                                </div>
                            </form>

                            {billDetails.notes && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '10px',
                                    backgroundColor: '#fef3c7',
                                    borderRadius: '4px'
                                }}>
                                    <strong>Notes:</strong> {billDetails.notes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Today's Summary Card */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Today's Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#666', marginBottom: '5px' }}>Pending Bills</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>
                            {pendingBills.length}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#666', marginBottom: '5px' }}>Total Pending Amount</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444' }}>
                            ฿{pendingBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0).toFixed(2)}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#666', marginBottom: '5px' }}>Status</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>
                            Active
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CounterPage;
