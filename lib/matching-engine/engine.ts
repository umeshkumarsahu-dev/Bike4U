import {
  BikeCandidate,
  UserPreferences,
  ScoredBikeResult,
  SubScores,
  RecommendationOutput,
  VehicleSegment,
} from './types';
import { DEFAULT_CONFIG, isAdjacentSegment, MatchingEngineConfig } from './config';

/**
 * Normalise and parse features from bike candidate
 */
export function getBikeFeatureSet(bike: BikeCandidate): Set<string> {
  const set = new Set<string>();
  if (bike.abs && bike.abs !== 'none') set.add('ABS');
  if (bike.discBrakes) set.add('Disc brakes');
  if (bike.digitalConsole) set.add('Digital console');
  if (bike.bluetooth) set.add('Bluetooth');
  if (bike.usbCharging) set.add('USB charging');
  if (bike.electricStart) set.add('Electric start');
  if (bike.ledHeadlamp) set.add('LED headlamp');
  if (bike.alloyWheels) set.add('Alloy wheels');
  if (bike.tubelessTyres) set.add('Tubeless tyres');
  return set;
}

/**
 * Get the effective mileage or range of a bike
 */
export function getBikeEfficiencyValue(bike: BikeCandidate): number | null {
  if (bike.bodyType === 'electric' || bike.segment === 'Electric') {
    return bike.evRange ?? null;
  }
  return bike.araiMileage ?? bike.realWorldMileage ?? null;
}

/**
 * Sub-score: Segment (0 to 100)
 * Exact match = 100. Adjacent = 50. Otherwise 0. 'Not sure' = inactive.
 */
export function calculateSegmentScore(
  userSegment: VehicleSegment,
  bikeSegment: VehicleSegment
): { score: number; active: boolean } {
  if (userSegment === 'Not sure') {
    return { score: 0, active: false };
  }
  if (userSegment === bikeSegment) {
    return { score: 100, active: true };
  }
  if (isAdjacentSegment(userSegment, bikeSegment)) {
    return { score: 50, active: true };
  }
  return { score: 0, active: true };
}

/**
 * Sub-score: Features (0 to 100)
 * (number of selected features the variant has) / (number selected) * 100
 */
export function calculateFeaturesScore(
  userFeatures: string[] | undefined,
  bike: BikeCandidate
): { score: number; active: boolean; presentCount: number; selectedCount: number } {
  if (!userFeatures || userFeatures.length === 0) {
    return { score: 0, active: false, presentCount: 0, selectedCount: 0 };
  }

  const bikeFeatures = getBikeFeatureSet(bike);
  let matchCount = 0;
  for (const feature of userFeatures) {
    if (bikeFeatures.has(feature)) {
      matchCount++;
    }
  }

  const score = (matchCount / userFeatures.length) * 100;
  return {
    score,
    active: true,
    presentCount: matchCount,
    selectedCount: userFeatures.length,
  };
}

/**
 * Sub-score: Budget (0 to 100)
 * Inside range = 100.
 * Below minimum = 80 (cheaper than expected, still fine).
 * Above maximum by up to 10% = 60.
 * Above by 10% to 15% = 30.
 * Above 15% = 0 / excluded.
 */
export function calculateBudgetScore(
  budgetMin: number,
  budgetMax: number,
  price: number
): { score: number; active: boolean } {
  if (price >= budgetMin && price <= budgetMax) {
    return { score: 100, active: true };
  }
  if (price < budgetMin) {
    return { score: 80, active: true };
  }
  const ratioAbove = (price - budgetMax) / budgetMax;
  if (ratioAbove <= 0.10) {
    return { score: 60, active: true };
  }
  if (ratioAbove <= 0.15) {
    return { score: 30, active: true };
  }
  // If relaxed up to 25%, give proportional low score
  if (ratioAbove <= 0.25) {
    return { score: 15, active: true };
  }
  return { score: 0, active: true };
}

/**
 * Sub-score: Mileage / Range (0 to 100)
 * Let r = requested minimum, m = bike's value.
 * If m >= r: 70 + 30 * min(1, (m - r) / (0.5 * r))
 * If m between 0.8r and r: 70 * (m - 0.8r) / (0.2r)
 * Below 0.8r = 0 / excluded
 */
