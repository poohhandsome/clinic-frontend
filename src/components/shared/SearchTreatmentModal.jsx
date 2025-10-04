import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const SearchTreatmentModal = ({ onSelect, onClose }) => {
    const { authorizedFetch } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [customPrice, setCustomPrice] = useState('');

    // Debounced search
    const performSearch = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await authorizedFetch(`/api/treatments/search?q=${encodeURIComponent(query.trim())}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Treatment search error:', err);
            setSearchResults([]);
            alert('Failed to search treatments');
        } finally {
            setIsSearching(false);
        }
    }, [authorizedFetch]);

    // Handle search with debouncing
    useState(() => {
        const timeoutId = setTimeout(() => {
            performSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, performSearch]);

    // Handle treatment selection
    const handleSelectTreatment = (treatment) => {
        setSelectedTreatment(treatment);
        setCustomPrice(treatment.standard_price);
    };

    // Handle add treatment
    const handleAdd = () => {
        if (!selectedTreatment) {
            alert('Please select a treatment');
            return;
        }

        if (quantity <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        onSelect(selectedTreatment, quantity, customPrice);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <h2 style={{ marginBottom: '20px' }}>Search Treatment</h2>

                {/* Search input */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search by code or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />
                    {isSearching && (
                        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>Searching...</p>
                    )}
                </div>

                {/* Search results */}
                <div style={{ marginBottom: '20px', maxHeight: '300px', overflow: 'auto' }}>
                    {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                        <p style={{ color: '#999', textAlign: 'center' }}>No treatments found</p>
                    )}

                    {searchResults.length > 0 && (
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Code</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map((treatment) => (
                                    <tr
                                        key={treatment.treatment_id}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: selectedTreatment?.treatment_id === treatment.treatment_id ? '#e0f2fe' : 'white',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleSelectTreatment(treatment)}
                                    >
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{treatment.code}</td>
                                        <td style={{ padding: '10px' }}>{treatment.name}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                backgroundColor: '#e0f2fe',
                                                borderRadius: '3px',
                                                fontSize: '11px'
                                            }}>
                                                {treatment.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            ฿{parseFloat(treatment.standard_price).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <input
                                                type="radio"
                                                checked={selectedTreatment?.treatment_id === treatment.treatment_id}
                                                onChange={() => handleSelectTreatment(treatment)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Selected treatment details */}
                {selectedTreatment && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ marginBottom: '10px' }}>Selected Treatment</h3>
                        <p><strong>Code:</strong> {selectedTreatment.code}</p>
                        <p><strong>Name:</strong> {selectedTreatment.name}</p>
                        <p><strong>Standard Price:</strong> ฿{parseFloat(selectedTreatment.standard_price).toFixed(2)}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    min="1"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Custom Price (฿)
                                </label>
                                <input
                                    type="number"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    placeholder="Leave blank for standard price"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#e0f2fe',
                            borderRadius: '4px'
                        }}>
                            <strong>Total:</strong> ฿{(parseFloat(customPrice || selectedTreatment.standard_price) * quantity).toFixed(2)}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6B7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!selectedTreatment}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: selectedTreatment ? '#3B82F6' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedTreatment ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold'
                        }}
                    >
                        Add Treatment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchTreatmentModal;
