import { AttomEnrichment, EnrichedParcel, PortfolioEntry, LienStatus } from "./types";

const DEALS_KEY = "indiana-tax-lien-deals";
const SAVED_KEY = "indiana-tax-lien-saved";
const ENRICHMENT_CACHE_KEY = "indiana-tax-lien-enrichment-cache";
const PORTFOLIO_KEY = "indiana-tax-lien-portfolio";

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

// --- Enrichment cache ---

interface CachedEnrichment {
  result: AttomEnrichment;
  cachedAt: number;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getEnrichmentCacheMap(): Record<string, CachedEnrichment> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(ENRICHMENT_CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getCachedEnrichment(address: string): AttomEnrichment | null {
  const cache = getEnrichmentCacheMap();
  const key = normalizeAddress(address);
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    // Expired — remove it
    delete cache[key];
    localStorage.setItem(ENRICHMENT_CACHE_KEY, JSON.stringify(cache));
    return null;
  }
  return entry.result;
}

export function setCachedEnrichment(address: string, result: AttomEnrichment): void {
  if (typeof window === "undefined") return;
  const cache = getEnrichmentCacheMap();
  cache[normalizeAddress(address)] = { result, cachedAt: Date.now() };
  localStorage.setItem(ENRICHMENT_CACHE_KEY, JSON.stringify(cache));
}

export function getEnrichmentCacheStats(): { count: number } {
  const cache = getEnrichmentCacheMap();
  return { count: Object.keys(cache).length };
}

// --- Portfolio tracking ---

function getPortfolioMap(): Record<string, PortfolioEntry> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PORTFOLIO_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function savePortfolioMap(map: Record<string, PortfolioEntry>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(map));
}

export function getPortfolioEntry(parcelId: string): PortfolioEntry | null {
  const map = getPortfolioMap();
  return map[parcelId] || null;
}

export function getAllPortfolioEntries(): PortfolioEntry[] {
  return Object.values(getPortfolioMap());
}

export function getPortfolioParcelIds(): Set<string> {
  return new Set(Object.keys(getPortfolioMap()));
}

export function upsertPortfolioEntry(entry: PortfolioEntry): void {
  const map = getPortfolioMap();
  map[entry.parcelId] = { ...entry, updatedAt: new Date().toISOString() };
  savePortfolioMap(map);
}

export function createPortfolioEntry(parcelId: string, status: LienStatus = "watching"): PortfolioEntry {
  const now = new Date().toISOString();
  const entry: PortfolioEntry = {
    parcelId,
    status,
    purchasePrice: null,
    purchaseDate: null,
    redemptionDate: null,
    redemptionAmount: null,
    interestRate: null,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
  upsertPortfolioEntry(entry);
  return entry;
}

export function removePortfolioEntry(parcelId: string): void {
  const map = getPortfolioMap();
  delete map[parcelId];
  savePortfolioMap(map);
}
