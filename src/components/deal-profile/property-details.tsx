"use client";

import React from "react";
import { ExternalLink, MapPin, User, DollarSign, Home, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnrichedParcel } from "@/lib/types";
import { formatCurrency, buildCountyAssessorUrl } from "@/lib/utils";

// TODO [R3]: Add portfolio tracking fields (purchase price, status, notes)

interface PropertyDetailsProps {
  deal: EnrichedParcel;
}

export function PropertyDetails({ deal }: PropertyDetailsProps) {
  const details = [
    { icon: MapPin, label: "Address", value: deal.address || "N/A" },
    { icon: User, label: "Owner", value: deal.ownerName },
    { icon: DollarSign, label: "Lien Amount", value: formatCurrency(deal.lienAmount) },
    {
      icon: DollarSign,
      label: "Estimated Value",
      value: deal.enrichment?.estimatedValue
        ? formatCurrency(deal.enrichment.estimatedValue)
        : "N/A",
    },
    { icon: Home, label: "Property Type", value: deal.enrichment?.propertyType || "Unknown" },
    {
      icon: DollarSign,
      label: "Last Sale Price",
      value: deal.enrichment?.lastSalePrice
        ? formatCurrency(deal.enrichment.lastSalePrice)
        : "N/A",
    },
    { icon: Calendar, label: "Last Sale Date", value: deal.enrichment?.lastSaleDate || "N/A" },
    { icon: Calendar, label: "Auction Date", value: deal.auctionDate },
    { icon: MapPin, label: "County", value: `${deal.county} County, Indiana` },
    { icon: Home, label: "Parcel ID", value: deal.parcelId },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Property Details</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a
            href={buildCountyAssessorUrl(deal.county)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            County Assessor
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
