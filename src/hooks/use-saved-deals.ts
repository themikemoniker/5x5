"use client";

import { useState, useCallback, useEffect } from "react";
import { getSavedParcelIds, toggleSavedParcel } from "@/lib/storage";

export function useSavedDeals() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSavedIds(getSavedParcelIds());
  }, []);

  const toggleSaved = useCallback((parcelId: string) => {
    const updated = toggleSavedParcel(parcelId);
    setSavedIds(new Set(updated));
  }, []);

  const isSaved = useCallback(
    (parcelId: string) => savedIds.has(parcelId),
    [savedIds]
  );

  return { savedIds, toggleSaved, isSaved };
}
