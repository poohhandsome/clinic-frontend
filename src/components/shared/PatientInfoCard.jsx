import React from 'react';

const PatientInfoCard = ({ patient }) => {
    if (!patient) return null;

    // Calculate age from date of birth
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Get alert color based on level
    const getAlertColor = (level) => {
        if (!level) return '#10B981'; // green
        if (level >= 3) return '#EF4444'; // red
        if (level >= 2) return '#F59E0B'; // yellow
        return '#10B981'; // green
    };

    // Get alert label
    const getAlertLabel = (level) => {
        if (!level || level === 1) return 'Normal';
        if (level === 2) return 'Caution';
        if (level >= 3) return 'Urgent';
        return 'Normal';
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: '20px',
            alignItems: 'center'
        }}>
            {/* Left: Basic Info */}
            <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
                    {patient.first_name_th} {patient.last_name_th}
                </h2>
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                    <span><strong>DN:</strong> {patient.dn}</span>
                    <span><strong>Age:</strong> {calculateAge(patient.date_of_birth)} yrs</span>
                    {patient.gender && (
                        <span><strong>Gender:</strong> {patient.gender}</span>
                    )}
                </div>
            </div>

            {/* Center: Alerts & Warnings */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {patient.allergies && (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #DC2626'
                    }}>
                        ⚠️ Allergies: {patient.allergies}
                    </div>
                )}

                {patient.chronic_diseases && (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #D97706'
                    }}>
                        ℹ️ Chronic: {patient.chronic_diseases}
                    </div>
                )}

                {patient.extreme_care_drugs && (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #1E40AF'
                    }}>
                        💊 Extreme Care Drugs: {patient.extreme_care_drugs}
                    </div>
                )}

                {patient.is_pregnant && (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#FCE7F3',
                        color: '#BE185D',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #BE185D'
                    }}>
                        🤰 Pregnant
                    </div>
                )}
            </div>

            {/* Right: Alert Level Badge */}
            {patient.alert_level !== undefined && (
                <div style={{
                    padding: '10px 20px',
                    backgroundColor: getAlertColor(patient.alert_level),
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: '100px'
                }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Alert Level</div>
                    <div style={{ fontSize: '18px' }}>{getAlertLabel(patient.alert_level)}</div>
                </div>
            )}
        </div>
    );
};

export default PatientInfoCard;
