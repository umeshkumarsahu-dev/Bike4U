import { VehicleSegment } from './types';

export interface MatchingEngineConfig {
  version: string;
  weights: {
    features: number;
    segment: number;
    budget: number;
    mileage: number;
    style: number;
  };
  hardFilter: {
    maxPriceToleranceRatio: number; // default 1.15 (115%)
    minMileageFloorRatio: number;   // default 0.80 (80%)
  };
  relaxation: {
    step1BudgetRatio: number;       // 1.25 (125%)
    step2MileageRatio: number;      // 0.70 (70%)
  };
  scoreCutoff: number;              // 40
  tieScoreDelta: number;            // 1.0
  maxPerBrandInTop5: number;        // 2
  targetTopCount: number;           // 5
  minAcceptableCount: number;       // 3
  adjacentSegments: Record<string, string[]>;
}

export const DEFAULT_CONFIG: MatchingEngineConfig = {
  version: '1.0.0',
  weights: {
    features: 0.25,
    segment: 0.20,
    budget: 0.20,
    mileage: 0.20,
    style: 0.15,
  },
  hardFilter: {
    maxPriceToleranceRatio: 1.15,
    minMileageFloorRatio: 0.80,
  },
  relaxation: {
    step1BudgetRatio: 1.25,
    step2MileageRatio: 0.70,
  },
  scoreCutoff: 40,
  tieScoreDelta: 1.0,
  maxPerBrandInTop5: 2,
  targetTopCount: 5,
  minAcceptableCount: 3,
  adjacentSegments: {
    Commuter: ['Sports', 'Scooter'],
    Sports: ['Commuter', 'Adventure'],
    Cruiser: ['Adventure'],
    Adventure: ['Sports', 'Cruiser'],
    Scooter: ['Commuter'],
    Electric: [], // Electric only matches electric
  },
};

/**
 * Returns true if segmentB is adjacent to segmentA as defined in Section 5.4:
 * Commuter-Sports, Commuter-Scooter, Sports-Adventure, Cruiser-Adventure
 */
export function isAdjacentSegment(segA: VehicleSegment, segB: VehicleSegment): boolean {
  if (segA === segB) return false;
  const adjList = DEFAULT_CONFIG.adjacentSegments[segA] || [];
  return adjList.includes(segB);
}
