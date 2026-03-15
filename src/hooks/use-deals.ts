"use client";

import { useState, useCallback, useEffect } from "react";
import { EnrichedParcel, RawParcel, FilterState, AuctionGroup, DEFAULT_FILTERS } from "@/lib/types";
import { scoreParcel } from "@/lib/scoring";
import { enrichParcelsWithProgress, EnrichmentStats } from "@/services/attom";
import { storeDeals, getAllDeals } from "@/lib/storage";

interface EnrichmentProgress {
  completed: number;
  total: number;
  currentAddress: string;
  isRunning: boolean;
  stats: EnrichmentStats;
}

export function useDeals() {
  const [deals, setDeals] = useState<EnrichedParcel[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress>({
    completed: 0,
    total: 0,
    currentAddress: "",
    isRunning: false,
    stats: { cached: 0, fetched: 0, failed: 0 },
  });

  // Load deals from localStorage on mount
  useEffect(() => {
    const stored = getAllDeals();
    if (stored.length > 0) {
      setDeals(stored);
    }
  }, []);

  const runEnrichment = useCallback(
    async (parcelsToEnrich: Array<{ address: string; index: number }>, totalForProgress: number) => {
      setEnrichmentProgress({
        completed: 0,
        total: totalForProgress,
        currentAddress: "",
        isRunning: true,
        stats: { cached: 0, fetched: 0, failed: 0 },
      });

      await enrichParcelsWithProgress(
        parcelsToEnrich,
        (completed, total, currentAddress, stats) => {
          setEnrichmentProgress({ completed, total, currentAddress, isRunning: completed < total, stats });
        },
        (index, result, error) => {
          setDeals((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                enrichment: result,
                enrichmentError: error,
              };
              updated[index] = scoreParcel(updated[index]);
            }
            return updated;
          });
        }
      );

      // Store to localStorage after enrichment
      setDeals((prev) => {
        storeDeals(`batch-${Date.now()}`, prev);
        return prev;
      });
    },
    []
  );

  const importParcels = useCallback(
    async (rawParcels: RawParcel[]) => {
      // Initialize enriched parcels with null enrichment
      const initial: EnrichedParcel[] = rawParcels.map((p) => ({
        ...p,
        enrichment: null,
        enrichmentError: false,
        score: null,
      }));

      const startIndex = deals.length;
      setDeals((prev) => [...prev, ...initial]);

      const parcelsToEnrich = rawParcels.map((p, i) => ({
        address: p.address,
        index: startIndex + i,
      }));

      await runEnrichment(parcelsToEnrich, rawParcels.length);
    },
    [deals.length, runEnrichment]
  );

  const retryFailed = useCallback(async () => {
    const failedParcels = deals
      .map((deal, index) => ({ deal, index }))
      .filter(({ deal }) => deal.enrichmentError);

    if (failedParcels.length === 0) return;

    const parcelsToEnrich = failedParcels.map(({ deal, index }) => ({
      address: deal.address,
      index,
    }));

    // Reset error state for failed parcels
    setDeals((prev) => {
      const updated = [...prev];
      for (const { index } of failedParcels) {
        if (updated[index]) {
          updated[index] = { ...updated[index], enrichmentError: false };
        }
      }
      return updated;
    });

    await runEnrichment(parcelsToEnrich, failedParcels.length);
  }, [deals, runEnrichment]);

  const clearDeals = useCallback(() => {
    setDeals([]);
  }, []);

  const failedCount = deals.filter((d) => d.enrichmentError).length;

  return {
    deals,
    filters,
    setFilters,
    importParcels,
    clearDeals,
    enrichmentProgress,
    retryFailed,
    failedCount,
  };
}

export function filterDeals(
  deals: EnrichedParcel[],
  filters: FilterState,
  savedIds: Set<string>
): EnrichedParcel[] {
  return deals.filter((deal) => {
    if (filters.savedOnly && !savedIds.has(deal.parcelId)) return false;

    if (filters.counties.length > 0 && !filters.counties.includes(deal.county)) return false;

    if (filters.sfrOnly && deal.enrichment?.propertyType !== "SFR") return false;

    if (
      filters.propertyTypes.length > 0 &&
      deal.enrichment &&
      !filters.propertyTypes.includes(deal.enrichment.propertyType)
    )
      return false;

    if (deal.lienAmount > filters.maxLienAmount) return false;

    if (filters.minDealScore > 0 && (deal.score?.overall ?? 0) < filters.minDealScore) return false;

    if (filters.auctionDateStart && deal.auctionDate < filters.auctionDateStart) return false;
    if (filters.auctionDateEnd && deal.auctionDate > filters.auctionDateEnd) return false;

    return true;
  });
}

export function groupDealsByAuction(deals: EnrichedParcel[]): AuctionGroup[] {
  const groups = new Map<string, AuctionGroup>();

  for (const deal of deals) {
    const key = `${deal.state}-${deal.county}-${deal.auctionDate}`;
    if (!groups.has(key)) {
      groups.set(key, {
        county: deal.county,
        state: deal.state,
        auctionDate: deal.auctionDate,
        key,
        deals: [],
      });
    }
    groups.get(key)!.deals.push(deal);
  }

  const result = Array.from(groups.values());

  // Sort deals within each group by score descending
  for (const group of result) {
    group.deals.sort((a, b) => (b.score?.overall ?? -1) - (a.score?.overall ?? -1));
  }

  return result.sort((a, b) => a.auctionDate.localeCompare(b.auctionDate));
}
