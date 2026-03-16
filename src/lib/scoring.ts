import { PropertyType, DealScore, EnrichedParcel, PortfolioEntry } from "./types";

const WEIGHTS = {
  ltv: 0.5,
  valueBuffer: 0.3,
  propertyType: 0.2,
};

export function getPropertyTypeScore(type: PropertyType): number {
  switch (type) {
    case "SFR":
      return 100;
    case "Condo":
      return 60;
    case "Vacant Land":
      return 30;
    case "Commercial":
      return 0; // skip
    case "Unknown":
      return 20;
    default:
      return 0;
  }
}

export function calculateLtvScore(ltvRatio: number): number {
  // LTV of 0 = perfect score (100), LTV of 1+ = 0
  if (ltvRatio <= 0) return 100;
  if (ltvRatio >= 1) return 0;
  return Math.round((1 - ltvRatio) * 100);
}

export function calculateValueBufferScore(
  valueBuffer: number,
  estimatedValue: number
): number {
  if (estimatedValue <= 0) return 0;
  // Buffer as percentage of value, capped at 100
  const bufferPercent = (valueBuffer / estimatedValue) * 100;
  return Math.min(100, Math.round(bufferPercent));
}

export function calculateDealScore(
  lienAmount: number,
  estimatedValue: number | null,
  propertyType: PropertyType
): DealScore | null {
  if (estimatedValue === null || estimatedValue <= 0) {
    return null;
  }

  const ltvRatio = lienAmount / estimatedValue;
  const valueBuffer = estimatedValue - lienAmount;

  const ltvScore = calculateLtvScore(ltvRatio);
  const bufferScore = calculateValueBufferScore(valueBuffer, estimatedValue);
  const propScore = getPropertyTypeScore(propertyType);

  const overall = Math.round(
    ltvScore * WEIGHTS.ltv +
      bufferScore * WEIGHTS.valueBuffer +
      propScore * WEIGHTS.propertyType
  );

  const isTopDeal = overall >= 75 && ltvRatio <= 0.25;

  return {
    overall,
    ltvRatio,
    valueBuffer,
    propertyTypeScore: propScore,
    isTopDeal,
  };
}

export function scoreParcel(parcel: EnrichedParcel): EnrichedParcel {
  if (!parcel.enrichment || parcel.enrichmentError) {
    return { ...parcel, score: null };
  }

  const score = calculateDealScore(
    parcel.lienAmount,
    parcel.enrichment.estimatedValue,
    parcel.enrichment.propertyType
  );

  return { ...parcel, score };
}

// --- Portfolio-adjusted scoring ---

export interface PortfolioContext {
  countyExposure: Map<string, number>; // county -> total invested $
  totalInvested: number;
}

export function buildPortfolioContext(
  entries: PortfolioEntry[],
  deals: EnrichedParcel[]
): PortfolioContext {
  const dealsMap = new Map<string, EnrichedParcel>();
  for (const d of deals) {
    dealsMap.set(d.parcelId, d);
  }

  const countyExposure = new Map<string, number>();
  let totalInvested = 0;

  for (const entry of entries) {
    if (entry.status === "written_off" || !entry.purchasePrice) continue;
    const deal = dealsMap.get(entry.parcelId);
    if (!deal) continue;

    const key = `${deal.state}-${deal.county}`;
    countyExposure.set(key, (countyExposure.get(key) || 0) + entry.purchasePrice);
    totalInvested += entry.purchasePrice;
  }

  return { countyExposure, totalInvested };
}

export function calculateConcentrationPenalty(
  county: string,
  state: string,
  context: PortfolioContext
): number {
  if (context.totalInvested === 0) return 0;

  const key = `${state}-${county}`;
  const exposure = context.countyExposure.get(key) || 0;
  const concentrationRatio = exposure / context.totalInvested;

  // No penalty below 30% concentration in one county
  // Linear penalty from 0 to 15 points for 30-100% concentration
  if (concentrationRatio <= 0.3) return 0;
  return Math.round(((concentrationRatio - 0.3) / 0.7) * 15);
}

export function scoreParcelWithPortfolio(
  parcel: EnrichedParcel,
  context: PortfolioContext
): EnrichedParcel {
  // First compute base score
  const scored = scoreParcel(parcel);
  if (!scored.score) return scored;

  const penalty = calculateConcentrationPenalty(parcel.county, parcel.state, context);
  if (penalty === 0) return scored;

  const adjusted = Math.max(0, scored.score.overall - penalty);
  const isTopDeal = adjusted >= 75 && scored.score.ltvRatio <= 0.25;

  return {
    ...scored,
    score: {
      ...scored.score,
      overall: adjusted,
      isTopDeal,
    },
  };
}
