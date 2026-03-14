"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EnrichmentProgressProps {
  completed: number;
  total: number;
  currentAddress: string;
  isRunning: boolean;
}

export function EnrichmentProgress({
  completed,
  total,
  currentAddress,
  isRunning,
}: EnrichmentProgressProps) {
  if (!isRunning && total === 0) return null;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

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
        </div>
      </CardContent>
    </Card>
  );
}
