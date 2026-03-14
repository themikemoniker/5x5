"use client";

import React from "react";
import { DealScore } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

interface ScoreBreakdownProps {
  score: DealScore;
}

const WEIGHT_LABELS = [
  { key: "ltv", label: "LTV Ratio", weight: "50%", format: (s: DealScore) => formatPercent(s.ltvRatio) },
  { key: "valueBuffer", label: "Value Buffer", weight: "30%", format: (s: DealScore) => `$${s.valueBuffer.toLocaleString()}` },
  { key: "propertyType", label: "Property Type", weight: "20%", format: (s: DealScore) => `${s.propertyTypeScore}/100` },
] as const;

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{score.overall}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>

          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                score.overall >= 75
                  ? "bg-green-500"
                  : score.overall >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${score.overall}%` }}
            />
          </div>

          <div className="space-y-3 pt-2">
            {WEIGHT_LABELS.map(({ key, label, weight, format }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground ml-2">({weight})</span>
                </div>
                <span className="font-mono">{format(score)}</span>
              </div>
            ))}
          </div>

          {score.isTopDeal && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 font-medium text-center">
              Top Deal — Score {">"}= 75 and LTV {"<"}= 25%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
