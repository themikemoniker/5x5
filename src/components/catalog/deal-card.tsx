"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, AlertTriangle, Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrichedParcel } from "@/lib/types";
import { formatCurrency, formatPercent, daysUntil, getScoreBadgeColor } from "@/lib/utils";

interface DealCardProps {
  deal: EnrichedParcel;
  isSaved: boolean;
  onToggleSave: (parcelId: string) => void;
}

export function DealCard({ deal, isSaved, onToggleSave }: DealCardProps) {
  const days = daysUntil(deal.auctionDate);
  const hasEnrichment = deal.enrichment && !deal.enrichmentError;

  return (
    <Card
      className={`relative transition-shadow hover:shadow-md ${
        deal.score?.isTopDeal ? "ring-2 ring-green-500" : ""
      }`}
    >
      {deal.score?.isTopDeal && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
          <Star className="h-4 w-4 fill-current" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/deals/${encodeURIComponent(deal.parcelId)}`}
            className="flex-1 min-w-0"
          >
            <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
              {deal.address || "No address"}
            </h3>
            <p className="text-xs text-muted-foreground">{deal.county} County</p>
          </Link>

          <div className="flex items-center gap-1">
            {deal.score && (
              <Badge className={getScoreBadgeColor(deal.score.overall)}>
                {deal.score.overall}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(deal.parcelId);
              }}
            >
              <Bookmark
                className={`h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Lien</span>
            <p className="font-medium">{formatCurrency(deal.lienAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Est. Value</span>
            <p className="font-medium">
              {hasEnrichment && deal.enrichment!.estimatedValue
                ? formatCurrency(deal.enrichment!.estimatedValue)
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">LTV</span>
            <p className="font-medium">
              {deal.score ? formatPercent(deal.score.ltvRatio) : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Type</span>
            <p className="font-medium">
              {deal.enrichment?.propertyType || "Unknown"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {days > 0 ? `${days} days` : days === 0 ? "Today" : "Passed"}
          </div>

          {deal.enrichmentError && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Enrichment failed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
