export type PropertyType = "SFR" | "Condo" | "Vacant Land" | "Commercial" | "Unknown";

export interface RawParcel {
  parcelId: string;
  address: string;
  ownerName: string;
  lienAmount: number;
  auctionDate: string; // ISO date string
  county: string;
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

// TODO [R2]: Add Florida county type mappings
// TODO [R3]: Add portfolio tracking interfaces (ROI, status, notes)
