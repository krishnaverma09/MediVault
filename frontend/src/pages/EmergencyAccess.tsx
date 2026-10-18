import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import EmergencyProfileForm from '../components/EmergencyProfileForm';
import EmergencyQRCodeCard from '../components/EmergencyQRCodeCard';
import type { EmergencyPrivateData, EmergencyProfileData, User } from '../types';
import { API_BASE, apiFetch } from '../config/api';

const EMPTY_PROFILE: EmergencyProfileData = {
  fullName: '',
  age: null,
  bloodGroup: '',
  allergies: [],
  conditions: [],
  medications: [],
  emergencyContacts: [],
  notes: '',
};

function normalizeEmergencyProfile(profile?: Partial<EmergencyProfileData>): EmergencyProfileData {
  return {
    fullName: profile?.fullName || '',
    age: profile?.age ?? null,
    bloodGroup: profile?.bloodGroup || '',
    allergies: Array.isArray(profile?.allergies) ? profile?.allergies : [],
    conditions: Array.isArray(profile?.conditions) ? profile?.conditions : [],
    medications: Array.isArray(profile?.medications) ? profile?.medications : [],
    emergencyContacts: Array.isArray(profile?.emergencyContacts) ? profile?.emergencyContacts : [],
    notes: profile?.notes || '',
  };
}

function normalizeEmergencyData(payload?: Partial<EmergencyPrivateData>): EmergencyPrivateData {
  return {
    emergencyAccessEnabled: Boolean(payload?.emergencyAccessEnabled),
    emergencyToken: payload?.emergencyToken || '',
    publicUrl: payload?.publicUrl || '',
    emergencyProfile: normalizeEmergencyProfile(payload?.emergencyProfile),
    updatedAt: payload?.updatedAt || '',
  };
}

export default function EmergencyAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  const [profile, setProfile] = useState<EmergencyProfileData>(EMPTY_PROFILE);
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('medivault_token');

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  const fetchQrCode = useCallback(async () => {
    setGeneratingQr(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/emergency/qr`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to generate QR code');
      }

      const data = payload.data || payload;
      setQrDataUrl(data.qrDataUrl || '');
      if (data.publicUrl) {
        setPublicUrl(data.publicUrl);
      }
    } finally {
      setGeneratingQr(false);
    }
  }, [token]);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [profileRes, emergencyRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        apiFetch(`${API_BASE}/api/emergency/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const profilePayload = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profilePayload.message || 'Failed to load profile');
      }

      const userData: User = profilePayload.user || profilePayload.data || profilePayload;
      setUser(userData);

      const emergencyPayload = await emergencyRes.json();
      if (!emergencyRes.ok) {
        throw new Error(emergencyPayload.message || 'Failed to load emergency profile');
      }

      const emergencyData = normalizeEmergencyData(emergencyPayload.data || emergencyPayload);
      setProfile(emergencyData.emergencyProfile);
      setAccessEnabled(emergencyData.emergencyAccessEnabled);
      setPublicUrl(emergencyData.publicUrl);

      await fetchQrCode();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      if (message.includes('Token') || message.includes('Not authorized')) {
        localStorage.removeItem('medivault_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, fetchQrCode]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPageData();
  }, [token, navigate, fetchPageData]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`${API_BASE}/api/emergency/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to save emergency profile');
      }

      const data = normalizeEmergencyData(payload.data || payload);
      setProfile(data.emergencyProfile);
      setAccessEnabled(data.emergencyAccessEnabled);
      setPublicUrl(data.publicUrl);
      await fetchQrCode();
      setSuccess('Emergency profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save emergency profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async () => {
    const nextValue = !accessEnabled;
    setToggling(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`${API_BASE}/api/emergency/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: nextValue }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update emergency access');
      }

      const data = normalizeEmergencyData(payload.data || payload);
      setAccessEnabled(data.emergencyAccessEnabled);
      setPublicUrl(data.publicUrl);
      setSuccess(nextValue ? 'Emergency access enabled.' : 'Emergency access disabled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update emergency access');
    } finally {
      setToggling(false);
    }
  };

  const handleRegenerateToken = async () => {
    const confirmed = window.confirm(
      'Regenerating will invalidate previously shared QR links. Continue?'
    );
    if (!confirmed) {
      return;
    }

    setRegenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`${API_BASE}/api/emergency/regenerate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to regenerate token');
      }

      const data = normalizeEmergencyData(payload.data || payload);
      setPublicUrl(data.publicUrl);
      await fetchQrCode();
      setSuccess('Emergency token regenerated. Old QR links are now invalid.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate token');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    anchor.download = 'medivault-emergency-qr.png';
    anchor.click();
  };

  const handlePreviewPublicPage = () => {
    if (!publicUrl) {
      return;
    }

    const tokenFromUrl = publicUrl.split('/').pop();
    if (!tokenFromUrl) {
      return;
    }

    window.open(`/public/emergency/${tokenFromUrl}`, '_blank', 'noopener,noreferrer');
  };

  if (loading || !user) {
    return <div className="loading-screen">Loading Emergency Access...</div>;
  }

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      pageTitle="Emergency Access"
      pageSubtitle="Create a secure QR code for life-saving emergency access"
    >
        <div className="page-header" style={{ marginBottom: 0 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Create a limited emergency profile and secure QR code for life-saving access.
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="grid-2 emergency-grid">
          <div className="col">
            <div className="card">
              <p className="card-title">Access Control</p>
              <div className="emergency-toggle-row">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    Emergency public profile
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    {accessEnabled
                      ? 'Enabled: emergency responders can view the limited profile.'
                      : 'Disabled: public access is blocked.'}
                  </p>
                </div>
                <button
                  type="button"
                  className={accessEnabled ? 'btn-sm btn-danger' : 'btn-sm btn-success'}
                  onClick={handleToggleAccess}
                  disabled={toggling}
                >
                  {toggling ? 'Updating...' : accessEnabled ? 'Disable Access' : 'Enable Access'}
                </button>
              </div>
            </div>

            <div className="card">
              <p className="card-title">Emergency Medical Profile</p>
              <EmergencyProfileForm
                profile={profile}
                saving={saving}
                onChange={setProfile}
                onSubmit={handleSaveProfile}
              />
            </div>
          </div>

          <div className="col">
            <EmergencyQRCodeCard
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
              accessEnabled={accessEnabled}
              generating={generatingQr}
              regenerating={regenerating}
              onDownload={handleDownloadQr}
              onRegenerate={handleRegenerateToken}
              onPreview={handlePreviewPublicPage}
            />

            <div className="card">
              <p className="card-title">Safety Notes</p>
              <ul className="records-list">
                <li className="record-item" style={{ alignItems: 'flex-start' }}>
                  <div className="record-info">
                    <strong>Share wisely</strong>
                    <span>Only share this QR with trusted emergency use scenarios.</span>
                  </div>
                </li>
                <li className="record-item" style={{ alignItems: 'flex-start' }}>
                  <div className="record-info">
                    <strong>Rotate token if exposed</strong>
                    <span>Regenerate QR immediately if you suspect the link was leaked.</span>
                  </div>
                </li>
                <li className="record-item" style={{ alignItems: 'flex-start' }}>
                  <div className="record-info">
                    <strong>Keep details current</strong>
                    <span>Update allergies, medications, and emergency contacts regularly.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
