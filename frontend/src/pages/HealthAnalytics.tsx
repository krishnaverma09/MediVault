import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AnalyticsScoreHero from '../components/AnalyticsScoreHero';
import AnalyticsCharts from '../components/AnalyticsCharts';
import VitalsLogForm from '../components/VitalsLogForm';
import RiskAlertsPanel from '../components/RiskAlertsPanel';
import AnalyticsInsightsPanel from '../components/AnalyticsInsightsPanel';
import VitalsHistoryTable from '../components/VitalsHistoryTable';
import type {
  AnalyticsDashboardData,
  AnalyticsSummaryData,
  User,
  VitalLog,
  VitalsFormValues,
} from '../types';
import { API_BASE, apiFetch } from '../config/api';

function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_FORM: VitalsFormValues = {
  date: todayIsoDate(),
  weight: '',
  height: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  bloodSugarFasting: '',
  bloodSugarRandom: '',
  heartRate: '',
  oxygenLevel: '',
  temperature: '',
  sleepHours: '',
  steps: '',
  notes: '',
};

const EMPTY_DASHBOARD: AnalyticsDashboardData = {
  healthScore: 0,
  healthScoreBand: 'Needs Attention',
  trends: {
    weight: {
      direction: 'stable',
      recentAverage: null,
      previousAverage: null,
      interpretation: 'Insufficient historical data.',
    },
    bloodPressure: {
      direction: 'stable',
      recentAverage: null,
      previousAverage: null,
      interpretation: 'Insufficient historical data.',
    },
    sugar: {
      direction: 'stable',
      recentAverage: null,
      previousAverage: null,
      interpretation: 'Insufficient historical data.',
    },
    sleep: {
      direction: 'stable',
      recentAverage: null,
      previousAverage: null,
      interpretation: 'Insufficient historical data.',
    },
  },
  riskFlags: [],
  recommendations: [],
  latestVitals: null,
  chartsData: {
    weight: [],
    bloodPressure: [],
    sugar: [],
    sleep: [],
  },
  summaryInsights: [],
  riskIndicators: [
    { key: 'bp', title: 'Blood Pressure', status: 'Unknown', severity: 'neutral' },
    { key: 'bmi', title: 'BMI', status: 'Unknown', severity: 'neutral' },
    { key: 'sleep', title: 'Sleep', status: 'Unknown', severity: 'neutral' },
    { key: 'sugar', title: 'Blood Sugar', status: 'Unknown', severity: 'neutral' },
  ],
  reportAnalysis: {
    reportCount: 0,
    lastReportDate: null,
    signals: [],
    recommendations: [],
  },
  quickSummary: 'Log your vitals to start analytics.',
  lastUpdated: null,
};

const EMPTY_SUMMARY: AnalyticsSummaryData = {
  healthScore: 0,
  healthScoreBand: 'Needs Attention',
  insights: [],
  riskFlags: [],
  recommendations: [],
  lastUpdated: null,
};

