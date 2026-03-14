import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  daysUntil,
  getScoreBadgeColor,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    expect(formatCurrency(5000)).toBe("$5,000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats large amounts", () => {
    expect(formatCurrency(1250000)).toBe("$1,250,000");
  });
});

describe("formatPercent", () => {
  it("formats ratio as percentage", () => {
    expect(formatPercent(0.25)).toBe("25.0%");
  });

  it("formats small ratio", () => {
    expect(formatPercent(0.05)).toBe("5.0%");
  });

  it("formats 100%", () => {
    expect(formatPercent(1)).toBe("100.0%");
  });
});

describe("daysUntil", () => {
  it("returns positive days for future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = daysUntil(future.toISOString().split("T")[0]);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it("returns negative days for past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = daysUntil(past.toISOString().split("T")[0]);
    expect(result).toBeLessThanOrEqual(-4);
  });
});

describe("getScoreBadgeColor", () => {
  it("returns green for scores >= 75", () => {
    expect(getScoreBadgeColor(75)).toContain("green");
    expect(getScoreBadgeColor(100)).toContain("green");
  });

  it("returns yellow for scores 40-74", () => {
    expect(getScoreBadgeColor(40)).toContain("yellow");
    expect(getScoreBadgeColor(74)).toContain("yellow");
  });

  it("returns red for scores < 40", () => {
    expect(getScoreBadgeColor(0)).toContain("red");
    expect(getScoreBadgeColor(39)).toContain("red");
  });
});
