const vitalsHistory = [
  {
    _id: "log-1",
    date: "2026-01-06T08:00:00.000Z",
    createdAt: "2026-01-06T08:00:00.000Z",
    updatedAt: "2026-01-06T08:00:00.000Z",
    weight: 78,
    bmi: 26.2,
    bloodPressureSystolic: 132,
    bloodPressureDiastolic: 84,
    bloodSugarFasting: 112,
    bloodSugarRandom: null,
    sleepHours: 6,
    steps: 6200,
    oxygenLevel: 97,
    heartRate: 78,
  },
  {
    _id: "log-2",
    date: "2026-01-04T08:00:00.000Z",
    createdAt: "2026-01-04T08:00:00.000Z",
    updatedAt: "2026-01-04T08:00:00.000Z",
    weight: 79,
    bmi: 26.6,
    bloodPressureSystolic: 136,
    bloodPressureDiastolic: 86,
    bloodSugarFasting: 118,
    bloodSugarRandom: null,
    sleepHours: 5.5,
    steps: 5400,
    oxygenLevel: 96,
    heartRate: 80,
  },
  {
    _id: "log-3",
    date: "2026-01-02T08:00:00.000Z",
    createdAt: "2026-01-02T08:00:00.000Z",
    updatedAt: "2026-01-02T08:00:00.000Z",
    weight: 80,
    bmi: 27.1,
    bloodPressureSystolic: 138,
    bloodPressureDiastolic: 88,
    bloodSugarFasting: 120,
    bloodSugarRandom: null,
    sleepHours: 5,
    steps: 5000,
    oxygenLevel: 95,
    heartRate: 82,
  },
  {
    _id: "log-4",
    date: "2025-12-30T08:00:00.000Z",
    createdAt: "2025-12-30T08:00:00.000Z",
    updatedAt: "2025-12-30T08:00:00.000Z",
    weight: 81,
    bmi: 27.4,
    bloodPressureSystolic: 140,
    bloodPressureDiastolic: 90,
    bloodSugarFasting: 126,
    bloodSugarRandom: null,
    sleepHours: 4.8,
    steps: 4200,
    oxygenLevel: 95,
    heartRate: 84,
  },
];

const reportAnalysisMock = {
  reportCount: 2,
  lastReportDate: "2026-01-05T08:00:00.000Z",
  signals: [
    {
      key: "cbc",
      title: "CBC trend requires monitoring",
      recommendation: "Repeat CBC in 4 weeks."
    }
  ],
  recommendations: [
    "Review latest report findings with your physician."
  ]
};

module.exports = {
  vitalsHistory,
  reportAnalysisMock,
};
