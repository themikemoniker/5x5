"use client";

import React from "react";
import { Loader2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EnrichmentStats } from "@/services/attom";

interface EnrichmentProgressProps {
  completed: number;
  total: number;
  currentAddress: string;
  isRunning: boolean;
  stats?: EnrichmentStats;
}

export function EnrichmentProgress({
  completed,
  total,
  currentAddress,
  isRunning,
  stats,
}: EnrichmentProgressProps) {
  if (!isRunning && total === 0) return null;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const showCacheStats = stats && (stats.cached > 0 || !isRunning);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRunning ? "Enriching parcels..." : "Enrichment complete"}
            </span>
            <span className="text-muted-foreground">
              {completed} / {total}
            </span>
          </div>
          <Progress value={percent} />
          {isRunning && currentAddress && (
            <p className="text-xs text-muted-foreground truncate">
              Processing: {currentAddress}
            </p>
          )}
          {showCacheStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                {stats.cached} cached
              </span>
              <span>{stats.fetched} fetched</span>
              {stats.failed > 0 && (
                <span className="text-destructive">{stats.failed} failed</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
