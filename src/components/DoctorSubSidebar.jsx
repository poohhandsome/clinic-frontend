import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function DoctorSubSidebar({ statusFilters, onStatusFilterChange, checkoutDateRange, onCheckoutDateChange }) {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto">
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Filter Queue</h3>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={statusFilters.queue}
                            onChange={(e) => onStatusFilterChange('queue', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Queue</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={statusFilters.draftCheckout}
                            onChange={(e) => onStatusFilterChange('draftCheckout', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">Draft Check Out</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={statusFilters.checkout}
                            onChange={(e) => onStatusFilterChange('checkout', e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-700">Checkout</span>
                    </label>

                    {statusFilters.checkout && (
                        <div className="ml-6 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={14} className="text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600">Date Range</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-slate-500">From</label>
                                    <input
                                        type="date"
                                        value={checkoutDateRange.start}
                                        onChange={(e) => onCheckoutDateChange('start', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">To</label>
                                    <input
                                        type="date"
                                        value={checkoutDateRange.end}
                                        onChange={(e) => onCheckoutDateChange('end', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
