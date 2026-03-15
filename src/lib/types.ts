export type PropertyType = "SFR" | "Condo" | "Vacant Land" | "Commercial" | "Unknown";

export type SupportedState = "IN" | "FL";

export const STATE_LABELS: Record<SupportedState, string> = {
  IN: "Indiana",
  FL: "Florida",
};

export interface RawParcel {
  parcelId: string;
  address: string;
  ownerName: string;
  lienAmount: number;
  auctionDate: string; // ISO date string
  county: string;
  state: SupportedState;
}

export interface AttomEnrichment {
  estimatedValue: number | null;
  propertyType: PropertyType;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
}

export interface DealScore {
  overall: number; // 0-100
  ltvRatio: number;
  valueBuffer: number;
  propertyTypeScore: number;
  isTopDeal: boolean;
}

export interface EnrichedParcel extends RawParcel {
  enrichment: AttomEnrichment | null;
  enrichmentError: boolean;
  score: DealScore | null;
}

export interface AuctionGroup {
  county: string;
  state: SupportedState;
  auctionDate: string;
  key: string;
  deals: EnrichedParcel[];
}

export interface FilterState {
  counties: string[];
  propertyTypes: PropertyType[];
  sfrOnly: boolean;
  maxLienAmount: number;
  minDealScore: number;
  auctionDateStart: string | null;
  auctionDateEnd: string | null;
  savedOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  counties: [],
  propertyTypes: [],
  sfrOnly: false,
  maxLienAmount: 50000,
  minDealScore: 0,
  auctionDateStart: null,
  auctionDateEnd: null,
  savedOnly: false,
};

// Florida counties with tax lien sales
export const FLORIDA_COUNTIES = [
  "Alachua", "Baker", "Bay", "Bradford", "Brevard", "Broward", "Calhoun",
  "Charlotte", "Citrus", "Clay", "Collier", "Columbia", "DeSoto", "Dixie",
  "Duval", "Escambia", "Flagler", "Franklin", "Gadsden", "Gilchrist",
  "Glades", "Gulf", "Hamilton", "Hardee", "Hendry", "Hernando", "Highlands",
  "Hillsborough", "Holmes", "Indian River", "Jackson", "Jefferson", "Lafayette",
  "Lake", "Lee", "Leon", "Levy", "Liberty", "Madison", "Manatee", "Marion",
  "Martin", "Miami-Dade", "Monroe", "Nassau", "Okaloosa", "Okeechobee",
  "Orange", "Osceola", "Palm Beach", "Pasco", "Pinellas", "Polk", "Putnam",
  "Santa Rosa", "Sarasota", "Seminole", "St. Johns", "St. Lucie", "Sumter",
  "Suwannee", "Taylor", "Union", "Volusia", "Wakulla", "Walton", "Washington",
] as const;

// TODO [R3]: Add portfolio tracking interfaces (ROI, status, notes)
