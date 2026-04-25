const DateUtils = require("../../backend/utils/DateUtils");

describe("DateUtils", () => {
  test("average returns null for empty and numeric average for values", () => {
    expect(DateUtils.average([])).toBeNull();
    expect(DateUtils.average([10, 20, null, 30])).toBe(20);
  });

  test("splitRecentAndPrevious separates windows correctly", () => {
    const data = [
      { date: "2026-01-01", value: 1 },
      { date: "2026-01-02", value: 2 },
      { date: "2026-01-03", value: 3 },
      { date: "2026-01-04", value: 4 },
      { date: "2026-01-05", value: 5 },
      { date: "2026-01-06", value: 6 },
    ];

    const { recent, previous } = DateUtils.splitRecentAndPrevious(data, 3);

    expect(recent).toHaveLength(3);
    expect(previous).toHaveLength(3);
    expect(recent[0].value).toBe(4);
    expect(previous[0].value).toBe(1);
  });

  test("detectDirection compares recent and previous averages", () => {
    expect(DateUtils.detectDirection(10, 10.05, 0.1)).toBe("stable");
    expect(DateUtils.detectDirection(12, 10, 0.1)).toBe("up");
    expect(DateUtils.detectDirection(8, 10, 0.1)).toBe("down");
  });

  test("round returns null for non-number values", () => {
    expect(DateUtils.round(undefined)).toBeNull();
    expect(DateUtils.round(12.3456, 2)).toBe(12.35);
  });
});
