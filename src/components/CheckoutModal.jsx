import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function CheckoutModal({ patient, onClose, onCheckout }) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheckout = async (isDraft) => {
        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onCheckout(password, isDraft);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to checkout');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Checkout Patient</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                            <strong>Patient:</strong> {patient?.first_name_th} {patient?.last_name_th}
                        </p>
                        <p className="text-sm text-blue-900">
                            <strong>DN:</strong> {patient?.dn}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Doctor Password
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => handleCheckout(true)}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Processing...' : 'Draft Check Out'}
                        </button>
                        <button
                            onClick={() => handleCheckout(false)}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Processing...' : 'Checkout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
