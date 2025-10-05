import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import authorizedFetch from '../api';

// Smart Price Input Component
const SmartPriceInput = ({ treatment, onPriceChange, onPriceSave }) => {
    const [price, setPrice] = useState(treatment.actual_price || treatment.standard_price || 0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [commonPrices, setCommonPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (showDropdown && treatment.treatment_id) {
            fetchCommonPrices();
        }
    }, [showDropdown, treatment.treatment_id]);

    const fetchCommonPrices = async () => {
        setIsLoading(true);
        try {
            const res = await authorizedFetch(`/api/doctor-prices/${treatment.treatment_id}`);
            if (res.ok) {
                const data = await res.json();
                setCommonPrices(data);
            }
        } catch (err) {
            console.error('Error fetching common prices:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceSelect = async (selectedPrice) => {
        setPrice(selectedPrice);
        setShowDropdown(false);
        onPriceChange(selectedPrice);
        await onPriceSave(selectedPrice);
    };

    const standardPrice = treatment.standard_price || 0;

    return (
        <div className="relative">
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => {
                    setShowDropdown(false);
                    onPriceChange(price);
                    onPriceSave(price);
                }, 200)}
                className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                placeholder="Price"
            />
            {showDropdown && (
                <div className="absolute z-50 mt-1 w-48 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div
                        onMouseDown={() => handlePriceSelect(standardPrice)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-200"
                    >
                        <div className="text-sm font-semibold">฿{parseFloat(standardPrice).toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Standard Price</div>
                    </div>
                    {isLoading ? (
                        <div className="px-3 py-2 text-xs text-slate-500">Loading...</div>
                    ) : commonPrices.length > 0 ? (
                        commonPrices.map((cp, idx) => (
                            <div
                                key={idx}
                                onMouseDown={() => handlePriceSelect(cp.custom_price)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-200 last:border-0"
                            >
                                <div className="text-sm font-semibold">฿{parseFloat(cp.custom_price).toFixed(2)}</div>
                                <div className="text-xs text-slate-500">
                                    Used {cp.frequency_count}x (Your Common)
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-slate-500 italic">No custom prices yet</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Treatment Processing Tab Component
const TreatmentProcessingTab = ({ visitId, patientId, visitTreatments, onRefresh }) => {
    const [showRecordModal, setShowRecordModal] = useState(null);
    const [treatmentRecord, setTreatmentRecord] = useState('');

    const availableTreatments = visitTreatments || [];

    // Start treatment (move to in_progress)
    const handleStartTreatment = async (treatment) => {
        try {
            const res = await authorizedFetch(`/api/visit-treatments/${treatment.visit_treatment_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress' })
            });

            if (!res.ok) throw new Error('Failed to start treatment');
            onRefresh();
        } catch (error) {
            alert('Error starting treatment: ' + error.message);
        }
    };

    // Continue treatment later (move back to pending, keep in lower section)
    const handleContinueLater = async (treatment) => {
        try {
            const res = await authorizedFetch(`/api/visit-treatments/${treatment.visit_treatment_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending' })
            });

            if (!res.ok) throw new Error('Failed to update status');
            onRefresh();
        } catch (error) {
            alert('Error updating treatment: ' + error.message);
        }
    };

    // Cancel/Remove from upper section (X button)
    const handleCancelTreatment = async (treatment) => {
        try {
            const res = await authorizedFetch(`/api/visit-treatments/${treatment.visit_treatment_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: null })
            });

            if (!res.ok) throw new Error('Failed to cancel treatment');
            onRefresh();
        } catch (error) {
            alert('Error canceling treatment: ' + error.message);
        }
    };

    // Save treatment record
    const handleSaveTreatmentRecord = async (treatmentId) => {
        if (!treatmentRecord.trim()) {
            alert('Please write treatment details before saving');
            return;
        }

        try {
            const res = await authorizedFetch(`/api/visit-treatments/${treatmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treatment_record: treatmentRecord,
                    recorded_at: new Date()
                })
            });

            if (!res.ok) throw new Error('Failed to save record');

            alert('Treatment record saved successfully');
            setShowRecordModal(null);
            setTreatmentRecord('');
            onRefresh();
        } catch (error) {
            alert('Error saving record: ' + error.message);
        }
    };

    // Handle price change and track it
    const handlePriceChange = async (treatment, newPrice) => {
        try {
            // Update the treatment price
            await authorizedFetch(`/api/visit-treatments/${treatment.visit_treatment_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_price: newPrice })
            });

            // Track the price usage
            await authorizedFetch('/api/doctor-prices/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treatment_id: treatment.treatment_id,
                    custom_price: newPrice,
                    standard_price: treatment.standard_price
                })
            });

            onRefresh();
        } catch (error) {
            console.error('Error updating price:', error);
        }
    };

    // Filter treatments
    const inProgressTreatments = availableTreatments.filter(t => t.status === 'in_progress');
    const pendingTreatments = availableTreatments.filter(t =>
        t.status !== 'in_progress'
    );

    return (
        <div className="space-y-6">
            {/* UPPER SECTION: Treatments In Progress */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-blue-50">
                    <h3 className="text-lg font-semibold text-slate-800">Treatments In Progress</h3>
                </div>
                {inProgressTreatments.length === 0 ? (
                    <p className="text-slate-500 text-center py-12 italic">
                        No treatments in progress. Click ↑ Start below to begin treatment.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tooth #</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Treatment</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Price</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Record</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {inProgressTreatments.map(treatment => (
                                    <tr key={treatment.visit_treatment_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleContinueLater(treatment)}
                                                    className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded hover:bg-orange-600"
                                                    title="Continue next visit"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleCancelTreatment(treatment)}
                                                    className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600"
                                                    title="Cancel (move back)"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{treatment.tooth_numbers || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            <span className="font-medium">({treatment.code})</span> {treatment.name}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <SmartPriceInput
                                                treatment={treatment}
                                                onPriceChange={(price) => {}}
                                                onPriceSave={(price) => handlePriceChange(treatment, price)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    setShowRecordModal(treatment.visit_treatment_id);
                                                    setTreatmentRecord(treatment.treatment_record || '');
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Write treatment record"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MIDDLE SECTION: Treatment Record Modal */}
            {showRecordModal && (
                <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-slate-800">Treatment Record</h4>
                        <button
                            onClick={() => setShowRecordModal(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <textarea
                        value={treatmentRecord}
                        onChange={(e) => setTreatmentRecord(e.target.value)}
                        rows="6"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Write detailed treatment notes here..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowRecordModal(null)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSaveTreatmentRecord(showRecordModal)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                            💾 Save Record
                        </button>
                    </div>
                </div>
            )}

            {/* LOWER SECTION: Available Treatments */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-800">Available Treatments</h3>
                </div>
                {pendingTreatments.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">
                        No treatments available. Add treatments in "Ex & Tx Creation" tab.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tooth #</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Treatment</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Notes</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {pendingTreatments.map(treatment => {
                                    const isContinued = treatment.treatment_record && treatment.status === 'pending';
                                    return (
                                        <tr
                                            key={treatment.visit_treatment_id}
                                            className={`hover:bg-slate-50 ${isContinued ? 'opacity-50 bg-slate-50' : ''}`}
                                        >
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleStartTreatment(treatment)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"
                                                    title="Start treatment"
                                                >
                                                    ↑ Start
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{treatment.tooth_numbers || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                <span className="font-medium">({treatment.code})</span> {treatment.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {treatment.notes || '-'}
                                                {isContinued && <span className="text-xs text-orange-600 ml-2">(Continued)</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                                                <div>{treatment.doctor_name || 'N/A'}</div>
                                                <div className="text-xs text-slate-400">
                                                    {treatment.performed_at ? new Date(treatment.performed_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentProcessingTab;
