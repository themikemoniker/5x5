import { describe, it, expect } from "vitest";
import { parseCsv } from "@/services/parser";

describe("parseCsv", () => {
  it("parses a simple CSV with standard headers", () => {
    const csv = `Parcel ID,Address,Owner Name,Lien Amount,Auction Date,County
12345,123 Main St,John Doe,$5000,06/15/2025,Marion
67890,456 Oak Ave,Jane Smith,$3500,06/15/2025,Marion`;

    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    expect(result.parcels[0].parcelId).toBe("12345");
    expect(result.parcels[0].address).toBe("123 Main St");
    expect(result.parcels[0].ownerName).toBe("John Doe");
    expect(result.parcels[0].lienAmount).toBe(5000);
    expect(result.parcels[0].county).toBe("Marion");
  });

  it("handles alternative header names", () => {
    const csv = `PIN,Situs Address,Taxpayer,Amount Due,Sale Date,County Name
12345,123 Main St,John Doe,$5000,2025-06-15,Hamilton`;

    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(1);
    expect(result.parcels[0].parcelId).toBe("12345");
    expect(result.parcels[0].address).toBe("123 Main St");
    expect(result.parcels[0].ownerName).toBe("John Doe");
    expect(result.parcels[0].county).toBe("Hamilton");
  });

  it("applies default county when not in CSV", () => {
    const csv = `Parcel ID,Address,Owner Name,Lien Amount,Auction Date
12345,123 Main St,John Doe,$5000,06/15/2025`;

    const result = parseCsv(csv, "Lake");
    expect(result.parcels[0].county).toBe("Lake");
  });

  it("strips dollar signs and commas from lien amounts", () => {
    const csv = `Parcel ID,Address,Owner Name,Lien Amount,Auction Date,County
12345,123 Main St,John Doe,"$12,500.50",06/15/2025,Marion`;

    const result = parseCsv(csv);
    expect(result.parcels[0].lienAmount).toBeCloseTo(12500.5);
  });

  it("reports errors for rows missing both parcel ID and address", () => {
    const csv = `Parcel ID,Address,Owner Name,Lien Amount,Auction Date,County
,,John Doe,$5000,06/15/2025,Marion`;

    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Missing both parcel ID and address");
  });

  it("generates parcel ID when missing but address exists", () => {
    const csv = `Address,Owner Name,Lien Amount,Auction Date,County
123 Main St,John Doe,$5000,06/15/2025,Marion`;

    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(1);
    expect(result.parcels[0].parcelId).toMatch(/^gen-/);
    expect(result.parcels[0].address).toBe("123 Main St");
  });

  it("tracks unmapped headers", () => {
    const csv = `Parcel ID,Address,Owner Name,Lien Amount,Auction Date,County,Extra Column,Another One
12345,123 Main St,John Doe,$5000,06/15/2025,Marion,foo,bar`;

    const result = parseCsv(csv);
    expect(result.unmappedHeaders).toContain("Extra Column");
    expect(result.unmappedHeaders).toContain("Another One");
  });

  it("handles empty CSV gracefully", () => {
    const csv = "";
    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(0);
  });

  it("handles CSV with only headers", () => {
    const csv = "Parcel ID,Address,Owner Name,Lien Amount,Auction Date,County";
    const result = parseCsv(csv);
    expect(result.parcels).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("defaults missing owner to Unknown", () => {
    const csv = `Parcel ID,Address,Lien Amount,Auction Date,County
12345,123 Main St,$5000,06/15/2025,Marion`;

    const result = parseCsv(csv);
    expect(result.parcels[0].ownerName).toBe("Unknown");
  });
});
