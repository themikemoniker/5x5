import { NextRequest, NextResponse } from "next/server";

const ATTOM_BASE_URL = "https://api.gateway.attomdata.com";
const MAX_BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 500; // ms between ATTOM calls server-side

interface BatchAddress {
  id: string;
  address: string;
}

interface BatchResult {
  id: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

function parseAddress(address: string): { address1: string; address2: string } {
  let address1 = address;
  let address2 = "";

  if (address.includes(",")) {
    const parts = address.split(",").map((s: string) => s.trim());
    address1 = parts[0];
    address2 = parts.slice(1).join(", ");
  } else {
    const stateZipMatch = address.match(
      /\s([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
    );
    if (stateZipMatch) {
      const stateZipStart = stateZipMatch.index!;
      const state = stateZipMatch[1];
      const zip = stateZipMatch[2];
      const beforeState = address.slice(0, stateZipStart).trim();
      const words = beforeState.split(/\s+/);

      const knownCities = [
        "South Bend", "Fort Wayne", "Terre Haute", "West Lafayette",
        "East Chicago", "Michigan City", "New Albany", "Crown Point",
        "Port St Lucie", "St Petersburg", "West Palm Beach", "Fort Lauderdale",
        "Cape Coral", "Palm Bay", "Coral Springs", "Pembroke Pines",
      ];

      let city = "";
      let streetEnd = beforeState.length;
      for (const kc of knownCities) {
        if (beforeState.toLowerCase().endsWith(kc.toLowerCase())) {
          city = kc;
          streetEnd = beforeState.length - kc.length;
          break;
        }
      }
      if (!city && words.length >= 2) {
        city = words[words.length - 1];
        streetEnd = beforeState.lastIndexOf(city);
      }
      address1 = beforeState.slice(0, streetEnd).trim();
      address2 = `${city}, ${state} ${zip}`;
    }
  }

  return { address1, address2 };
}

async function fetchSingle(
  address1: string,
  address2: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ address1, address2 });
  const url = `${ATTOM_BASE_URL}/propertyapi/v1.0.0/avm/detail?${params.toString()}`;
  const headers = { Accept: "application/json", apikey: apiKey };

  const MAX_RETRIES = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    lastResponse = await fetch(url, { headers });

    if (lastResponse.ok) {
      return await lastResponse.json();
    }

    if (
      (lastResponse.status === 429 || lastResponse.status >= 500) &&
      attempt < MAX_RETRIES
    ) {
      const delay = 2000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    break;
  }

  throw new Error(`ATTOM API error: ${lastResponse!.status}`);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ATTOM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ATTOM API key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const addresses: BatchAddress[] = body.addresses;

  if (!Array.isArray(addresses) || addresses.length === 0) {
    return NextResponse.json(
      { error: "Missing or empty addresses array" },
      { status: 400 }
    );
  }

  if (addresses.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` },
      { status: 400 }
    );
  }

  const results: BatchResult[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const { id, address } = addresses[i];
    const { address1, address2 } = parseAddress(address);

    try {
      const data = await fetchSingle(address1, address2, apiKey);
      results.push({ id, success: true, data });
    } catch (error) {
      results.push({
        id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Rate limit between calls (not after the last one)
    if (i < addresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return NextResponse.json({ results });
}
