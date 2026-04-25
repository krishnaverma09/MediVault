const HealthScoreService = require("../../backend/services/HealthScoreService");

describe("HealthScoreService", () => {
  const service = new HealthScoreService();

  test("clamps score inside 0-100 range", () => {
    expect(service.clampScore(104.6)).toBe(100);
    expect(service.clampScore(-12)).toBe(0);
    expect(service.clampScore(84.4)).toBe(84);
  });

  test("calculates lower score for high risk profile", () => {
    const score = service.calculateHealthScore({
      latestVitals: {
        sleepHours: 4,
        steps: 2500,
        oxygenLevel: 92,
        heartRate: 112,
      },
      historyCount: 2,
      riskProfile: {
        bmiCategory: "Obese",
        bloodPressureStatus: "Stage 2",
        sugarRisk: "High",
      },
    });

    expect(score).toBeLessThan(55);
    expect(service.getScoreBand(score)).toBe("Needs Attention");
  });

  test("rewards healthier profile", () => {
    const score = service.calculateHealthScore({
      latestVitals: {
        sleepHours: 8,
        steps: 11000,
        oxygenLevel: 98,
        heartRate: 72,
      },
      historyCount: 10,
      riskProfile: {
        bmiCategory: "Healthy",
        bloodPressureStatus: "Normal",
        sugarRisk: "Normal",
      },
    });

    expect(score).toBeGreaterThanOrEqual(85);
    expect(service.getScoreBand(score)).toBe("Excellent");
  });
});
