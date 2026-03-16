import { AttomEnrichment, PropertyType } from "@/lib/types";
import { getCachedEnrichment, setCachedEnrichment } from "@/lib/storage";

const BASE_RATE_LIMIT_DELAY = 2500; // ms between calls to avoid ATTOM rate limits
const RATE_LIMITED_DELAY = 10000; // ms to wait after hitting a rate limit

function mapPropertyType(proptype?: string, propsubtype?: string): PropertyType {
  if (!proptype) return "Unknown";
  const type = proptype.toUpperCase();
  const subtype = (propsubtype || "").toUpperCase();

  if (type.includes("SFR") || type.includes("SINGLE FAMILY") || subtype.includes("SFR") || subtype.includes("SINGLE FAMILY")) {
    return "SFR";
  }
  if (type.includes("CONDO") || subtype.includes("CONDO")) {
    return "Condo";
  }
  if (type.includes("VACANT") || type.includes("LAND")) {
    return "Vacant Land";
  }
  if (type.includes("COMMERCIAL") || type.includes("INDUSTRIAL") || type.includes("OFFICE")) {
    return "Commercial";
  }
  return "Unknown";
}

export async function enrichParcel(address: string): Promise<AttomEnrichment> {
  // Check cache first
  const cached = getCachedEnrichment(address);
  if (cached) return cached;

  const response = await fetch("/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.error || `Enrichment failed: ${response.status}`);
    (error as Error & { retryable?: boolean; status?: number }).retryable = err.retryable ?? false;
    (error as Error & { retryable?: boolean; status?: number }).status = response.status;
    throw error;
  }

  const data = await response.json();
  const property = data.property?.[0];

  const result: AttomEnrichment = {
    estimatedValue: property?.avm?.amount?.value ?? null,
    propertyType: mapPropertyType(
      property?.summary?.proptype,
      property?.summary?.propsubtype
    ),
    lastSalePrice: property?.sale?.amount?.saleamt ?? null,
    lastSaleDate: property?.sale?.saleTransDate ?? null,
  };

  // Store in cache
  setCachedEnrichment(address, result);

  return result;
}

export interface EnrichmentStats {
  cached: number;
  fetched: number;
  failed: number;
}

export async function enrichParcelsWithProgress(
  parcels: Array<{ address: string; index: number }>,
  onProgress: (completed: number, total: number, currentAddress: string, stats: EnrichmentStats) => void,
  onResult: (index: number, result: AttomEnrichment | null, error: boolean) => void
): Promise<EnrichmentStats> {
  const total = parcels.length;
  const stats: EnrichmentStats = { cached: 0, fetched: 0, failed: 0 };
  let currentDelay = BASE_RATE_LIMIT_DELAY;

  for (let i = 0; i < parcels.length; i++) {
    const { address, index } = parcels[i];
    onProgress(i, total, address, stats);

    // Check if this address is already cached
    const cached = getCachedEnrichment(address);
    if (cached) {
      stats.cached++;
      onResult(index, cached, false);
      // No rate limit delay needed for cached results
      continue;
    }

    try {
      const result = await enrichParcel(address);
      stats.fetched++;
      onResult(index, result, false);
      // Successful call — gradually reduce delay back to baseline
      currentDelay = Math.max(BASE_RATE_LIMIT_DELAY, currentDelay * 0.8);
    } catch (error) {
      console.error(`Failed to enrich ${address}:`, error);
      stats.failed++;
      onResult(index, null, true);

      // If rate limited, back off significantly before continuing
      const isRateLimited = (error as Error & { retryable?: boolean; status?: number }).status === 429;
      if (isRateLimited) {
        currentDelay = RATE_LIMITED_DELAY;
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMITED_DELAY));
        continue;
      }
    }

    // Rate limiting delay only between actual API calls
    if (i < parcels.length - 1) {
      // Only delay if the next one isn't cached either
      const nextAddress = parcels[i + 1]?.address;
      if (nextAddress && !getCachedEnrichment(nextAddress)) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }
    }
  }

  onProgress(total, total, "Complete", stats);
  return stats;
}
