import { NextRequest, NextResponse } from "next/server";

// County data source configurations
interface CountySource {
  county: string;
  state: "IN" | "FL";
  type: "arcgis" | "zeus" | "sri";
  url: string;
  fields?: Record<string, string>; // maps our field names to source field names
}

const COUNTY_SOURCES: CountySource[] = [
  // Marion County - ArcGIS REST API
  {
    county: "Marion",
    state: "IN",
    type: "arcgis",
    url: "https://xmaps.indy.gov/arcgis/rest/services/TaxSaleViewer/TaxSaleParcels_BuildingBlocks/MapServer/0/query",
    fields: {
      parcelId: "PARCEL_NUMBER",
      address: "SITUS_ADDRESS",
      ownerName: "OWNER_NAME",
      lienAmount: "TOTAL_DUE",
      auctionDate: "SALE_DATE",
    },
  },
];

interface ScrapedParcel {
  parcelId: string;
  address: string;
  ownerName: string;
  lienAmount: number;
  auctionDate: string;
  county: string;
  state: "IN" | "FL";
}

async function scrapeArcGIS(source: CountySource): Promise<ScrapedParcel[]> {
  const fields = source.fields!;
  const outFields = Object.values(fields).join(",");
  const params = new URLSearchParams({
    where: "1=1",
    outFields,
    f: "json",
    returnGeometry: "false",
    resultRecordCount: "500",
  });

  const response = await fetch(`${source.url}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`ArcGIS query failed: ${response.status}`);
  }

  const data = await response.json();
  const features = data.features || [];

  return features.map((f: { attributes: Record<string, unknown> }) => {
    const attrs = f.attributes;
    const lienRaw = attrs[fields.lienAmount];
    const dateRaw = attrs[fields.auctionDate];

    // ArcGIS dates are often epoch ms
    let auctionDate = "";
    if (typeof dateRaw === "number") {
      auctionDate = new Date(dateRaw).toISOString().split("T")[0];
    } else if (typeof dateRaw === "string") {
      auctionDate = dateRaw;
    }

    return {
      parcelId: String(attrs[fields.parcelId] || ""),
      address: String(attrs[fields.address] || ""),
      ownerName: String(attrs[fields.ownerName] || "Unknown"),
      lienAmount: typeof lienRaw === "number" ? lienRaw : parseFloat(String(lienRaw || "0")),
      auctionDate,
      county: source.county,
      state: source.state,
    };
  });
}

async function scrapeZeus(source: CountySource): Promise<ScrapedParcel[]> {
  // Zeus Auction requires authentication and doesn't have a public API
  // This is a placeholder for when we add session-based scraping
  throw new Error(
    `Zeus Auction scraping for ${source.county} County requires authentication. ` +
    `Register at zeusauction.com and download the parcel list CSV, then import it here.`
  );
}

async function scrapeSRI(source: CountySource): Promise<ScrapedParcel[]> {
  // SRI Services requires authentication
  // Placeholder for future session-based scraping
  throw new Error(
    `SRI Services scraping for ${source.county} County requires authentication. ` +
    `Visit sriservices.com to view available parcels, or contact the county auditor for a CSV/Excel list.`
  );
}

export async function GET(request: NextRequest) {
  const county = request.nextUrl.searchParams.get("county");
  const state = request.nextUrl.searchParams.get("state") || "IN";

  // Return available sources if no county specified
  if (!county) {
    const available = COUNTY_SOURCES.map((s) => ({
      county: s.county,
      state: s.state,
      type: s.type,
    }));
    return NextResponse.json({ sources: available });
  }

  const source = COUNTY_SOURCES.find(
    (s) => s.county.toLowerCase() === county.toLowerCase() && s.state === state
  );

  if (!source) {
    return NextResponse.json(
      {
        error: `No scraper configured for ${county} County, ${state}`,
        suggestion: "Upload a CSV file instead, or check sriservices.com / zeusauction.com for this county's data.",
      },
      { status: 404 }
    );
  }

  try {
    let parcels: ScrapedParcel[];

    switch (source.type) {
      case "arcgis":
        parcels = await scrapeArcGIS(source);
        break;
      case "zeus":
        parcels = await scrapeZeus(source);
        break;
      case "sri":
        parcels = await scrapeSRI(source);
        break;
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }

    // Filter out parcels with missing critical data
    parcels = parcels.filter((p) => p.parcelId && (p.address || p.ownerName) && p.lienAmount > 0);

    return NextResponse.json({
      county: source.county,
      state: source.state,
      source: source.type,
      count: parcels.length,
      parcels,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scrape failed",
        county: source.county,
        source: source.type,
      },
      { status: 500 }
    );
  }
}
