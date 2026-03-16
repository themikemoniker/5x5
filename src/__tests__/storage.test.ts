import { describe, it, expect, beforeEach } from "vitest";
import {
  storeDeals,
  getDeals,
  getAllDeals,
  getSavedParcelIds,
  toggleSavedParcel,
  isParcelSaved,
  clearAllData,
} from "@/lib/storage";
import { EnrichedParcel } from "@/lib/types";

function makeDeal(id: string): EnrichedParcel {
  return {
    parcelId: id,
    address: `${id} Main St`,
    ownerName: "Test",
    lienAmount: 5000,
    auctionDate: "2025-06-15",
    county: "Marion",
    state: "IN",
    enrichment: null,
    enrichmentError: false,
    score: null,
  };
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("storeDeals / getDeals", () => {
    it("stores and retrieves deals by auction ID", () => {
      const deals = [makeDeal("1"), makeDeal("2")];
      storeDeals("auction-1", deals);

      const retrieved = getDeals("auction-1");
      expect(retrieved).toHaveLength(2);
      expect(retrieved![0].parcelId).toBe("1");
    });

    it("returns null for non-existent auction ID", () => {
      expect(getDeals("nonexistent")).toBeNull();
    });

    it("stores multiple auctions", () => {
      storeDeals("auction-1", [makeDeal("1")]);
      storeDeals("auction-2", [makeDeal("2")]);

      expect(getDeals("auction-1")).toHaveLength(1);
      expect(getDeals("auction-2")).toHaveLength(1);
    });
  });

  describe("getAllDeals", () => {
    it("returns all deals across auctions", () => {
      storeDeals("auction-1", [makeDeal("1"), makeDeal("2")]);
      storeDeals("auction-2", [makeDeal("3")]);

      const all = getAllDeals();
      expect(all).toHaveLength(3);
    });

    it("returns empty array when no deals stored", () => {
      expect(getAllDeals()).toHaveLength(0);
    });
  });

  describe("saved parcels", () => {
    it("starts with no saved parcels", () => {
      expect(getSavedParcelIds().size).toBe(0);
    });

    it("toggles a parcel as saved", () => {
      toggleSavedParcel("1");
      expect(isParcelSaved("1")).toBe(true);
    });

    it("toggles a parcel as unsaved", () => {
      toggleSavedParcel("1");
      toggleSavedParcel("1");
      expect(isParcelSaved("1")).toBe(false);
    });

    it("tracks multiple saved parcels", () => {
      toggleSavedParcel("1");
      toggleSavedParcel("2");
      toggleSavedParcel("3");

      const saved = getSavedParcelIds();
      expect(saved.size).toBe(3);
      expect(saved.has("1")).toBe(true);
      expect(saved.has("2")).toBe(true);
      expect(saved.has("3")).toBe(true);
    });
  });

  describe("clearAllData", () => {
    it("clears all stored data", () => {
      storeDeals("auction-1", [makeDeal("1")]);
      toggleSavedParcel("1");

      clearAllData();

      expect(getAllDeals()).toHaveLength(0);
      expect(getSavedParcelIds().size).toBe(0);
    });
  });
});
