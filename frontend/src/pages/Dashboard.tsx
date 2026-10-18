import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TriangleAlert, FileText, ScanLine, Pill, ClipboardList, Share2,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import ShareModal from '../components/ShareModal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import type { User, MedicalRecord } from '../types';
import { API_URL, apiFetch } from '../config/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmergencyProfile {
  emergencyAccessEnabled: boolean;
  emergencyProfile?: {
    bloodGroup?: string;
    allergies?: string[];
    emergencyContacts?: Array<{ name: string; relation: string; phone: string }>;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

type RecordCategory = 'lab' | 'imaging' | 'prescription' | 'discharge' | 'other';

function detectCategory(name: string): RecordCategory {
  const n = name.toLowerCase();
  if (n.includes('xray') || n.includes('x-ray') || n.includes('mri') || n.includes('ct') || n.includes('scan') || n.includes('ultrasound') || n.includes('imaging')) return 'imaging';
  if (n.includes('prescription') || n.includes('rx') || n.includes('medication') || n.includes('medicine')) return 'prescription';
  if (n.includes('discharge') || n.includes('summary')) return 'discharge';
  if (n.includes('lab') || n.includes('blood') || n.includes('test') || n.includes('report')) return 'lab';
  return 'other';
}

const categoryConfig: Record<RecordCategory, { icon: React.ReactNode; bg: string; color: string; badge: 'blue' | 'purple' | 'green' | 'amber' | 'gray'; label: string }> = {
  lab:          { icon: <FileText size={18} />,      bg: 'var(--blue-50)',   color: 'var(--blue)',   badge: 'blue',   label: 'Lab Report' },
  imaging:      { icon: <ScanLine size={18} />,      bg: 'var(--purple-50)', color: 'var(--purple)', badge: 'purple', label: 'Imaging' },
  prescription: { icon: <Pill size={18} />,          bg: 'var(--green-50)',  color: 'var(--green)',  badge: 'green',  label: 'Prescription' },
  discharge:    { icon: <ClipboardList size={18} />, bg: 'var(--amber-50)',  color: 'var(--amber)',  badge: 'amber',  label: 'Discharge' },
  other:        { icon: <FileText size={18} />,      bg: 'var(--blue-50)',   color: 'var(--blue)',   badge: 'blue',   label: 'Record' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subGreen }: { label: string; value: string | number; sub?: string; subGreen?: boolean }) {
  return (
    <div style={{
      background: 'white',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: subGreen ? 'var(--green)' : 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          {subGreen && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Doctor Dashboard ─────────────────────────────────────────────────────────

function DoctorDashboard({ user, records, loading }: { user: User; records: MedicalRecord[]; loading: boolean }) {
  return (
    <div>
      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }} className="stats-grid">
        <StatCard label="Shared with me" value={records.length} sub="Documents" />
        <StatCard label="Patients" value={new Set(records.map(r => r.user?.name)).size} sub="Active" />
        <StatCard label="My role" value="Doctor" sub="Doctor account" subGreen />
        <StatCard label="Account status" value="Active" sub="All systems OK" subGreen />
      </div>

      <div style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Patient Records</span>
          <Link to="/documents" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
        </div>
        {loading ? (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={48} radius={8} />)}
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="No records yet" subtitle="Records shared by patients will appear here." />
        ) : (
          records.slice(0, 5).map((record, i) => {
            const cat = detectCategory(record.originalName);
            const cfg = categoryConfig[cat];
            return (
              <div
                key={record._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                  borderBottom: i < records.length - 1 ? '0.5px solid #F1F5F9' : 'none',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.originalName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {record.user?.name ? `Patient: ${record.user.name} · ` : ''}{formatBytes(record.size)}
                  </div>
                </div>
                <Badge variant={cfg.badge} label={cfg.label} />
                <Link to="/documents" style={{ color: 'var(--blue)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View</Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [emergency, setEmergency] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ activeShares: 0, doctors: 0, consultations: 0 });
  const [shareRecord, setShareRecord] = useState<MedicalRecord | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('medivault_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await apiFetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json().catch(() => ({}));
        if (!profileRes.ok) throw new Error(profileData.message || 'Failed to load profile');
        const userData: User = profileData.user || profileData.data || profileData;
        setUser(userData);

        const recordsRes = await apiFetch(`${API_URL}/api/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const recordsData = await recordsRes.json().catch(() => ({}));
        if (recordsRes.ok) setRecords(recordsData.data || recordsData);

        // Fetch emergency profile for patient
        if (userData.role !== 'doctor') {
          const summaryRes = await apiFetch(`${API_URL}/api/records/summary`, { headers: { Authorization: `Bearer ${token}` } });
          if (summaryRes.ok) setSummary(await summaryRes.json());
          const emergRes = await apiFetch(`${API_URL}/api/emergency/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (emergRes.ok) {
            const emergData = await emergRes.json().catch(() => ({}));
            setEmergency(emergData.data || emergData);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred';
        setError(msg);
        if (msg.includes('Token') || msg.includes('Not authorized')) {
          localStorage.removeItem('medivault_token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  if (error && !user) return <div className="error-banner" role="alert">{error} <a href="/login">Return to login</a></div>;

  if (!user) {
    return <div className="loading-screen">Loading MediVault…</div>;
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <AppShell
        user={user}
        onLogout={handleLogout}
        pageTitle={user.role === 'doctor' ? `Welcome, Dr. ${user.name.split(' ')[0]}` : `Welcome, ${user.name.split(' ')[0]}`}
        pageSubtitle={todayStr}
      >
        {error && <div className="error-banner">{error}</div>}

        {user.role === 'doctor' ? (
          <DoctorDashboard user={user} records={records} loading={loading} />
        ) : (
          <PatientDashboard
            records={records}
            emergency={emergency}
            loading={loading}
            summary={summary}
            onShareRecord={setShareRecord}
          />
        )}
      </AppShell>

      {shareRecord && (
        <ShareModal record={shareRecord} onClose={() => setShareRecord(null)} />
      )}
    </>
  );
}

// ─── Patient Dashboard ─────────────────────────────────────────────────────────

function PatientDashboard({
  records,
  emergency,
  loading,
  onShareRecord,
  summary,
}: {
  records: MedicalRecord[];
  emergency: EmergencyProfile | null;
  loading: boolean;
  onShareRecord: (r: MedicalRecord) => void;
  summary: { activeShares: number; doctors: number; consultations: number };
}) {
  const emergencyActive = emergency?.emergencyAccessEnabled;
  const ep = emergency?.emergencyProfile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Emergency Banner */}
      {emergencyActive && ep && (
        <div style={{
          background: 'var(--orange-50)',
          border: '0.5px solid var(--orange-200)',
          borderRadius: 'var(--radius-xl)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 48, height: 48, background: '#FFEDD5', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TriangleAlert size={24} color="#EA580C" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange-800)', marginBottom: 3 }}>
              Emergency QR profile active
            </div>
            <div style={{ fontSize: 12, color: 'var(--orange-700)', lineHeight: 1.5 }}>
              Blood group: <strong>{ep.bloodGroup || '—'}</strong>
              {ep.allergies && ep.allergies.length > 0 && ` · Allergies: ${ep.allergies.join(', ')}`}
              {ep.emergencyContacts && ep.emergencyContacts.length > 0 && ` · Emergency contact: ${ep.emergencyContacts[0].name}`}
            </div>
          </div>
          <div style={{
            width: 60, height: 60, border: '2px solid var(--orange-200)',
            borderRadius: 10, background: 'white', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'var(--text-muted)', textAlign: 'center',
          }}>
            <Link to="/emergency-access">View QR</Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Total records" value={records.length} sub="Medical files" />
        <StatCard label="Active share links" value={summary.activeShares} sub="Shared documents" />
        <StatCard label="Doctors with access" value={summary.doctors} sub="Current access" />
        <StatCard label="Consultations" value={summary.consultations} sub="Appointments" />
      </div>

      {/* Recent Records */}
      <div style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent records</span>
          <Link to="/documents" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
        </div>

        {loading ? (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} height={52} radius={8} />)}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title="No records yet"
            subtitle="Upload your first medical record to get started."
            action={
              <Link to="/documents/upload" style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none', padding: '8px 16px', background: 'var(--blue-50)', borderRadius: 8 }}>
                Upload record
              </Link>
            }
          />
        ) : (
          records.slice(0, 5).map((record, i) => {
            const cat = detectCategory(record.originalName);
            const cfg = categoryConfig[cat];
            return (
              <div
                key={record._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                  borderBottom: i < Math.min(records.length, 5) - 1 ? '0.5px solid #F1F5F9' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.originalName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {cfg.label} · {formatBytes(record.size)} · PDF
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Badge variant={cfg.badge} label={cfg.label} />
                  <button
                    onClick={() => onShareRecord(record)}
                    title="Share this record"
                    style={{
                      width: 28, height: 28, border: '0.5px solid var(--border)', borderRadius: 6,
                      background: 'white', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue-200)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                  >
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
