import { EnrichedParcel } from "./types";

const DEALS_KEY = "indiana-tax-lien-deals";
const SAVED_KEY = "indiana-tax-lien-saved";

export function storeDeals(auctionId: string, deals: EnrichedParcel[]): void {
  if (typeof window === "undefined") return;
  const all = getAllDealsMap();
  all[auctionId] = deals;
  localStorage.setItem(DEALS_KEY, JSON.stringify(all));
}

export function getDeals(auctionId: string): EnrichedParcel[] | null {
  if (typeof window === "undefined") return null;
  const all = getAllDealsMap();
  return all[auctionId] || null;
}

export function getAllDeals(): EnrichedParcel[] {
  if (typeof window === "undefined") return [];
  const all = getAllDealsMap();
  return Object.values(all).flat();
}

function getAllDealsMap(): Record<string, EnrichedParcel[]> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(DEALS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getSavedParcelIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = localStorage.getItem(SAVED_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function toggleSavedParcel(parcelId: string): Set<string> {
  const saved = getSavedParcelIds();
  if (saved.has(parcelId)) {
    saved.delete(parcelId);
  } else {
    saved.add(parcelId);
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(saved)));
  return saved;
}

export function isParcelSaved(parcelId: string): boolean {
  return getSavedParcelIds().has(parcelId);
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEALS_KEY);
  localStorage.removeItem(SAVED_KEY);
}

// TODO [R3]: Replace localStorage with database persistence for portfolio tracking