export function calculateMileageScore(
  requestedMin: number | undefined,
  bikeValue: number | null
): { score: number; active: boolean } {
  if (requestedMin === undefined || requestedMin === null || requestedMin <= 0) {
    return { score: 0, active: false };
  }
  if (bikeValue === null || bikeValue === undefined) {
    return { score: 0, active: true };
  }

  const r = requestedMin;
  const m = bikeValue;

  if (m >= r) {
    const bonus = Math.min(1, (m - r) / (0.5 * r));
    const score = 70 + 30 * bonus;
    return { score, active: true };
  }

  if (m >= 0.8 * r) {
    const score = (70 * (m - 0.8 * r)) / (0.2 * r);
    return { score, active: true };
  }

  // Relaxation step 2 allows down to 0.7r
  if (m >= 0.7 * r) {
    const score = (35 * (m - 0.7 * r)) / (0.1 * r);
    return { score, active: true };
  }

  return { score: 0, active: true };
}

/**
 * Sub-score: Style (0 to 100)
 * Bike's primary style tag = 100, secondary tag = 60, no tag = 0.
 * Best result across user's selected styles.
 */
export function calculateStyleScore(
  userStyles: string[] | undefined,
  primaryStyle: string,
  secondaryStyle?: string | null
): { score: number; active: boolean } {
  if (
    !userStyles ||
    userStyles.length === 0 ||
    userStyles.includes('No preference')
  ) {
    return { score: 0, active: false };
  }

  let bestScore = 0;
  for (const style of userStyles) {
    if (primaryStyle && primaryStyle.toLowerCase() === style.toLowerCase()) {
      bestScore = Math.max(bestScore, 100);
    } else if (secondaryStyle && secondaryStyle.toLowerCase() === style.toLowerCase()) {
      bestScore = Math.max(bestScore, 60);
    }
  }

  return { score: bestScore, active: true };
}

/**
 * Generate 3 "Why it matched" reasons and up to 2 honest trade-offs
 */
export function generateExplanations(
  bike: BikeCandidate,
  userPrefs: UserPreferences,
  subScores: SubScores,
  userFeatures: string[] | undefined
): { whyMatched: string[]; tradeOffs: string[]; oneLineReason: string } {
  const whyMatched: string[] = [];
  const tradeOffs: string[] = [];

  // Style explanation
  if (subScores.style >= 100) {
    whyMatched.push(`Fits your ${bike.primaryStyle.toLowerCase()} look`);
  } else if (subScores.style >= 60) {
    whyMatched.push(`Offers ${bike.secondaryStyle?.toLowerCase()} styling cues`);
  }

  // Budget explanation & trade-off
  const formattedPrice = `INR ${bike.exShowroomPrice.toLocaleString('en-IN')}`;
  if (bike.exShowroomPrice <= userPrefs.budgetMax) {
    if (bike.exShowroomPrice < userPrefs.budgetMin) {
      whyMatched.push(`Under budget at ${formattedPrice} (great value)`);
    } else {
      whyMatched.push(`Inside your budget at ${formattedPrice}`);
    }
  } else {
    const overAmt = bike.exShowroomPrice - userPrefs.budgetMax;
    tradeOffs.push(`INR ${overAmt.toLocaleString('en-IN')} over budget`);
  }

  // Mileage / Range explanation & trade-off
  const bikeEff = getBikeEfficiencyValue(bike);
  const isEv = bike.bodyType === 'electric' || bike.segment === 'Electric';
  const unit = isEv ? 'km per charge' : 'km/l';

  if (userPrefs.mileageMin && bikeEff !== null) {
    if (bikeEff >= userPrefs.mileageMin) {
      whyMatched.push(`Delivers ${bikeEff} ${unit} against your ${userPrefs.mileageMin}+ requirement`);
    } else {
      tradeOffs.push(`Delivers ${bikeEff} ${unit} (slightly under your ${userPrefs.mileageMin} target)`);
    }
  } else if (bikeEff !== null) {
    whyMatched.push(`Delivers ${bikeEff} ${unit}`);
  }

  // Features explanation & trade-off
  if (userFeatures && userFeatures.length > 0) {
    const bikeFeatSet = getBikeFeatureSet(bike);
    const matchedFeatures: string[] = [];
    const missingFeatures: string[] = [];

    for (const f of userFeatures) {
      if (bikeFeatSet.has(f)) {
        matchedFeatures.push(f.toLowerCase());
      } else {
        missingFeatures.push(f);
      }
    }

    if (matchedFeatures.length > 0) {
      const featString = matchedFeatures.slice(0, 3).join(', ');
      whyMatched.push(`Equipped with ${featString}`);
    }

    if (missingFeatures.length > 0) {
      const missingString = missingFeatures.slice(0, 2).join(' & ');
      tradeOffs.push(`No ${missingString}`);
    }
  }

  // Segment trade-off if adjacent
  if (userPrefs.segment !== 'Not sure' && bike.segment !== userPrefs.segment) {
    tradeOffs.push(`In adjacent ${bike.segment} segment`);
  }

  // Ensure whyMatched has up to 3 items
  if (whyMatched.length < 3) {
    if (bike.segment) {
      whyMatched.push(`Proven ${bike.segment} build and reliability`);
    }
    if (bike.engineCc) {
      whyMatched.push(`Responsive ${Math.round(bike.engineCc)}cc powerplant`);
    }
  }

  // Trim to maximum 3 why matched and 2 trade-offs
  const finalWhy = whyMatched.slice(0, 3);
  const finalTradeOffs = tradeOffs.slice(0, 2);

  // Generate crisp 1-line reason for summary cards
  let oneLineReason = '';
  if (finalWhy.length > 0) {
    oneLineReason = `${finalWhy[0]}${finalTradeOffs.length > 0 ? `, but ${finalTradeOffs[0].toLowerCase()}` : ''}.`;
  } else {
    oneLineReason = `Top match in ${bike.segment} segment.`;
  }

  return {
    whyMatched: finalWhy,
    tradeOffs: finalTradeOffs,
    oneLineReason,
  };
}

