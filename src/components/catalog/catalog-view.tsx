"use client";

import React from "react";
import { SearchX } from "lucide-react";
import { EnrichedParcel } from "@/lib/types";
import { groupDealsByAuction } from "@/hooks/use-deals";
import { DealGroup } from "./deal-group";

interface CatalogViewProps {
  deals: EnrichedParcel[];
  savedIds: Set<string>;
  onToggleSave: (parcelId: string) => void;
}

export function CatalogView({ deals, savedIds, onToggleSave }: CatalogViewProps) {
  const groups = groupDealsByAuction(deals);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No deals to display</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file to get started, or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <DealGroup
          key={group.key}
          group={group}
          savedIds={savedIds}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