function numberOrNull(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDashboard(payload: Partial<AnalyticsDashboardData> | undefined): AnalyticsDashboardData {
  if (!payload) {
    return EMPTY_DASHBOARD;
  }

  return {
    ...EMPTY_DASHBOARD,
    ...payload,
    trends: {
      ...EMPTY_DASHBOARD.trends,
      ...(payload.trends || {}),
    },
    chartsData: {
      ...EMPTY_DASHBOARD.chartsData,
      ...(payload.chartsData || {}),
    },
    reportAnalysis: {
      ...EMPTY_DASHBOARD.reportAnalysis,
      ...(payload.reportAnalysis || {}),
    },
    riskIndicators:
      Array.isArray(payload.riskIndicators) && payload.riskIndicators.length > 0
        ? payload.riskIndicators
        : EMPTY_DASHBOARD.riskIndicators,
  };
}

function normalizeSummary(payload: Partial<AnalyticsSummaryData> | undefined): AnalyticsSummaryData {
  if (!payload) {
    return EMPTY_SUMMARY;
  }

  return {
    ...EMPTY_SUMMARY,
    ...payload,
    insights: Array.isArray(payload.insights) ? payload.insights : [],
    riskFlags: Array.isArray(payload.riskFlags) ? payload.riskFlags : [],
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
  };
}

function mapLogToForm(log: VitalLog): VitalsFormValues {
  const dateValue = log.date ? new Date(log.date).toISOString().split('T')[0] : todayIsoDate();

  const asString = (value?: number | null) => (typeof value === 'number' ? String(value) : '');

  return {
    date: dateValue,
    weight: asString(log.weight),
    height: asString(log.height),
    bloodPressureSystolic: asString(log.bloodPressureSystolic),
    bloodPressureDiastolic: asString(log.bloodPressureDiastolic),
    bloodSugarFasting: asString(log.bloodSugarFasting),
    bloodSugarRandom: asString(log.bloodSugarRandom),
    heartRate: asString(log.heartRate),
    oxygenLevel: asString(log.oxygenLevel),
    temperature: asString(log.temperature),
    sleepHours: asString(log.sleepHours),
    steps: asString(log.steps),
    notes: log.notes || '',
  };
}

export default function HealthAnalytics() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<AnalyticsDashboardData>(EMPTY_DASHBOARD);
  const [summary, setSummary] = useState<AnalyticsSummaryData>(EMPTY_SUMMARY);
  const [logs, setLogs] = useState<VitalLog[]>([]);

  const [formValues, setFormValues] = useState<VitalsFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('medivault_token');

  const handleLogout = () => {
    localStorage.removeItem('medivault_token');
    navigate('/login');
  };

  const formMode = useMemo(() => (editingId ? 'edit' : 'create'), [editingId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [profileRes, dashboardRes, summaryRes, logsRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`${API_BASE}/api/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`${API_BASE}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`${API_BASE}/api/analytics/vitals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const profilePayload = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profilePayload.message || 'Failed to load profile');
      }
      setUser(profilePayload.user || profilePayload.data || profilePayload);

      const dashboardPayload = await dashboardRes.json();
      if (!dashboardRes.ok) {
        throw new Error(dashboardPayload.message || 'Failed to load analytics dashboard');
      }
      setDashboard(normalizeDashboard(dashboardPayload.data || dashboardPayload));

      const summaryPayload = await summaryRes.json();
      if (!summaryRes.ok) {
        throw new Error(summaryPayload.message || 'Failed to load analytics summary');
      }
      setSummary(normalizeSummary(summaryPayload.data || summaryPayload));

      const logsPayload = await logsRes.json();
      if (!logsRes.ok) {
        throw new Error(logsPayload.message || 'Failed to load vitals history');
      }
      const vitalsHistory = Array.isArray(logsPayload.data || logsPayload) ? (logsPayload.data || logsPayload) : [];
      setLogs(vitalsHistory);
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
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [token, navigate, fetchData]);

  const updateFormField = (field: keyof VitalsFormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormValues({ ...EMPTY_FORM, date: todayIsoDate() });
    setEditingId(null);
  };

  const buildPayload = () => {
    return {
      date: formValues.date,
      weight: numberOrNull(formValues.weight),
      height: numberOrNull(formValues.height),
      bloodPressureSystolic: numberOrNull(formValues.bloodPressureSystolic),
      bloodPressureDiastolic: numberOrNull(formValues.bloodPressureDiastolic),
      bloodSugarFasting: numberOrNull(formValues.bloodSugarFasting),
      bloodSugarRandom: numberOrNull(formValues.bloodSugarRandom),
      heartRate: numberOrNull(formValues.heartRate),
      oxygenLevel: numberOrNull(formValues.oxygenLevel),
      temperature: numberOrNull(formValues.temperature),
      sleepHours: numberOrNull(formValues.sleepHours),
      steps: numberOrNull(formValues.steps),
      notes: formValues.notes,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = editingId
        ? `${API_BASE}/api/analytics/vitals/${editingId}`
        : `${API_BASE}/api/analytics/vitals`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to save vitals log');
      }

      setSuccess(editingId ? 'Vitals log updated.' : 'Vitals log saved.');
      resetForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vitals log');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log: VitalLog) => {
    setEditingId(log._id);
    setFormValues(mapLogToForm(log));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vitals entry?')) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`${API_BASE}/api/analytics/vitals/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to delete vitals log');
      }

      setSuccess('Vitals entry deleted.');
      if (editingId === id) {
        resetForm();
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vitals log');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return <div className="loading-screen">Loading Health Analytics...</div>;
  }

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      pageTitle="Health Analytics"
      pageSubtitle="Track trends, monitor risk indicators, and improve your health"
    >

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <AnalyticsScoreHero
          healthScore={dashboard.healthScore}
          healthScoreBand={dashboard.healthScoreBand}
          lastUpdated={dashboard.lastUpdated}
          quickSummary={dashboard.quickSummary}
        />

        <AnalyticsCharts chartsData={dashboard.chartsData} />

        <div className="grid-2 analytics-main-grid">
          <div className="col">
            <VitalsLogForm
              values={formValues}
              saving={saving}
              mode={formMode}
              onChange={updateFormField}
              onSubmit={handleSubmit}
              onCancelEdit={resetForm}
            />

            <RiskAlertsPanel
              indicators={dashboard.riskIndicators}
              riskFlags={dashboard.riskFlags}
            />
          </div>

          <div className="col">
            <AnalyticsInsightsPanel
              insights={summary.insights.length > 0 ? summary.insights : dashboard.summaryInsights}
              recommendations={
                summary.recommendations.length > 0 ? summary.recommendations : dashboard.recommendations
              }
              reportSignals={dashboard.reportAnalysis.signals}
            />
          </div>
        </div>

        <VitalsHistoryTable
          logs={logs}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
    </AppShell>
  );
}
