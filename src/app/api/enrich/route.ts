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

  const params = new URLSearchParams({
    address1: address,
    address2: "",
  });

  // Try to split address for the API
  const parts = address.split(",").map((s: string) => s.trim());
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
    return NextResponse.json(
      { error: `ATTOM API error: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
