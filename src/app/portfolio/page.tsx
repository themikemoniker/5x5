"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PortfolioEntry,
  PortfolioSummary,
  EnrichedParcel,
  LienStatus,
  LIEN_STATUS_LABELS,
  LIEN_STATUS_COLORS,
} from "@/lib/types";
import { getAllPortfolioEntries, getAllDeals } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";

function computeSummary(
  entries: PortfolioEntry[]
): PortfolioSummary {
  let totalInvested = 0;
  let totalReturned = 0;
  let activeLiens = 0;
  let redeemedLiens = 0;
  let foreclosedLiens = 0;
  let writtenOffLiens = 0;
  let totalHoldDays = 0;
  let closedCount = 0;

  for (const e of entries) {
    if (e.purchasePrice) {
      totalInvested += e.purchasePrice;
    }
    if (e.redemptionAmount) {
      totalReturned += e.redemptionAmount;
    }

    switch (e.status) {
      case "purchased":
      case "watching":
        activeLiens++;
        break;
      case "redeemed":
        redeemedLiens++;
        if (e.purchaseDate && e.redemptionDate) {
          const days = Math.round(
            (new Date(e.redemptionDate).getTime() - new Date(e.purchaseDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          totalHoldDays += days;
          closedCount++;
        }
        break;
      case "foreclosed":
        foreclosedLiens++;
        break;
      case "written_off":
        writtenOffLiens++;
        break;
    }
  }

  const totalROI = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0;
  const avgHoldDays = closedCount > 0 ? Math.round(totalHoldDays / closedCount) : 0;

  return {
    totalInvested,
    totalReturned,
    totalROI,
    activeLiens,
    redeemedLiens,
    foreclosedLiens,
    writtenOffLiens,
    avgHoldDays,
  };
}

type StatusFilter = "all" | LienStatus;

export default function PortfolioPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [deals, setDeals] = useState<EnrichedParcel[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    setEntries(getAllPortfolioEntries());
    setDeals(getAllDeals());
  }, []);

  const dealsMap = useMemo(() => {
    const map = new Map<string, EnrichedParcel>();
    for (const d of deals) {
      map.set(d.parcelId, d);
    }
    return map;
  }, [deals]);

  const summary = useMemo(() => computeSummary(entries), [entries]);

  const filteredEntries = useMemo(() => {
    if (statusFilter === "all") return entries;
    return entries.filter((e) => e.status === statusFilter);
  }, [entries, statusFilter]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredEntries]);

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `All (${entries.length})` },
    ...( ["watching", "purchased", "redeemed", "foreclosed", "written_off"] as LienStatus[]).map(
      (s) => ({
        value: s as StatusFilter,
        label: `${LIEN_STATUS_LABELS[s]} (${entries.filter((e) => e.status === s).length})`,
      })
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8" />
            Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your purchased liens, returns, and overall performance.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No portfolio entries yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add deals to your portfolio from the deal detail page.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Browse Catalog
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Total Invested
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Total Returned
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalReturned)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Portfolio ROI
                </div>
                <p className={`text-2xl font-bold ${summary.totalROI >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summary.totalROI >= 0 ? "+" : ""}{summary.totalROI.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Avg Hold Time
                </div>
                <p className="text-2xl font-bold">
                  {summary.avgHoldDays > 0 ? `${summary.avgHoldDays}d` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Active: {summary.activeLiens}</span>
            <span className="text-green-600">Redeemed: {summary.redeemedLiens}</span>
            <span className="text-purple-600">Foreclosed: {summary.foreclosedLiens}</span>
            {summary.writtenOffLiens > 0 && (
              <span className="text-red-600">Written Off: {summary.writtenOffLiens}</span>
            )}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Entries list */}
          <div className="space-y-3">
            {sortedEntries.map((entry) => {
              const deal = dealsMap.get(entry.parcelId);
              const roi =
                entry.purchasePrice && entry.redemptionAmount
                  ? ((entry.redemptionAmount - entry.purchasePrice) / entry.purchasePrice) * 100
                  : null;

              return (
                <Card
                  key={entry.parcelId}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => router.push(`/deals/${encodeURIComponent(entry.parcelId)}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={LIEN_STATUS_COLORS[entry.status]}>
                            {LIEN_STATUS_LABELS[entry.status]}
                          </Badge>
                          {roi !== null && (
                            <Badge
                              className={
                                roi >= 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% ROI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {deal?.address || entry.parcelId}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {deal && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {deal.county}, {deal.state}
                            </span>
                          )}
                          {entry.purchasePrice !== null && (
                            <span>Paid: {formatCurrency(entry.purchasePrice)}</span>
                          )}
                          {entry.purchaseDate && <span>on {entry.purchaseDate}</span>}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {deal?.enrichment?.estimatedValue && (
                          <p className="text-sm font-medium">
                            {formatCurrency(deal.enrichment.estimatedValue)}
                          </p>
                        )}
                        {deal?.lienAmount && (
                          <p className="text-xs text-muted-foreground">
                            Lien: {formatCurrency(deal.lienAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
