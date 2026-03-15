"use client";

import React, { useMemo } from "react";
import { Gavel, RotateCcw } from "lucide-react";
import { CsvUpload } from "@/components/upload/csv-upload";
import { EnrichmentProgress } from "@/components/upload/enrichment-progress";
import { CatalogView } from "@/components/catalog/catalog-view";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { Button } from "@/components/ui/button";
import { useDeals, filterDeals } from "@/hooks/use-deals";
import { useSavedDeals } from "@/hooks/use-saved-deals";

export default function CatalogPage() {
  const {
    deals,
    filters,
    setFilters,
    importParcels,
    enrichmentProgress,
    retryFailed,
    failedCount,
  } = useDeals();
  const { savedIds, toggleSaved } = useSavedDeals();

  const availableCounties = useMemo(() => {
    const counties = new Set(deals.map((d) => d.county));
    return Array.from(counties).sort();
  }, [deals]);

  const filteredDeals = useMemo(
    () => filterDeals(deals, filters, savedIds),
    [deals, filters, savedIds]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gavel className="h-8 w-8" />
          Tax Lien Catalog
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload county tax sale lists, enrich with property data, and find the best deals.
        </p>
      </div>

      {/* Upload Section */}
      <CsvUpload
        onParsed={importParcels}
        disabled={enrichmentProgress.isRunning}
      />

      {/* Enrichment Progress */}
      <EnrichmentProgress
        {...enrichmentProgress}
      />

      {/* Retry Failed */}
      {failedCount > 0 && !enrichmentProgress.isRunning && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <span className="text-sm text-destructive">
            {failedCount} parcel{failedCount === 1 ? "" : "s"} failed to enrich.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={retryFailed}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry Failed
          </Button>
        </div>
      )}

      {/* Main Content */}
      {deals.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              availableCounties={availableCounties}
            />
          </div>

          {/* Catalog */}
          <div className="flex-1 min-w-0">
            <div className="mb-3 text-sm text-muted-foreground">
              Showing {filteredDeals.length} of {deals.length} deals
            </div>
            <CatalogView
              deals={filteredDeals}
              savedIds={savedIds}
              onToggleSave={toggleSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
