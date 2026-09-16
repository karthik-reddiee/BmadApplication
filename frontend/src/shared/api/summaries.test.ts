import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentMonthSummary } from "./summaries";

describe("getCurrentMonthSummary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets current month summary from the summary endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        monthStart: "2026-09-01",
        monthEnd: "2026-09-30",
        totalAmount: 205.5,
        categoryBreakdown: [
          {
            categoryId: "10000000-0000-0000-0000-000000000001",
            categoryName: "Food",
            amount: 125.5
          }
        ],
        recentExpenses: []
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentMonthSummary()).resolves.toMatchObject({
      totalAmount: 205.5,
      categoryBreakdown: [
        expect.objectContaining({ categoryName: "Food" })
      ]
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/summaries/current-month");
  });

  it("throws an actionable failure when the summary cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false
    }));

    await expect(getCurrentMonthSummary()).rejects.toThrow("Current month summary could not be loaded. Try refreshing.");
  });
});
