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

// --- Portfolio tracking ---

export type LienStatus = "watching" | "purchased" | "redeemed" | "foreclosed" | "written_off";

export const LIEN_STATUS_LABELS: Record<LienStatus, string> = {
  watching: "Watching",
  purchased: "Purchased",
  redeemed: "Redeemed",
  foreclosed: "Foreclosed",
  written_off: "Written Off",
};

export const LIEN_STATUS_COLORS: Record<LienStatus, string> = {
  watching: "bg-blue-100 text-blue-800",
  purchased: "bg-yellow-100 text-yellow-800",
  redeemed: "bg-green-100 text-green-800",
  foreclosed: "bg-purple-100 text-purple-800",
  written_off: "bg-red-100 text-red-800",
};

export interface PortfolioEntry {
  parcelId: string;
  status: LienStatus;
  purchasePrice: number | null;
  purchaseDate: string | null;
  redemptionDate: string | null;
  redemptionAmount: number | null;
  interestRate: number | null; // annual percentage, e.g. 10 for 10%
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalReturned: number;
  totalROI: number;
  activeLiens: number;
  redeemedLiens: number;
  foreclosedLiens: number;
  writtenOffLiens: number;
  avgHoldDays: number;
}