/**
 * Score a single bike candidate
 */
export function scoreBike(
  bike: BikeCandidate,
  userPrefs: UserPreferences,
  config: MatchingEngineConfig = DEFAULT_CONFIG
): ScoredBikeResult {
  const segRes = calculateSegmentScore(userPrefs.segment, bike.segment);
  const featRes = calculateFeaturesScore(userPrefs.features, bike);
  const budRes = calculateBudgetScore(userPrefs.budgetMin, userPrefs.budgetMax, bike.exShowroomPrice);
  const effVal = getBikeEfficiencyValue(bike);
  const milRes = calculateMileageScore(userPrefs.mileageMin, effVal);
  const styRes = calculateStyleScore(userPrefs.styles, bike.primaryStyle, bike.secondaryStyle);

  const subScores: SubScores = {
    segment: segRes.score,
    features: featRes.score,
    budget: budRes.score,
    mileage: milRes.score,
    style: styRes.score,
  };

  const activeWeights = {
    segment: segRes.active ? config.weights.segment : 0,
    features: featRes.active ? config.weights.features : 0,
    budget: budRes.active ? config.weights.budget : 0,
    mileage: milRes.active ? config.weights.mileage : 0,
    style: styRes.active ? config.weights.style : 0,
  };

  const totalActiveWeight =
    activeWeights.segment +
    activeWeights.features +
    activeWeights.budget +
    activeWeights.mileage +
    activeWeights.style;

  let totalScore = 0;
  if (totalActiveWeight > 0) {
    const rawWeightedSum =
      activeWeights.segment * subScores.segment +
      activeWeights.features * subScores.features +
      activeWeights.budget * subScores.budget +
      activeWeights.mileage * subScores.mileage +
      activeWeights.style * subScores.style;

    totalScore = rawWeightedSum / totalActiveWeight;
  }

  // Format to 2 decimal places
  totalScore = Math.round(totalScore * 100) / 100;
  const matchPercentage = Math.round(totalScore);

  const { whyMatched, tradeOffs, oneLineReason } = generateExplanations(
    bike,
    userPrefs,
    subScores,
    userPrefs.features
  );

  return {
    bike,
    totalScore,
    matchPercentage,
    subScores,
    activeWeights,
    whyMatched,
    tradeOffs,
    oneLineReason,
  };
}

/**
 * Check if variant passes hard filters
 */
