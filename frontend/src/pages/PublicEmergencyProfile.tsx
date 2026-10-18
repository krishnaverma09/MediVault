import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { EmergencyProfileData } from '../types';
import { API_BASE, apiFetch } from '../config/api';

function joinValues(values: string[]) {
  return values.length ? values.join(', ') : 'Not provided';
}

function normalizeProfile(profile?: Partial<EmergencyProfileData>): EmergencyProfileData {
  return {
    fullName: profile?.fullName || 'Not provided',
    age: profile?.age ?? null,
    bloodGroup: profile?.bloodGroup || 'Not provided',
    allergies: Array.isArray(profile?.allergies) ? profile.allergies : [],
    conditions: Array.isArray(profile?.conditions) ? profile.conditions : [],
    medications: Array.isArray(profile?.medications) ? profile.medications : [],
    emergencyContacts: Array.isArray(profile?.emergencyContacts) ? profile.emergencyContacts : [],
    notes: profile?.notes || '',
  };
}

export default function PublicEmergencyProfile() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<EmergencyProfileData | null>(null);

  const title = useMemo(() => {
    return profile?.fullName ? `${profile.fullName} - Emergency Info` : 'Emergency Medical Info';
  }, [profile]);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!token) {
        setError('Invalid emergency token.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetch(`${API_BASE}/api/public/emergency/${token}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || 'Emergency profile not available.');
        }

        const data = normalizeProfile(payload.data || payload);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load emergency profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [token]);

  if (loading) {
    return <div className="loading-screen">Loading Emergency Profile...</div>;
  }

  return (
    <main className="public-emergency-page">
      <section className="public-emergency-card">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">Read-only emergency medical snapshot</p>
        </div>

        {error ? (
          <div className="error-banner" style={{ marginBottom: 0 }}>
            {error}
          </div>
        ) : (
          profile && (
            <>
              <div className="public-emergency-grid">
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Full Name</span>
                  <strong>{profile.fullName || 'Not provided'}</strong>
                </div>
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Age</span>
                  <strong>{profile.age ?? 'Not provided'}</strong>
                </div>
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Blood Group</span>
                  <strong>{profile.bloodGroup || 'Not provided'}</strong>
                </div>
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Allergies</span>
                  <strong>{joinValues(profile.allergies)}</strong>
                </div>
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Conditions</span>
                  <strong>{joinValues(profile.conditions)}</strong>
                </div>
                <div className="public-emergency-field">
                  <span className="public-emergency-label">Medications</span>
                  <strong>{joinValues(profile.medications)}</strong>
                </div>
              </div>

              <div className="public-emergency-section">
                <p className="card-title" style={{ marginBottom: 12 }}>Emergency Contacts</p>
                {profile.emergencyContacts.length === 0 ? (
                  <p className="no-data" style={{ textAlign: 'left', padding: 0 }}>
                    No emergency contacts provided.
                  </p>
                ) : (
                  <ul className="records-list">
                    {profile.emergencyContacts.map((contact, index) => (
                      <li key={`${contact.phone}-${index}`} className="record-item">
                        <div className="record-info">
                          <strong>{contact.name}</strong>
                          <span>{contact.relation}</span>
                          <span>{contact.phone}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {profile.notes && (
                <div className="public-emergency-section">
                  <p className="card-title" style={{ marginBottom: 12 }}>Additional Notes</p>
                  <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{profile.notes}</p>
                </div>
              )}
            </>
          )
        )}
      </section>
    </main>
  );
}
