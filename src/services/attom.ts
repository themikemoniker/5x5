import { AttomEnrichment, PropertyType } from "@/lib/types";

// TODO [R2]: Add batch enrichment endpoint for improved throughput
// TODO [R2]: Add caching layer to avoid re-fetching previously enriched parcels

const RATE_LIMIT_DELAY = 200; // ms between calls

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
  const response = await fetch("/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Enrichment failed: ${response.status}`);
  }

  const data = await response.json();
  const property = data.property?.[0];

  return {
    estimatedValue: property?.avm?.amount?.value ?? null,
    propertyType: mapPropertyType(
      property?.summary?.proptype,
      property?.summary?.propsubtype
    ),
    lastSalePrice: property?.sale?.amount?.saleamt ?? null,
    lastSaleDate: property?.sale?.saleTransDate ?? null,
  };
}

export async function enrichParcelsWithProgress(
  parcels: Array<{ address: string; index: number }>,
  onProgress: (completed: number, total: number, currentAddress: string) => void,
  onResult: (index: number, result: AttomEnrichment | null, error: boolean) => void
): Promise<void> {
  const total = parcels.length;

  for (let i = 0; i < parcels.length; i++) {
    const { address, index } = parcels[i];
    onProgress(i, total, address);

    try {
      const result = await enrichParcel(address);
      onResult(index, result, false);
    } catch (error) {
      console.error(`Failed to enrich ${address}:`, error);
      onResult(index, null, true);
    }

    // Rate limiting delay between calls
    if (i < parcels.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  onProgress(total, total, "Complete");
}
