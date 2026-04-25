const AnalyticsService = require("../../backend/services/AnalyticsService");
const RiskEngineService = require("../../backend/services/RiskEngineService");
const HealthScoreService = require("../../backend/services/HealthScoreService");
const DateUtils = require("../../backend/utils/DateUtils");
const { vitalsHistory, reportAnalysisMock } = require("../mocks/analyticsMockData");

function buildAnalyticsService(history) {
  const vitalsService = {
    getVitalsHistory: jest.fn().mockResolvedValue(history),
  };

  const reportAnalysisService = {
    analyzeUserReports: jest.fn().mockResolvedValue(reportAnalysisMock),
  };

  const analyticsSnapshotModel = {
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
  };

  const service = new AnalyticsService({
    vitalsService,
    riskEngineService: new RiskEngineService(),
    healthScoreService: new HealthScoreService(),
    reportAnalysisService,
    analyticsSnapshotModel,
    dateUtils: DateUtils,
  });

  return {
    service,
    vitalsService,
    reportAnalysisService,
    analyticsSnapshotModel,
  };
}

describe("AnalyticsService", () => {
  test("returns empty analytics when vitals history is missing", async () => {
    const { service, analyticsSnapshotModel } = buildAnalyticsService([]);

    const result = await service.getDashboard("user-1");

    expect(result.healthScore).toBe(0);
    expect(result.trends.weight.direction).toBe("stable");
    expect(result.chartsData.weight).toEqual([]);
    expect(result.summaryInsights).toContain("No vitals history found yet.");
    expect(analyticsSnapshotModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("builds dashboard analytics and persists snapshot", async () => {
    const { service, analyticsSnapshotModel } = buildAnalyticsService(vitalsHistory);

    const result = await service.getDashboard("user-1");

    expect(result.healthScore).toBeGreaterThan(0);
    expect(result.healthScoreBand).toBeDefined();
    expect(result.riskFlags.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.summaryInsights.length).toBeGreaterThan(0);
    expect(result.chartsData.weight.length).toBeGreaterThan(0);
    expect(analyticsSnapshotModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});
