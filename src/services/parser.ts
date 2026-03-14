import Papa from "papaparse";
import { RawParcel } from "@/lib/types";

// TODO [R2]: Replace CSV upload with automated county website scraping
// TODO [R2]: Add Florida county CSV format support

interface CsvRow {
  [key: string]: string;
}

const FIELD_MAPPINGS: Record<keyof RawParcel, string[]> = {
  parcelId: ["parcel id", "parcel_id", "parcelid", "parcel", "pin", "parcel number", "parcel_number"],
  address: ["address", "situs address", "situs_address", "property address", "property_address", "location"],
  ownerName: ["owner", "owner name", "owner_name", "taxpayer", "taxpayer name", "name"],
  lienAmount: ["lien amount", "lien_amount", "amount", "total due", "total_due", "tax due", "amount due", "lien"],
  auctionDate: ["auction date", "auction_date", "sale date", "sale_date", "date"],
  county: ["county", "county name", "county_name"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9\s_]/g, "");
}

function findFieldMapping(header: string): keyof RawParcel | null {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(FIELD_MAPPINGS)) {
    if (aliases.includes(normalized)) {
      return field as keyof RawParcel;
    }
  }
  return null;
}

function parseLienAmount(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "");
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

function parseDate(value: string): string {
  // Try to parse common date formats and return ISO string
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    // Try MM/DD/YYYY format
    const parts = value.split(/[/\-]/);
    if (parts.length === 3) {
      const [m, d, y] = parts;
      const attempt = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
      if (!isNaN(attempt.getTime())) return attempt.toISOString().split("T")[0];
    }
    return value; // Return as-is if unparseable
  }
  return date.toISOString().split("T")[0];
}

export interface ParseResult {
  parcels: RawParcel[];
  errors: string[];
  unmappedHeaders: string[];
}

export function parseCsv(csvText: string, defaultCounty?: string): ParseResult {
  const errors: string[] = [];
  const unmappedHeaders: string[] = [];

  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    errors.push(
      ...result.errors.map(
        (e) => `Row ${e.row}: ${e.message}`
      )
    );
  }

  // Build header mapping
  const headers = result.meta.fields || [];
  const headerMap: Record<string, keyof RawParcel> = {};

  for (const header of headers) {
    const field = findFieldMapping(header);
    if (field) {
      headerMap[header] = field;
    } else {
      unmappedHeaders.push(header);
    }
  }

  const parcels: RawParcel[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const parcel: Partial<RawParcel> = {};

    for (const [header, field] of Object.entries(headerMap)) {
      const value = row[header]?.trim() || "";
      if (field === "lienAmount") {
        parcel[field] = parseLienAmount(value);
      } else if (field === "auctionDate") {
        parcel[field] = parseDate(value);
      } else {
        (parcel as Record<string, string>)[field] = value;
      }
    }

    // Apply default county if not in CSV
    if (!parcel.county && defaultCounty) {
      parcel.county = defaultCounty;
    }

    // Validate required fields
    if (!parcel.parcelId && !parcel.address) {
      errors.push(`Row ${i + 1}: Missing both parcel ID and address`);
      continue;
    }

    // Generate parcel ID if missing
    if (!parcel.parcelId) {
      parcel.parcelId = `gen-${i}-${Date.now()}`;
    }

    parcels.push({
      parcelId: parcel.parcelId || "",
      address: parcel.address || "",
      ownerName: parcel.ownerName || "Unknown",
      lienAmount: parcel.lienAmount || 0,
      auctionDate: parcel.auctionDate || "",
      county: parcel.county || "Unknown",
    });
  }

  return { parcels, errors, unmappedHeaders };
}