export function passesHardFilters(
  bike: BikeCandidate,
  userPrefs: UserPreferences,
  budgetToleranceRatio: number = DEFAULT_CONFIG.hardFilter.maxPriceToleranceRatio,
  mileageFloorRatio: number = DEFAULT_CONFIG.hardFilter.minMileageFloorRatio,
  allowAdjacentSegment: boolean = false
): boolean {
  // 1. Status must be active (exclude discontinued or upcoming)
  if (bike.status !== 'active') {
    return false;
  }

  // 2. Ex-showroom price <= tolerance * budgetMax (handle float precision)
  const maxAllowedPrice = Math.round(userPrefs.budgetMax * budgetToleranceRatio);
  if (bike.exShowroomPrice > maxAllowedPrice) {
    return false;
  }

  // 3. Mileage or range floor (when specified, handle float precision)
  if (userPrefs.mileageMin && userPrefs.mileageMin > 0) {
    const bikeEff = getBikeEfficiencyValue(bike);
    const minAllowedEff = userPrefs.mileageMin * mileageFloorRatio - 1e-5;
    if (bikeEff === null || bikeEff < minAllowedEff) {
      return false;
    }
  }

  // 4. Powertrain mismatch
  const isEvBike = bike.bodyType === 'electric' || bike.segment === 'Electric';
  if (userPrefs.segment === 'Electric') {
    if (!isEvBike) return false;
  } else if (userPrefs.segment !== 'Not sure') {
    if (isEvBike) return false;

    // Segment matching rule
    if (!allowAdjacentSegment) {
      // Must be exact match or adjacent match according to segment filter
      if (bike.segment !== userPrefs.segment && !isAdjacentSegment(userPrefs.segment, bike.segment)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filter, score, collapse to best variant per model, apply tie breakers, and diversity rule
 */
export function runMatchingPipeline(
  candidates: BikeCandidate[],
  userPrefs: UserPreferences,
  budgetToleranceRatio: number = DEFAULT_CONFIG.hardFilter.maxPriceToleranceRatio,
  mileageFloorRatio: number = DEFAULT_CONFIG.hardFilter.minMileageFloorRatio,
  allowAdjacentSegment: boolean = false,
  config: MatchingEngineConfig = DEFAULT_CONFIG
): { scored: ScoredBikeResult[]; passedFilterCount: number } {
  const passingCandidates: BikeCandidate[] = [];

  for (const bike of candidates) {
    if (
      passesHardFilters(
        bike,
        userPrefs,
        budgetToleranceRatio,
        mileageFloorRatio,
        allowAdjacentSegment
      )
    ) {
      passingCandidates.push(bike);
    }
  }

  // Score all passing candidates
  const scoredList = passingCandidates.map((bike) => scoreBike(bike, userPrefs, config));

  // Collapse to best variant per model
  const bestVariantByModel = new Map<string, ScoredBikeResult>();
  for (const item of scoredList) {
    const existing = bestVariantByModel.get(item.bike.modelId);
    if (!existing || item.totalScore > existing.totalScore) {
      bestVariantByModel.set(item.bike.modelId, item);
    }
  }

  const modelResults = Array.from(bestVariantByModel.values());

  // Rank with tie-breakers (Section 5.5)
  // Scores within 1 point are treated as a tie
  modelResults.sort((a, b) => {
    const diff = b.totalScore - a.totalScore;
    if (Math.abs(diff) >= config.tieScoreDelta) {
      return diff;
    }

    // Tie-breaker 1: higher feature match
    if (b.subScores.features !== a.subScores.features) {
      return b.subScores.features - a.subScores.features;
    }

    // Tie-breaker 2: higher mileage or range
    const effA = getBikeEfficiencyValue(a.bike) || 0;
    const effB = getBikeEfficiencyValue(b.bike) || 0;
    if (effB !== effA) {
      return effB - effA;
    }

    // Tie-breaker 3: lower price
    return a.bike.exShowroomPrice - b.bike.exShowroomPrice;
  });

  // Filter out any bike below scoreCutoff (40)
  const qualified = modelResults.filter((r) => r.totalScore >= config.scoreCutoff);

  // Apply diversity rule: at most 2 bikes from the same brand in top 5, unless fewer candidates exist
  const finalTop: ScoredBikeResult[] = [];
  const brandCount = new Map<string, number>();

  for (const candidate of qualified) {
    const bId = candidate.bike.brandId || candidate.bike.brandName;
    const currentCount = brandCount.get(bId) || 0;
    if (currentCount < config.maxPerBrandInTop5) {
      brandCount.set(bId, currentCount + 1);
      finalTop.push(candidate);
      if (finalTop.length === config.targetTopCount) break;
    }
  }

  // Only if total qualified candidates across all brands is less than targetTopCount
  // do we allow backfilling additional models from already-represented brands (unless fewer candidates exist)
  if (finalTop.length < config.targetTopCount && qualified.length < config.targetTopCount) {
    for (const candidate of qualified) {
      if (!finalTop.some((item) => item.bike.id === candidate.bike.id)) {
        finalTop.push(candidate);
        if (finalTop.length === config.targetTopCount) break;
      }
    }
  }

  return {
    scored: finalTop,
    passedFilterCount: passingCandidates.length,
  };
}

/**
 * Master recommendation function with relaxation ladder (Section 5.6)
 */
export function getRecommendations(
  allBikes: BikeCandidate[],
  userPrefs: UserPreferences,
  config: MatchingEngineConfig = DEFAULT_CONFIG
): RecommendationOutput {
  const datasetVersion = allBikes[0]?.datasetVersion || config.version;
  const activeBikes = allBikes.filter((b) => b.status === 'active');

  // Attempt standard pass (Level 0)
  let passResult = runMatchingPipeline(
    activeBikes,
    userPrefs,
    config.hardFilter.maxPriceToleranceRatio,
    config.hardFilter.minMileageFloorRatio,
    false,
    config
  );

  let relaxationLevel = 0;
  let relaxationMessage: string | undefined = undefined;

  // Relaxation Step 1: Raise budget cap tolerance from 115% to 125%
  if (passResult.scored.length < config.minAcceptableCount) {
    relaxationLevel = 1;
    relaxationMessage = 'Showing a few bikes slightly above your budget.';
    passResult = runMatchingPipeline(
      activeBikes,
      userPrefs,
      config.relaxation.step1BudgetRatio,
      config.hardFilter.minMileageFloorRatio,
      false,
      config
    );
  }

  // Relaxation Step 2: Lower mileage floor from 80% to 70% of requested
  if (passResult.scored.length < config.minAcceptableCount && userPrefs.mileageMin) {
    relaxationLevel = 2;
    relaxationMessage = 'Some options have slightly lower mileage than you asked for.';
    passResult = runMatchingPipeline(
      activeBikes,
      userPrefs,
      config.relaxation.step1BudgetRatio,
      config.relaxation.step2MileageRatio,
      false,
      config
    );
  }

  // Relaxation Step 3: Widen segment to adjacent segments
  if (passResult.scored.length < config.minAcceptableCount && userPrefs.segment !== 'Not sure') {
    relaxationLevel = 3;
    relaxationMessage = 'We also included similar segments.';
    passResult = runMatchingPipeline(
      activeBikes,
      userPrefs,
      config.relaxation.step1BudgetRatio,
      config.relaxation.step2MileageRatio,
      true,
      config
    );
  }

  // Step 4: If still fewer or empty, calculate cheapest way to unlock results
  let unlockHint: { additionalBudgetNeeded?: number; bikesUnlocked?: number } | undefined = undefined;
  if (passResult.scored.length === 0) {
    // Find closest priced bike in same or adjacent segment
    const segmentCandidates = activeBikes.filter((b) => {
      if (userPrefs.segment === 'Electric') return b.bodyType === 'electric';
      if (userPrefs.segment === 'Not sure') return true;
      return b.segment === userPrefs.segment || isAdjacentSegment(userPrefs.segment, b.segment);
    });

    const higherPriced = segmentCandidates
      .filter((b) => b.exShowroomPrice > userPrefs.budgetMax)
      .sort((a, b) => a.exShowroomPrice - b.exShowroomPrice);

    if (higherPriced.length > 0) {
      const nearest = higherPriced[0];
      const needed = nearest.exShowroomPrice - userPrefs.budgetMax;
      const bikesWithinWindow = higherPriced.filter(
        (b) => b.exShowroomPrice <= nearest.exShowroomPrice + 20000
      ).length;
      unlockHint = {
        additionalBudgetNeeded: needed,
        bikesUnlocked: Math.max(1, bikesUnlockedWithinWindow(higherPriced, needed + 15000)),
      };
    }
  }

  return {
    results: passResult.scored,
    datasetVersion,
    isRelaxed: relaxationLevel > 0,
    relaxationLevel,
    relaxationMessage,
    totalActiveEvaluated: activeBikes.length,
    candidatesPassedHardFilter: passResult.passedFilterCount,
    unlockHint,
  };
}

function bikesUnlockedWithinWindow(higherPriced: BikeCandidate[], windowPrice: number): number {
  return higherPriced.filter((b) => b.exShowroomPrice <= windowPrice).length || 3;
}
