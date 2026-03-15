import { describe, it, expect } from "vitest";
import { filterDeals, groupDealsByAuction } from "@/hooks/use-deals";
import { EnrichedParcel, FilterState, DEFAULT_FILTERS } from "@/lib/types";

function makeDeal(overrides: Partial<EnrichedParcel> = {}): EnrichedParcel {
  return {
    parcelId: "test-1",
    address: "123 Main St",
    ownerName: "John Doe",
    lienAmount: 5000,
    auctionDate: "2025-06-15",
    county: "Marion",
    state: "IN",
    enrichment: {
      estimatedValue: 100000,
      propertyType: "SFR",
      lastSalePrice: 80000,
      lastSaleDate: "2020-01-01",
    },
    enrichmentError: false,
    score: {
      overall: 90,
      ltvRatio: 0.05,
      valueBuffer: 95000,
      propertyTypeScore: 100,
      isTopDeal: true,
    },
    ...overrides,
  };
}

describe("filterDeals", () => {
  const deals: EnrichedParcel[] = [
    makeDeal({ parcelId: "1", county: "Marion", lienAmount: 5000 }),
    makeDeal({
      parcelId: "2",
      county: "Hamilton",
      lienAmount: 20000,
      enrichment: {
        estimatedValue: 50000,
        propertyType: "Condo",
        lastSalePrice: null,
        lastSaleDate: null,
      },
      score: { overall: 50, ltvRatio: 0.4, valueBuffer: 30000, propertyTypeScore: 60, isTopDeal: false },
    }),
    makeDeal({
      parcelId: "3",
      county: "Marion",
      lienAmount: 40000,
      enrichment: {
        estimatedValue: 45000,
        propertyType: "Vacant Land",
        lastSalePrice: null,
        lastSaleDate: null,
      },
      score: { overall: 20, ltvRatio: 0.89, valueBuffer: 5000, propertyTypeScore: 30, isTopDeal: false },
    }),
  ];

  it("returns all deals with default filters", () => {
    const result = filterDeals(deals, DEFAULT_FILTERS, new Set());
    expect(result).toHaveLength(3);
  });

  it("filters by county", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, counties: ["Marion"] };
    const result = filterDeals(deals, filters, new Set());
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.county === "Marion")).toBe(true);
  });

  it("filters SFR only", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, sfrOnly: true };
    const result = filterDeals(deals, filters, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].enrichment!.propertyType).toBe("SFR");
  });

  it("filters by max lien amount", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, maxLienAmount: 10000 };
    const result = filterDeals(deals, filters, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].lienAmount).toBeLessThanOrEqual(10000);
  });

  it("filters by min deal score", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, minDealScore: 75 };
    const result = filterDeals(deals, filters, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].score!.overall).toBeGreaterThanOrEqual(75);
  });

  it("filters saved only", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, savedOnly: true };
    const savedIds = new Set(["2"]);
    const result = filterDeals(deals, filters, savedIds);
    expect(result).toHaveLength(1);
    expect(result[0].parcelId).toBe("2");
  });

  it("combines multiple filters", () => {
    const filters: FilterState = {
      ...DEFAULT_FILTERS,
      counties: ["Marion"],
      maxLienAmount: 10000,
    };
    const result = filterDeals(deals, filters, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].parcelId).toBe("1");
  });
});

describe("groupDealsByAuction", () => {
  it("groups deals by county and auction date", () => {
    const deals = [
      makeDeal({ parcelId: "1", county: "Marion", auctionDate: "2025-06-15" }),
      makeDeal({ parcelId: "2", county: "Marion", auctionDate: "2025-06-15" }),
      makeDeal({ parcelId: "3", county: "Hamilton", auctionDate: "2025-07-01" }),
    ];

    const groups = groupDealsByAuction(deals);
    expect(groups).toHaveLength(2);
    expect(groups[0].county).toBe("Marion");
    expect(groups[0].deals).toHaveLength(2);
    expect(groups[1].county).toBe("Hamilton");
    expect(groups[1].deals).toHaveLength(1);
  });

  it("sorts groups by auction date", () => {
    const deals = [
      makeDeal({ parcelId: "1", county: "Hamilton", auctionDate: "2025-07-01" }),
      makeDeal({ parcelId: "2", county: "Marion", auctionDate: "2025-06-15" }),
    ];

    const groups = groupDealsByAuction(deals);
    expect(groups[0].auctionDate).toBe("2025-06-15");
    expect(groups[1].auctionDate).toBe("2025-07-01");
  });

  it("sorts deals within groups by score descending", () => {
    const deals = [
      makeDeal({
        parcelId: "1",
        county: "Marion",
        auctionDate: "2025-06-15",
        score: { overall: 50, ltvRatio: 0.5, valueBuffer: 50000, propertyTypeScore: 100, isTopDeal: false },
      }),
      makeDeal({
        parcelId: "2",
        county: "Marion",
        auctionDate: "2025-06-15",
        score: { overall: 90, ltvRatio: 0.1, valueBuffer: 90000, propertyTypeScore: 100, isTopDeal: true },
      }),
    ];

    const groups = groupDealsByAuction(deals);
    expect(groups[0].deals[0].parcelId).toBe("2");
    expect(groups[0].deals[1].parcelId).toBe("1");
  });

  it("returns empty array for empty input", () => {
    expect(groupDealsByAuction([])).toHaveLength(0);
  });
});
