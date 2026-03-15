import { NextRequest, NextResponse } from "next/server";

const ATTOM_BASE_URL = "https://api.gateway.attomdata.com";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ATTOM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ATTOM API key not configured" },
      { status: 500 }
    );
  }

  const { address } = await request.json();

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Missing address" },
      { status: 400 }
    );
  }

  // Split address into street (address1) and city/state/zip (address2)
  let address1 = address;
  let address2 = "";

  if (address.includes(",")) {
    // Comma-separated: "1234 Main St, Indianapolis, IN 46204"
    const parts = address.split(",").map((s: string) => s.trim());
    address1 = parts[0];
    address2 = parts.slice(1).join(", ");
  } else {
    // Space-only: "1234 Main St Indianapolis IN 46204"
    // Match state abbreviation + optional zip to find where city/state starts
    const stateZipMatch = address.match(
      /\s([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
    );
    if (stateZipMatch) {
      const stateZipStart = stateZipMatch.index!;
      const state = stateZipMatch[1];
      const zip = stateZipMatch[2];
      // Everything before the state+zip is street + city
      const beforeState = address.slice(0, stateZipStart).trim();
      // Find the last word before state as the city
      // Use common Indiana city names or fall back to last word(s)
      const words = beforeState.split(/\s+/);
      // Walk backwards to find where the street number/name ends and city begins
      // Heuristic: city is typically 1-3 words before the state
      // Try matching known multi-word cities first, then fall back
      const knownCities = [
        "South Bend", "Fort Wayne", "Terre Haute", "West Lafayette",
        "East Chicago", "Michigan City", "New Albany", "Crown Point",
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
        // Default: assume last word is the city name
        city = words[words.length - 1];
        streetEnd = beforeState.lastIndexOf(city);
      }
      address1 = beforeState.slice(0, streetEnd).trim();
      address2 = `${city}, ${state} ${zip}`;
    }
  }

  const params = new URLSearchParams({ address1, address2 });

  const url = `${ATTOM_BASE_URL}/propertyapi/v1.0.0/avm/detail?${params.toString()}`;
  const headers = { Accept: "application/json", apikey: apiKey };

  const MAX_RETRIES = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    lastResponse = await fetch(url, { headers });

    if (lastResponse.ok) {
      const data = await lastResponse.json();
      return NextResponse.json(data);
    }

    // Retry on rate limit (429) or server errors (5xx)
    if (
      (lastResponse.status === 429 || lastResponse.status >= 500) &&
      attempt < MAX_RETRIES
    ) {
      const delay = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    break;
  }

  const errorBody = await lastResponse!.text().catch(() => "");
  return NextResponse.json(
    { error: `ATTOM API error: ${lastResponse!.status}`, detail: errorBody },
    { status: lastResponse!.status }
  );
}
