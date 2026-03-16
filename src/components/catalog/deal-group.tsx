"use client";

import React from "react";
import { Calendar, MapPin } from "lucide-react";
import { AuctionGroup } from "@/lib/types";
import { DealCard } from "./deal-card";
import { daysUntil } from "@/lib/utils";

interface DealGroupProps {
  group: AuctionGroup;
  savedIds: Set<string>;
  onToggleSave: (parcelId: string) => void;
}

export function DealGroup({ group, savedIds, onToggleSave }: DealGroupProps) {
  const days = daysUntil(group.auctionDate);
  const formattedDate = new Date(group.auctionDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              {group.county} County, {group.state}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {group.deals.length} deals
            {days > 0 && ` · ${days} days away`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.deals.map((deal) => (
          <DealCard
            key={deal.parcelId}
            deal={deal}
            isSaved={savedIds.has(deal.parcelId)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>
    </div>
  );
}
