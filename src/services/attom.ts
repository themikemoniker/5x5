import { AttomEnrichment, PropertyType } from "@/lib/types";

// TODO [R2]: Add batch enrichment endpoint for improved throughput
// TODO [R2]: Add caching layer to avoid re-fetching previously enriched parcels

const ATTOM_BASE_URL = "https://api.gateway.attomdata.com";
const RATE_LIMIT_DELAY = 200; // ms between calls

interface AttomAvmResponse {
  property?: Array<{
    avm?: {
      amount?: {
        value?: number;
      };
    };
    summary?: {
      proptype?: string;
      propsubtype?: string;
    };
    sale?: {
      amount?: {
        saleamt?: number;
      };
      saleTransDate?: string;
    };
  }>;
}

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
  const apiKey = process.env.NEXT_PUBLIC_ATTOM_API_KEY;

  if (!apiKey) {
    throw new Error("ATTOM API key not configured. Set NEXT_PUBLIC_ATTOM_API_KEY in .env");
  }

  const params = new URLSearchParams({
    address1: address,
    address2: "", // city/state parsed from full address
  });

  // Try to split address for the API
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    params.set("address1", parts[0]);
    params.set("address2", parts.slice(1).join(", "));
  }

  const response = await fetch(
    `${ATTOM_BASE_URL}/propertyapi/v1.0.0/avm/detail?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        apikey: apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`ATTOM API error: ${response.status} ${response.statusText}`);
  }

  const data: AttomAvmResponse = await response.json();
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
