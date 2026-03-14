import { PropertyType, DealScore, EnrichedParcel } from "./types";

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

// TODO [R3]: Add portfolio-adjusted scoring that factors in existing holdings
