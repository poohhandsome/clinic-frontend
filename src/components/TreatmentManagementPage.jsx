import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import authorizedFetch from '../api';

const TreatmentManagementPage = () => {
    const { user } = useAuth();
    const [treatments, setTreatments] = useState([]);
    const [filteredTreatments, setFilteredTreatments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentTreatment, setCurrentTreatment] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        standard_price: '',
        category: '',
        description: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Check role authorization
    useEffect(() => {
        if (user && !['nurse', 'admin'].includes(user.role)) {
            alert('Access denied. This page is for nurses and admins only.');
            window.history.back();
        }
    }, [user]);

    // Fetch all treatments
    const fetchTreatments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await authorizedFetch('/api/treatments');
            if (!res.ok) throw new Error('Failed to fetch treatments');
            const data = await res.json();
            setTreatments(data);
            setFilteredTreatments(data);
        } catch (err) {
            console.error('Error fetching treatments:', err);
            alert('Failed to load treatments');
        } finally {
            setIsLoading(false);
        }
    }, [authorizedFetch]);

    useEffect(() => {
        fetchTreatments();
    }, [fetchTreatments]);

    // Filter treatments based on search and category
    useEffect(() => {
        let result = treatments;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.code.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            result = result.filter(t => t.category === categoryFilter);
        }

        setFilteredTreatments(result);
    }, [searchQuery, categoryFilter, treatments]);

    // Get unique categories
    const categories = ['all', ...new Set(treatments.map(t => t.category).filter(Boolean))];

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Open add modal
    const handleAddNew = () => {
        setModalMode('add');
        setFormData({
            code: '',
            name: '',
            standard_price: '',
            category: '',
            description: ''
        });
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (treatment) => {
        setModalMode('edit');
        setCurrentTreatment(treatment);
        setFormData({
            code: treatment.code,
            name: treatment.name,
            standard_price: treatment.standard_price,
            category: treatment.category || '',
            description: treatment.description || ''
        });
        setShowModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.code || !formData.name || !formData.standard_price) {
            alert('Code, name, and price are required');
            return;
        }

        const price = parseFloat(formData.standard_price);
        if (isNaN(price) || price < 0) {
            alert('Please enter a valid price');
            return;
        }

        try {
            const url = modalMode === 'add'
                ? '/api/treatments'
                : `/api/treatments/${currentTreatment.treatment_id}`;

            const method = modalMode === 'add' ? 'POST' : 'PUT';

            const res = await authorizedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to save treatment');
            }

            alert(`Treatment ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
            setShowModal(false);
            fetchTreatments();
        } catch (err) {
            console.error('Error saving treatment:', err);
            alert(err.message);
        }
    };

    // Handle delete
    const handleDelete = async (treatmentId) => {
        try {
            const res = await authorizedFetch(`/api/treatments/${treatmentId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete treatment');
            }

            alert('Treatment deleted successfully');
            setDeleteConfirm(null);
            fetchTreatments();
        } catch (err) {
            console.error('Error deleting treatment:', err);
            alert(err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '20px' }}>Treatment Management</h1>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: '1',
                        minWidth: '250px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />

                {/* Category filter */}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minWidth: '150px'
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                        </option>
                    ))}
                </select>

                {/* Add button */}
                <button
                    onClick={handleAddNew}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Add New Treatment
                </button>
            </div>

            {/* Results count */}
            <p style={{ color: '#666', marginBottom: '15px' }}>
                Showing {filteredTreatments.length} of {treatments.length} treatments
            </p>

            {/* Loading */}
            {isLoading && <p>Loading treatments...</p>}

            {/* Treatments table */}
            {!isLoading && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Price (฿)</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTreatments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                        No treatments found
                                    </td>
                                </tr>
                            ) : (
                                filteredTreatments.map((treatment) => (
                                    <tr key={treatment.treatment_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{treatment.code}</td>
                                        <td style={{ padding: '12px' }}>{treatment.name}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#e0f2fe',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {treatment.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {parseFloat(treatment.standard_price).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '12px', maxWidth: '250px' }}>
                                            {treatment.description || '-'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(treatment)}
                                                style={{
                                                    padding: '6px 12px',
                                                    marginRight: '5px',
                                                    backgroundColor: '#10B981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => setDeleteConfirm(treatment)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#DC2626',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
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
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>
                            {modalMode === 'add' ? 'Add New Treatment' : 'Edit Treatment'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Code *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Price (฿) *
                                </label>
                                <input
                                    type="number"
                                    name="standard_price"
                                    value={formData.standard_price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Category
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#3B82F6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {modalMode === 'add' ? 'Add Treatment' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
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
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '15px', color: '#DC2626' }}>Confirm Delete</h2>
                        <p style={{ marginBottom: '20px' }}>
                            Are you sure you want to delete treatment <strong>{deleteConfirm.code}</strong> - {deleteConfirm.name}?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
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
                                onClick={() => handleDelete(deleteConfirm.treatment_id)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#DC2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentManagementPage;
