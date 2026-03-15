"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "@/components/deal-profile/score-breakdown";
import { PropertyDetails } from "@/components/deal-profile/property-details";
import { EnrichedParcel, STATE_LABELS } from "@/lib/types";
import { getAllDeals } from "@/lib/storage";
import { isParcelSaved, toggleSavedParcel } from "@/lib/storage";
import { getScoreBadgeColor } from "@/lib/utils";

export default function DealProfilePage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = decodeURIComponent(params.parcelId as string);

  const [deal, setDeal] = useState<EnrichedParcel | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deals = getAllDeals();
    const found = deals.find((d) => d.parcelId === parcelId);
    setDeal(found || null);
    setSaved(isParcelSaved(parcelId));
    setLoading(false);
  }, [parcelId]);

  const handleToggleSave = () => {
    toggleSavedParcel(parcelId);
    setSaved(!saved);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Deal not found</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
      </div>
    );
  }

  const stateName = STATE_LABELS[deal.state] || deal.state;
  const mapsQuery = encodeURIComponent(
    `${deal.address}, ${deal.county} County, ${stateName}`
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Catalog
          </Button>
          <h1 className="text-2xl font-bold">{deal.address || "No Address"}</h1>
          <p className="text-muted-foreground">
            {deal.county} County, {stateName} — Parcel {deal.parcelId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {deal.score && (
            <Badge className={`text-lg px-3 py-1 ${getScoreBadgeColor(deal.score.overall)}`}>
              {deal.score.overall}
            </Badge>
          )}
          <Button
            variant={saved ? "default" : "outline"}
            onClick={handleToggleSave}
          >
            <Bookmark className={`h-4 w-4 mr-2 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {deal.enrichmentError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          Enrichment failed for this parcel. Some data may be unavailable.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PropertyDetails deal={deal} />
        {deal.score && <ScoreBreakdown score={deal.score} />}
      </div>

      {/* Google Maps Embed */}
      {deal.address && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapsQuery}`}
            title="Property Location"
          />
        </div>
      )}
    </div>
  );
}
