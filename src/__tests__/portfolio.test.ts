import { describe, it, expect, beforeEach } from "vitest";
import {
  getPortfolioEntry,
  getAllPortfolioEntries,
  createPortfolioEntry,
  upsertPortfolioEntry,
  removePortfolioEntry,
  getPortfolioParcelIds,
} from "@/lib/storage";
import {
  buildPortfolioContext,
  calculateConcentrationPenalty,
  scoreParcelWithPortfolio,
  scoreParcel,
} from "@/lib/scoring";
import { EnrichedParcel, PortfolioEntry } from "@/lib/types";

describe("portfolio storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null for non-existent entry", () => {
    expect(getPortfolioEntry("nonexistent")).toBeNull();
  });

  it("creates and retrieves a portfolio entry", () => {
    const entry = createPortfolioEntry("parcel-1", "watching");
    expect(entry.parcelId).toBe("parcel-1");
    expect(entry.status).toBe("watching");

    const retrieved = getPortfolioEntry("parcel-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.status).toBe("watching");
  });

  it("updates an existing entry", () => {
    const entry = createPortfolioEntry("parcel-1", "watching");
    entry.status = "purchased";
    entry.purchasePrice = 5000;
    upsertPortfolioEntry(entry);

    const retrieved = getPortfolioEntry("parcel-1");
    expect(retrieved!.status).toBe("purchased");
    expect(retrieved!.purchasePrice).toBe(5000);
  });

  it("returns all entries", () => {
    createPortfolioEntry("p1", "watching");
    createPortfolioEntry("p2", "purchased");
    createPortfolioEntry("p3", "redeemed");

    const all = getAllPortfolioEntries();
    expect(all).toHaveLength(3);
  });

  it("returns portfolio parcel IDs", () => {
    createPortfolioEntry("p1", "watching");
    createPortfolioEntry("p2", "purchased");

    const ids = getPortfolioParcelIds();
    expect(ids.has("p1")).toBe(true);
    expect(ids.has("p2")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("removes a portfolio entry", () => {
    createPortfolioEntry("p1", "watching");
    removePortfolioEntry("p1");
    expect(getPortfolioEntry("p1")).toBeNull();
    expect(getAllPortfolioEntries()).toHaveLength(0);
  });
});

describe("portfolio-adjusted scoring", () => {
  const makeDeal = (county: string, state: "IN" | "FL" = "IN"): EnrichedParcel => ({
    parcelId: `${county}-1`,
    address: "123 Main St",
    ownerName: "Test",
    lienAmount: 5000,
    auctionDate: "2025-06-15",
    county,
    state,
    enrichment: {
      estimatedValue: 100000,
      propertyType: "SFR",
      lastSalePrice: 80000,
      lastSaleDate: "2020-01-01",
    },
    enrichmentError: false,
    score: null,
  });

  const makeEntry = (parcelId: string, purchasePrice: number): PortfolioEntry => ({
    parcelId,
    status: "purchased",
    purchasePrice,
    purchaseDate: "2025-01-01",
    redemptionDate: null,
    redemptionAmount: null,
    interestRate: 10,
    notes: "",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  });

  it("returns zero penalty with no portfolio", () => {
    const context = buildPortfolioContext([], []);
    expect(calculateConcentrationPenalty("Marion", "IN", context)).toBe(0);
  });

  it("returns zero penalty below 30% concentration", () => {
    const deals = [makeDeal("Marion"), makeDeal("Allen"), makeDeal("Vigo"), makeDeal("Howard")];
    const entries = [
      makeEntry("Marion-1", 2000),
      makeEntry("Allen-1", 3000),
      makeEntry("Vigo-1", 3000),
      makeEntry("Howard-1", 2000),
    ];
    const context = buildPortfolioContext(entries, deals);

    // Marion = 2000/10000 = 20% < 30%
    expect(calculateConcentrationPenalty("Marion", "IN", context)).toBe(0);
  });

  it("applies penalty above 30% concentration", () => {
    const deals = [makeDeal("Marion"), makeDeal("Allen")];
    const entries = [
      makeEntry("Marion-1", 8000),
      makeEntry("Allen-1", 2000),
    ];
    const context = buildPortfolioContext(entries, deals);

    // Marion = 8000/10000 = 80%, penalty = ((0.8 - 0.3) / 0.7) * 15 ≈ 11
    const penalty = calculateConcentrationPenalty("Marion", "IN", context);
    expect(penalty).toBeGreaterThan(0);
    expect(penalty).toBeLessThanOrEqual(15);
  });

  it("applies full penalty at 100% concentration", () => {
    const deals = [makeDeal("Marion")];
    const entries = [makeEntry("Marion-1", 10000)];
    const context = buildPortfolioContext(entries, deals);

    expect(calculateConcentrationPenalty("Marion", "IN", context)).toBe(15);
  });

  it("adjusts parcel score with portfolio context", () => {
    const deal = makeDeal("Marion");
    const deals = [deal];
    const entries = [makeEntry("Marion-1", 10000)];
    const context = buildPortfolioContext(entries, deals);

    // First verify base score without portfolio
    const baseScored = scoreParcel(deal);
    const baseOverall = baseScored.score!.overall;

    const adjusted = scoreParcelWithPortfolio(deal, context);
    const penalty = calculateConcentrationPenalty("Marion", "IN", context);

    // Score should be reduced by concentration penalty
    expect(penalty).toBe(15);
    expect(adjusted.score!.overall).toBe(baseOverall - penalty);
    expect(adjusted.score!.overall).toBeLessThan(baseOverall);
  });

  it("skips written_off entries in context building", () => {
    const deals = [makeDeal("Marion")];
    const entries: PortfolioEntry[] = [{
      ...makeEntry("Marion-1", 10000),
      status: "written_off",
    }];
    const context = buildPortfolioContext(entries, deals);

    expect(context.totalInvested).toBe(0);
    expect(calculateConcentrationPenalty("Marion", "IN", context)).toBe(0);
  });
});
