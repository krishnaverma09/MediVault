import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareModal from '../components/ShareModal';
import AppShell from '../components/AppShell';
import type { User, MedicalDocument, ShareDocument } from '../types';
import { API_URL, apiFetch } from '../config/api';

export default function Documents() {
  const [shareDoc, setShareDoc] = useState<MedicalDocument | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [myDocs, setMyDocs] = useState<MedicalDocument[]>([]);
  const [sharedDocs, setSharedDocs] = useState<ShareDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('medivault_token');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await apiFetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) throw new Error(profileData.message || 'Failed to load profile');
      const userData: User = profileData.user || profileData.data || profileData;
      setUser(userData);

      if (userData.role === 'doctor') {
        const docsRes = await apiFetch(`${API_URL}/api/documents/doctor/shared-documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docsData = await docsRes.json().catch(() => ({}));
        if (docsRes.ok) setSharedDocs(docsData.data || []);
      } else {
        const myRes = await apiFetch(`${API_URL}/api/documents/patient/my-documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json().catch(() => ({}));
        if (myRes.ok) setMyDocs(myData.data || []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      if (msg.includes('Token')) {
        localStorage.removeItem('medivault_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);

  const viewDoctorDoc = async (shareId: string, download = false) => {
    try {
      const response = await apiFetch(`${API_URL}/api/documents/doctor/view/${shareId}${download ? "?download=true" : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Access denied');
      window.open(result.data.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      alert('Failed to log access or open document.');
    }
  };

  const downloadDoc = async (shareId: string) => {
    await viewDoctorDoc(shareId, true);
  };

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  if (error && !user) return <div className="error-banner" role="alert">{error} <a href="/login">Return to login</a></div>;

  if (loading || !user) return <div className="loading-screen">Loading Documents…</div>;

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      pageTitle="Documents"
      pageSubtitle={user.role === 'doctor' ? 'Documents shared with you by patients' : 'Your uploaded medical documents'}
    >
        {error && <div className="error-banner">{error}</div>}

        {user.role !== 'doctor' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                My Uploaded Documents
              </span>
              <button className="btn-outline" onClick={() => navigate('/documents/upload')}>
                + Upload New
              </button>
            </div>
            <div className="card">
              {myDocs.length === 0 ? (
                <p className="no-data">You haven't uploaded any documents yet.</p>
              ) : (
                <ul className="records-list">
                  {myDocs.map((doc) => (
                    <li key={doc._id} className="record-item" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div className="record-info" style={{ flex: 1 }}>
                        <strong>{doc.title}</strong>
                        <span style={{ color: '#a855f7', fontWeight: 500 }}>{doc.documentType}</span>
                        {doc.description && <span>{doc.description}</span>}
                        <span>Uploaded {new Date(doc.createdAt).toLocaleString()}</span>
                      </div>
                      <button className="btn-link" onClick={() => setShareDoc(doc)}>Share / Manage access</button>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-link"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="card">
            <p className="card-title">Shared Documents (Secure Inbox)</p>
            {sharedDocs.length === 0 ? (
              <p className="no-data">No documents have been shared with you.</p>
            ) : (
              <ul className="records-list">
                {sharedDocs.map((share) => (
                  <li
                    key={share.shareId}
                    className="record-item"
                    style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}
                  >
                    <div className="record-info" style={{ flex: 1 }}>
                      <strong>{share.document?.title || 'Untitled Document'}</strong>
                      <span style={{ color: '#a855f7', fontWeight: 500 }}>
                        {share.document?.documentType || 'Report'}
                      </span>
                      <span>
                        Patient: {share.patient?.name} ({share.patient?.email})
                      </span>
                      {share.document?.description && (
                        <span>Notes: {share.document.description}</span>
                      )}
                      <span>
                        Shared {new Date(share.sharedAt).toLocaleString()} &bull; Permission:{' '}
                        <strong>{share.permission}</strong>
                        {share.expiresAt &&
                          ` · Expires ${new Date(share.expiresAt).toLocaleString()}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'center' }}>
                      <button
                        className="btn-link"
                        onClick={() => viewDoctorDoc(share.shareId)}
                      >
                        View
                      </button>
                      {(share.permission === 'DOWNLOAD' || share.permission === 'FULL_ACCESS') && (
                        <button
                          className="btn-sm btn-success"
                          onClick={() => downloadDoc(share.shareId)}
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      {shareDoc && <ShareModal record={{ ...shareDoc, originalName: shareDoc.title, size: 0 }} onClose={() => setShareDoc(null)} />}
    </AppShell>
  );
}
