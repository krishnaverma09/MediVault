const RiskEngineService = require("../../backend/services/RiskEngineService");

describe("RiskEngineService", () => {
  const service = new RiskEngineService();

  test("classifies blood pressure stages correctly", () => {
    expect(service.getBloodPressureStatus(145, 92)).toBe("Stage 2");
    expect(service.getBloodPressureStatus(132, 84)).toBe("Stage 1");
    expect(service.getBloodPressureStatus(122, 78)).toBe("Elevated");
    expect(service.getBloodPressureStatus(118, 76)).toBe("Normal");
  });

  test("classifies sugar risk correctly", () => {
    expect(service.getSugarRisk(128, null)).toBe("High");
    expect(service.getSugarRisk(110, null)).toBe("Prediabetes");
    expect(service.getSugarRisk(90, 120)).toBe("Normal");
  });

  test("builds risk profile with relevant flags", () => {
    const profile = service.generateRiskProfile({
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 92,
      bloodSugarFasting: 132,
      bmi: 31,
      sleepHours: 5,
      steps: 3000,
      oxygenLevel: 92,
      heartRate: 115,
    });

    expect(profile.bloodPressureStatus).toBe("Stage 2");
    expect(profile.sugarRisk).toBe("High");
    expect(profile.bmiCategory).toBe("Obese");
    expect(profile.riskFlags.length).toBeGreaterThan(3);
  });

  test("builds risk indicators for dashboard cards", () => {
    const indicators = service.getRiskIndicators(
      {
        bloodPressureStatus: "Stage 1",
        bmiCategory: "Overweight",
        sugarRisk: "Prediabetes",
      },
      {
        sleepHours: 6,
      }
    );

    expect(indicators).toHaveLength(4);
    expect(indicators[0].key).toBe("bp");
    expect(indicators[1].severity).toBe("warning");
  });
});
