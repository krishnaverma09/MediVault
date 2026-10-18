import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import type { User, Doctor } from '../types';
import { API_URL, apiFetch } from '../config/api';

export default function UploadDocument() {
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Report');
  const [description, setDescription] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [permission, setPermission] = useState('VIEW');
  const [expiry, setExpiry] = useState('NEVER');
  const [uploading, setUploading] = useState(false);

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

      if (userData.role !== 'doctor') {
        const docRes = await apiFetch(`${API_URL}/api/user/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docData = await docRes.json().catch(() => ({}));
        if (docRes.ok) {
          setDoctors(Array.isArray(docData) ? docData : docData.data || []);
        }
      } else {
        navigate('/documents');
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

  const handleDoctorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedDoctors(selected);
  };

  const handleUploadAndShare = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !title || !documentType) return alert('Please provide the required fields.');

    if (file.size > 4 * 1024 * 1024) return alert('File must be 4 MB or smaller.');
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert('Upload a PDF, JPEG, PNG, or WebP file.');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('documentType', documentType);
    formData.append('description', description);
    formData.append('permission', permission);
    formData.append('expiry', expiry);

    if (selectedDoctors.length > 0) {
      formData.append('doctorIds', JSON.stringify(selectedDoctors));
    }

    try {
      const res = await apiFetch(`${API_URL}/api/documents/upload-and-share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      navigate('/documents');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  if (error && !user) return <div className="error-banner" role="alert">{error} <a href="/login">Return to login</a></div>;

  if (loading || !user) return <div className="loading-screen">Loading Upload…</div>;

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      pageTitle="Upload Document"
      pageSubtitle="Securely upload and share your medical documents"
    >
        <div style={{ maxWidth: 600 }}>
          {error && <div className="error-banner">{error}</div>}
          <div className="card">
            <p className="card-title">Upload &amp; Share Document</p>
            <form onSubmit={handleUploadAndShare} className="upload-form">
              <div className="form-group">
                <label>Upload File</label>
                <input
                  type="file"
                  id="fileInputDocs"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                />
              </div>

              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Blood Test Report"
                />
              </div>

              <div className="form-group">
                <label>Document Type</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} required>
                  <option value="Report">Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Scan">Scan</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short notes about the file"
                />
              </div>

              <div className="form-group">
                <label>Share With Doctors (Ctrl/Cmd+Click for multiple)</label>
                <select multiple value={selectedDoctors} onChange={handleDoctorSelect}>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name}
                    </option>
                  ))}
                </select>
                <small>Only selected doctors will receive access.</small>
              </div>

              <div className="form-group">
                <label>Permission Level</label>
                <select value={permission} onChange={(e) => setPermission(e.target.value)}>
                  <option value="VIEW">View Only</option>
                  <option value="DOWNLOAD">View + Download</option>

                </select>
              </div>

              <div className="form-group">
                <label>Expiry Time</label>
                <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                  <option value="1H">1 Hour</option>
                  <option value="24H">24 Hours</option>
                  <option value="7D">7 Days</option>
                  <option value="NEVER">No Expiry</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Processing…' : 'Upload & Share'}
              </button>
            </form>
          </div>
        </div>
    </AppShell>
  );
}
