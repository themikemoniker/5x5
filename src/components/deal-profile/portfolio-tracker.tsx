"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PortfolioEntry,
  LienStatus,
  LIEN_STATUS_LABELS,
  LIEN_STATUS_COLORS,
} from "@/lib/types";
import {
  getPortfolioEntry,
  createPortfolioEntry,
  upsertPortfolioEntry,
  removePortfolioEntry,
} from "@/lib/storage";
import { Badge } from "@/components/ui/badge";

interface PortfolioTrackerProps {
  parcelId: string;
}

export function PortfolioTracker({ parcelId }: PortfolioTrackerProps) {
  const [entry, setEntry] = useState<PortfolioEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PortfolioEntry | null>(null);

  useEffect(() => {
    const existing = getPortfolioEntry(parcelId);
    setEntry(existing);
  }, [parcelId]);

  const handleAdd = () => {
    const newEntry = createPortfolioEntry(parcelId, "watching");
    setEntry(newEntry);
    setDraft(newEntry);
    setEditing(true);
  };

  const handleEdit = () => {
    setDraft(entry ? { ...entry } : null);
    setEditing(true);
  };

  const handleSave = () => {
    if (!draft) return;
    upsertPortfolioEntry(draft);
    setEntry({ ...draft });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(null);
    setEditing(false);
    // If we just created it and cancelled, remove it
    if (entry?.status === "watching" && !entry.purchasePrice && !entry.notes) {
      removePortfolioEntry(parcelId);
      setEntry(null);
    }
  };

  const handleRemove = () => {
    removePortfolioEntry(parcelId);
    setEntry(null);
    setDraft(null);
    setEditing(false);
  };

  const updateDraft = (updates: Partial<PortfolioEntry>) => {
    if (!draft) return;
    setDraft({ ...draft, ...updates });
  };

  const statuses: LienStatus[] = ["watching", "purchased", "redeemed", "foreclosed", "written_off"];

  if (!entry && !editing) {
    return (
      <Card>
        <CardContent className="py-6">
          <Button variant="outline" className="w-full" onClick={handleAdd}>
            <Briefcase className="h-4 w-4 mr-2" />
            Add to Portfolio
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (editing && draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Portfolio Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateDraft({ status: s })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    draft.status === s
                      ? LIEN_STATUS_COLORS[s]
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {LIEN_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Purchase details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Purchase Price</label>
              <Input
                type="number"
                placeholder="$0"
                value={draft.purchasePrice ?? ""}
                onChange={(e) =>
                  updateDraft({ purchasePrice: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Purchase Date</label>
              <Input
                type="date"
                value={draft.purchaseDate ?? ""}
                onChange={(e) => updateDraft({ purchaseDate: e.target.value || null })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Interest rate */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Interest Rate (%)</label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 10"
              value={draft.interestRate ?? ""}
              onChange={(e) =>
                updateDraft({ interestRate: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="mt-1"
            />
          </div>

          {/* Redemption details (show if redeemed) */}
          {(draft.status === "redeemed" || draft.redemptionAmount) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Redemption Amount</label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={draft.redemptionAmount ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      redemptionAmount: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Redemption Date</label>
                <Input
                  type="date"
                  value={draft.redemptionDate ?? ""}
                  onChange={(e) => updateDraft({ redemptionDate: e.target.value || null })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 min-h-[80px] resize-y"
              placeholder="Add notes about this lien..."
              value={draft.notes}
              onChange={(e) => updateDraft({ notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              Cancel
            </Button>
            <Button onClick={handleRemove} size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  if (!entry) return null;

  const roi =
    entry.purchasePrice && entry.redemptionAmount
      ? ((entry.redemptionAmount - entry.purchasePrice) / entry.purchasePrice) * 100
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Portfolio
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleEdit}>
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={LIEN_STATUS_COLORS[entry.status]}>
            {LIEN_STATUS_LABELS[entry.status]}
          </Badge>
          {roi !== null && (
            <Badge className={roi >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% ROI
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {entry.purchasePrice !== null && (
            <>
              <span className="text-muted-foreground">Purchase Price</span>
              <span className="font-medium">${entry.purchasePrice.toLocaleString()}</span>
            </>
          )}
          {entry.purchaseDate && (
            <>
              <span className="text-muted-foreground">Purchase Date</span>
              <span className="font-medium">{entry.purchaseDate}</span>
            </>
          )}
          {entry.interestRate !== null && (
            <>
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-medium">{entry.interestRate}%</span>
            </>
          )}
          {entry.redemptionAmount !== null && (
            <>
              <span className="text-muted-foreground">Redemption Amount</span>
              <span className="font-medium">${entry.redemptionAmount.toLocaleString()}</span>
            </>
          )}
          {entry.redemptionDate && (
            <>
              <span className="text-muted-foreground">Redemption Date</span>
              <span className="font-medium">{entry.redemptionDate}</span>
            </>
          )}
        </div>

        {entry.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes: </span>
            <span>{entry.notes}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
