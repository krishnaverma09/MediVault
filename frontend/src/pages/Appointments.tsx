import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import type { User, Appointment, Doctor } from '../types';
import { API_URL, apiFetch } from '../config/api';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Pending: 'badge badge-pending',
    Accepted: 'badge badge-accepted',
    Rejected: 'badge badge-rejected',
    Completed: 'badge badge-completed',
    Cancelled: 'badge badge-cancelled',
  };
  return map[status] ?? 'badge badge-cancelled';
}

export default function Appointments() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('medivault_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const profileRes = await apiFetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json().catch(() => ({}));
        if (!profileRes.ok) throw new Error(profileData.message || 'Failed to load profile');
        const userData: User = profileData.user || profileData.data || profileData;
        setUser(userData);

        const endpoint =
          userData.role === 'doctor'
            ? `${API_URL}/api/appointments/doctor`
            : `${API_URL}/api/appointments/patient`;

        const aptRes = await apiFetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const aptData = await aptRes.json().catch(() => ({}));
        if (aptRes.ok) {
          setAppointments(aptData.data || []);
        }

        if (userData.role !== 'doctor') {
          const docRes = await apiFetch(`${API_URL}/api/user/doctors`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const docData = await docRes.json().catch(() => ({}));
          if (docRes.ok) {
            setDoctors(Array.isArray(docData) ? docData : docData.data || []);
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

    fetchData();
  }, [token, navigate]);

  const refreshAppointments = async () => {
    if (!user) return;
    try {
      const endpoint =
        user.role === 'doctor'
          ? `${API_URL}/api/appointments/doctor`
          : `${API_URL}/api/appointments/patient`;
      const aptRes = await apiFetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const aptData = await aptRes.json().catch(() => ({}));
      if (aptRes.ok) setAppointments(aptData.data || []);
    } catch (err) {
      console.error('Failed to refresh appointments', err);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorId || !date || !time || !reason) {
      return alert('Please fill all fields');
    }
    setBooking(true);
    try {
      const res = await apiFetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId, date, time, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to book appointment');
      setDoctorId('');
      setDate('');
      setTime('');
      setReason('');
      refreshAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const updateStatus = async (id: string, action: string) => {
    let notes = '';
    if (action === 'complete') {
      const input = prompt('Add any notes or prescription (optional):');
      if (input === null) return;
      notes = input;
    }
    try {
      const res = await apiFetch(`${API_URL}/api/appointments/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notes || '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed to ${action} appointment`);
      refreshAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await apiFetch(`${API_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to cancel appointment');
      refreshAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  if (error && !user) return <div className="error-banner" role="alert">{error} <a href="/login">Return to login</a></div>;

  if (loading || !user) return <div className="loading-screen">Loading Appointments…</div>;

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      pageTitle="Appointments"
      pageSubtitle={user.role === 'doctor' ? 'Review and manage incoming requests' : 'Book and track your appointments'}
    >
      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        {user.role !== 'doctor' && (
          <div className="col">
            <div className="card">
              <p className="card-title">Book an Appointment</p>
              <form onSubmit={handleBookAppointment} className="upload-form">
                <div className="form-group">
                  <label>Select Doctor</label>
                  <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                    <option value="">— Choose Doctor —</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Routine Checkup"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={booking}>
                  {booking ? 'Booking…' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div
          className="col"
          style={user.role === 'doctor' ? { gridColumn: '1 / -1' } : {}}
        >
          <div className="card">
            <p className="card-title">
              {user.role === 'doctor' ? 'Appointment Requests' : 'My Appointments'}
            </p>
            {appointments.length === 0 ? (
              <p className="no-data">No appointments found.</p>
            ) : (
              <ul className="records-list">
                {appointments.map((apt) => (
                  <li
                    key={apt._id}
                    className="record-item"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                      <div className="record-info" style={{ flex: 1 }}>
                        <strong>
                          {user.role === 'doctor'
                            ? `Patient: ${apt.patientId?.name || 'Unknown'}`
                            : `Dr. ${apt.doctorId?.name || 'Unknown'}`}
                        </strong>
                        <span>Reason: {apt.reason}</span>
                        <span>
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </span>
                        {apt.notes && (
                          <span style={{ marginTop: 4, fontStyle: 'italic' }}>
                            Notes: {apt.notes}
                          </span>
                        )}
                      </div>
                      <span className={statusBadge(apt.status)}>{apt.status}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {user.role === 'doctor' && apt.status === 'Pending' && (
                        <>
                          <button
                            className="btn-sm btn-success"
                            onClick={() => updateStatus(apt._id, 'accept')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => updateStatus(apt._id, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.role === 'doctor' && apt.status === 'Accepted' && (
                        <button
                          className="btn-sm btn-blue"
                          onClick={() => updateStatus(apt._id, 'complete')}
                        >
                          Mark Completed
                        </button>
                      )}
                      {user.role !== 'doctor' &&
                        (apt.status === 'Pending' || apt.status === 'Accepted') && (
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => cancelAppointment(apt._id)}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
