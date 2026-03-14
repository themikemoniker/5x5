import { describe, it, expect } from "vitest";
import {
  calculateDealScore,
  calculateLtvScore,
  calculateValueBufferScore,
  getPropertyTypeScore,
  scoreParcel,
} from "@/lib/scoring";
import { EnrichedParcel } from "@/lib/types";

describe("getPropertyTypeScore", () => {
  it("returns 100 for SFR", () => {
    expect(getPropertyTypeScore("SFR")).toBe(100);
  });

  it("returns 60 for Condo", () => {
    expect(getPropertyTypeScore("Condo")).toBe(60);
  });

  it("returns 30 for Vacant Land", () => {
    expect(getPropertyTypeScore("Vacant Land")).toBe(30);
  });

  it("returns 0 for Commercial", () => {
    expect(getPropertyTypeScore("Commercial")).toBe(0);
  });

  it("returns 20 for Unknown", () => {
    expect(getPropertyTypeScore("Unknown")).toBe(20);
  });
});

describe("calculateLtvScore", () => {
  it("returns 100 for LTV of 0", () => {
    expect(calculateLtvScore(0)).toBe(100);
  });

  it("returns 0 for LTV of 1", () => {
    expect(calculateLtvScore(1)).toBe(0);
  });

  it("returns 0 for LTV above 1", () => {
    expect(calculateLtvScore(1.5)).toBe(0);
  });

  it("returns 75 for LTV of 0.25", () => {
    expect(calculateLtvScore(0.25)).toBe(75);
  });

  it("returns 50 for LTV of 0.5", () => {
    expect(calculateLtvScore(0.5)).toBe(50);
  });
});

describe("calculateValueBufferScore", () => {
  it("returns 0 when estimated value is 0", () => {
    expect(calculateValueBufferScore(5000, 0)).toBe(0);
  });

  it("returns buffer percentage capped at 100", () => {
    expect(calculateValueBufferScore(200000, 100000)).toBe(100);
  });

  it("returns correct percentage for moderate buffer", () => {
    expect(calculateValueBufferScore(50000, 100000)).toBe(50);
  });
});

describe("calculateDealScore", () => {
  it("returns null when estimated value is null", () => {
    expect(calculateDealScore(5000, null, "SFR")).toBeNull();
  });

  it("returns null when estimated value is 0", () => {
    expect(calculateDealScore(5000, 0, "SFR")).toBeNull();
  });

  it("calculates a high score for a great SFR deal", () => {
    // Lien: $5,000, Value: $100,000 -> LTV = 0.05
    const score = calculateDealScore(5000, 100000, "SFR");
    expect(score).not.toBeNull();
    expect(score!.overall).toBeGreaterThanOrEqual(75);
    expect(score!.isTopDeal).toBe(true);
    expect(score!.ltvRatio).toBeCloseTo(0.05);
    expect(score!.valueBuffer).toBe(95000);
  });

  it("calculates a low score for a bad deal", () => {
    // Lien: $80,000, Value: $90,000 -> LTV = 0.89
    const score = calculateDealScore(80000, 90000, "Vacant Land");
    expect(score).not.toBeNull();
    expect(score!.overall).toBeLessThan(40);
    expect(score!.isTopDeal).toBe(false);
  });

  it("flags as top deal when score >= 75 and LTV <= 0.25", () => {
    const score = calculateDealScore(10000, 100000, "SFR");
    expect(score!.isTopDeal).toBe(true);
  });

  it("does not flag as top deal when LTV > 0.25 even if score is high", () => {
    // LTV = 0.3, SFR, decent buffer — might score high but LTV disqualifies
    const score = calculateDealScore(30000, 100000, "SFR");
    if (score!.overall >= 75) {
      expect(score!.isTopDeal).toBe(false);
    }
  });

  it("correctly computes weighted composite", () => {
    // Lien: $10,000, Value: $100,000, SFR
    // LTV = 0.1 -> ltvScore = 90
    // Buffer = $90,000 / $100,000 = 90% -> bufferScore = 90
    // propTypeScore = 100
    // overall = 90*0.5 + 90*0.3 + 100*0.2 = 45 + 27 + 20 = 92
    const score = calculateDealScore(10000, 100000, "SFR");
    expect(score!.overall).toBe(92);
  });
});

describe("scoreParcel", () => {
  const baseParcel: EnrichedParcel = {
    parcelId: "test-1",
    address: "123 Main St",
    ownerName: "John Doe",
    lienAmount: 5000,
    auctionDate: "2025-06-15",
    county: "Marion",
    enrichment: {
      estimatedValue: 100000,
      propertyType: "SFR",
      lastSalePrice: 80000,
      lastSaleDate: "2020-01-01",
    },
    enrichmentError: false,
    score: null,
  };

  it("scores a parcel with valid enrichment", () => {
    const result = scoreParcel(baseParcel);
    expect(result.score).not.toBeNull();
    expect(result.score!.overall).toBeGreaterThan(0);
  });

  it("returns null score when enrichment is null", () => {
    const result = scoreParcel({ ...baseParcel, enrichment: null });
    expect(result.score).toBeNull();
  });

  it("returns null score when enrichment failed", () => {
    const result = scoreParcel({ ...baseParcel, enrichmentError: true });
    expect(result.score).toBeNull();
  });
});
