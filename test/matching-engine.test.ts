import { describe, it, expect } from 'vitest';
import {
  calculateBudgetScore,
  calculateFeaturesScore,
  calculateMileageScore,
  calculateSegmentScore,
  calculateStyleScore,
  getRecommendations,
  passesHardFilters,
  scoreBike,
} from '../lib/matching-engine/engine';
import { BikeCandidate, UserPreferences } from '../lib/matching-engine/types';
import { DEFAULT_CONFIG } from '../lib/matching-engine/config';

describe('Bike For U - Matching Engine (PRD Section 5)', () => {
  describe('Sub-score Unit Tests (Section 5.4 & 5.8 Boundaries)', () => {
    it('Segment score: exact = 100, adjacent = 50, other = 0, "Not sure" = inactive', () => {
      expect(calculateSegmentScore('Commuter', 'Commuter')).toEqual({ score: 100, active: true });
      expect(calculateSegmentScore('Commuter', 'Sports')).toEqual({ score: 50, active: true });
      expect(calculateSegmentScore('Commuter', 'Scooter')).toEqual({ score: 50, active: true });
      expect(calculateSegmentScore('Sports', 'Adventure')).toEqual({ score: 50, active: true });
      expect(calculateSegmentScore('Cruiser', 'Adventure')).toEqual({ score: 50, active: true });
      expect(calculateSegmentScore('Commuter', 'Cruiser')).toEqual({ score: 0, active: true });
      expect(calculateSegmentScore('Not sure', 'Sports')).toEqual({ score: 0, active: false });
    });

    it('Budget score: in range = 100, below min = 80, <= 10% over = 60, 10-15% over = 30', () => {
      const min = 100000;
      const max = 200000;
      // Below min: 80
      expect(calculateBudgetScore(min, max, 80000).score).toBe(80);
      // In range: 100
      expect(calculateBudgetScore(min, max, 100000).score).toBe(100);
      expect(calculateBudgetScore(min, max, 150000).score).toBe(100);
      expect(calculateBudgetScore(min, max, 200000).score).toBe(100);
      // Boundary 10% over (220,000): 60
      expect(calculateBudgetScore(min, max, 220000).score).toBe(60);
      // Boundary 15% over (230,000): 30
      expect(calculateBudgetScore(min, max, 230000).score).toBe(30);
    });

    it('Mileage score boundary tests (r = 40): exactly 80% (32), exactly 100% (40), beating min', () => {
      const r = 40;
      // Exactly 80% of min: m = 32 -> score = 0
      expect(calculateMileageScore(r, 32).score).toBe(0);
      // Between 0.8r and r: m = 35 -> 70 * (35 - 32) / 8 = 26.25
      expect(calculateMileageScore(r, 35).score).toBe(26.25);
      // Exactly 100%: m = 40 -> 70
      expect(calculateMileageScore(r, 40).score).toBe(70);
      // Above min: m = 48 -> 70 + 30 * min(1, 8 / 20) = 70 + 12 = 82
      expect(calculateMileageScore(r, 48).score).toBe(82);
      // Capped bonus: m = 60 -> 70 + 30 * (20 / 20) = 100
      expect(calculateMileageScore(r, 60).score).toBe(100);
    });

    it('Hard filter tests: 115% budget boundary, 80% mileage boundary, active status, EV mismatch', () => {
      const dummyBike: BikeCandidate = {
        id: 'b1',
        name: 'Test',
        slug: 'test',
        modelYear: 2024,
        status: 'active',
        modelId: 'm1',
        modelName: 'Model 1',
        modelSlug: 'm-1',
        brandId: 'brand1',
        brandName: 'Brand 1',
        segment: 'Commuter',
        bodyType: 'motorcycle',
        exShowroomPrice: 115000,
        referenceCity: 'Delhi',
        araiMileage: 40,
        primaryStyle: 'Sporty',
        abs: 'single',
        discBrakes: true,
        digitalConsole: true,
        bluetooth: false,
        usbCharging: false,
        electricStart: true,
        ledHeadlamp: true,
        alloyWheels: true,
        tubelessTyres: true,
      };

      const prefs: UserPreferences = {
        segment: 'Commuter',
        budgetMin: 80000,
        budgetMax: 100000,
        mileageMin: 50,
      };

      // 115% of 100,000 is 115,000 -> passes (<= 115%)
      // But mileage is 40 vs 50 * 0.8 = 40 -> exactly 80% passes!
      expect(passesHardFilters(dummyBike, prefs)).toBe(true);

      // Price 115,001 -> fails (> 115%)
      expect(passesHardFilters({ ...dummyBike, exShowroomPrice: 115001 }, prefs)).toBe(false);

      // Mileage 39.9 -> fails (< 80% of 50)
      expect(passesHardFilters({ ...dummyBike, araiMileage: 39.9 }, prefs)).toBe(false);

      // Discontinued bike -> fails
      expect(passesHardFilters({ ...dummyBike, status: 'discontinued' }, prefs)).toBe(false);

      // EV powertrain mismatch: Non-EV bike requesting EV segment -> fails
      expect(passesHardFilters(dummyBike, { ...prefs, segment: 'Electric' })).toBe(false);
    });
  });

  describe('PRD Section 5.7 Worked Example Verification', () => {
    const userPrefs: UserPreferences = {
      segment: 'Commuter',
      budgetMin: 100000,
      budgetMax: 160000,
      styles: ['Sporty'],
      mileageMin: 40,
      features: ['ABS', 'Disc brakes', 'Digital console', 'Bluetooth'],
    };

    const bikeA: BikeCandidate = {
      id: 'bike-a',
      name: 'Bike A 150',
      slug: 'bike-a-150',
      modelYear: 2024,
      status: 'active',
      modelId: 'model-a',
      modelName: 'Bike A',
      modelSlug: 'bike-a',
      brandId: 'brand-alpha',
      brandName: 'Alpha Motors',
      segment: 'Commuter',
      bodyType: 'motorcycle',
      exShowroomPrice: 145000,
      referenceCity: 'Pune',
      araiMileage: 48,
      primaryStyle: 'Sporty',
      secondaryStyle: null,
      abs: 'single',
      discBrakes: true,
      digitalConsole: true,
      bluetooth: false, // 3 of 4
      usbCharging: false,
      electricStart: true,
      ledHeadlamp: false,
      alloyWheels: true,
      tubelessTyres: true,
    };

    const bikeB: BikeCandidate = {
      id: 'bike-b',
      name: 'Bike B 200',
      slug: 'bike-b-200',
      modelYear: 2024,
      status: 'active',
      modelId: 'model-b',
      modelName: 'Bike B',
      modelSlug: 'bike-b',
      brandId: 'brand-beta',
      brandName: 'Beta Moto',
      segment: 'Sports', // Adjacent to Commuter
      bodyType: 'motorcycle',
      exShowroomPrice: 170000, // 6.25% over max 160000
      referenceCity: 'Pune',
      araiMileage: 35, // 35 km/l vs min 40
      primaryStyle: 'Sporty',
      secondaryStyle: null,
      abs: 'dual',
      discBrakes: true,
      digitalConsole: true,
      bluetooth: true, // all 4 features
      usbCharging: false,
      electricStart: true,
      ledHeadlamp: true,
      alloyWheels: true,
      tubelessTyres: true,
    };

    const bikeC: BikeCandidate = {
      id: 'bike-c',
      name: 'Bike C 110',
      slug: 'bike-c-110',
      modelYear: 2024,
      status: 'active',
      modelId: 'model-c',
      modelName: 'Bike C',
      modelSlug: 'bike-c',
      brandId: 'brand-gamma',
      brandName: 'Gamma Wheels',
      segment: 'Commuter',
      bodyType: 'motorcycle',
      exShowroomPrice: 110000,
      referenceCity: 'Pune',
      araiMileage: 60,
      primaryStyle: 'Classic',
      secondaryStyle: 'Minimal', // no sporty
      abs: 'single',
      discBrakes: false,
      digitalConsole: true,
      bluetooth: false, // 2 of 4 (ABS, Digital console)
      usbCharging: false,
      electricStart: true,
      ledHeadlamp: false,
      alloyWheels: false,
      tubelessTyres: true,
    };

    const bikeD: BikeCandidate = {
      id: 'bike-d',
      name: 'Bike D 250',
      slug: 'bike-d-250',
      modelYear: 2024,
      status: 'active',
      modelId: 'model-d',
      modelName: 'Bike D',
      modelSlug: 'bike-d',
      brandId: 'brand-delta',
      brandName: 'Delta Racing',
      segment: 'Sports',
      bodyType: 'motorcycle',
      exShowroomPrice: 195000, // 122% of 160000 -> Excluded (> 115%)
      referenceCity: 'Pune',
      araiMileage: 30,
      primaryStyle: 'Sporty',
      secondaryStyle: null,
      abs: 'dual',
      discBrakes: true,
      digitalConsole: true,
      bluetooth: true,
      usbCharging: true,
      electricStart: true,
      ledHeadlamp: true,
      alloyWheels: true,
      tubelessTyres: true,
    };

    it('Calculates Bike A scores exactly matching PRD Section 5.7: Total = 90.15', () => {
      const res = scoreBike(bikeA, userPrefs, DEFAULT_CONFIG);
      expect(res.subScores.segment).toBe(100);
      expect(res.subScores.features).toBe(75);
      expect(res.subScores.budget).toBe(100);
      expect(res.subScores.mileage).toBe(82);
      expect(res.subScores.style).toBe(100);
      expect(res.totalScore).toBe(90.15);
      expect(res.matchPercentage).toBe(90);
    });

    it('Calculates Bike B scores exactly matching PRD Section 5.7: Total = 67.25', () => {
      const res = scoreBike(bikeB, userPrefs, DEFAULT_CONFIG);
      expect(res.subScores.segment).toBe(50);
      expect(res.subScores.features).toBe(100);
      expect(res.subScores.budget).toBe(60);
      expect(res.subScores.mileage).toBe(26.25);
      expect(res.subScores.style).toBe(100);
      expect(res.totalScore).toBe(67.25);
      expect(res.matchPercentage).toBe(67);
    });

    it('Calculates Bike C scores exactly matching PRD Section 5.7: Total = 72.50', () => {
      const res = scoreBike(bikeC, userPrefs, DEFAULT_CONFIG);
      expect(res.subScores.segment).toBe(100);
      expect(res.subScores.features).toBe(50);
      expect(res.subScores.budget).toBe(100);
      expect(res.subScores.mileage).toBe(100);
      expect(res.subScores.style).toBe(0);
      expect(res.totalScore).toBe(72.5);
      expect(res.matchPercentage).toBe(73); // Math.round(72.5) -> 73
    });

    it('Filters Bike D via hard filter and outputs ranked top 3: Bike A, Bike C, Bike B', () => {
      const candidates = [bikeA, bikeB, bikeC, bikeD];
      const output = getRecommendations(candidates, userPrefs, DEFAULT_CONFIG);

      expect(output.candidatesPassedHardFilter).toBe(3);
      expect(output.results).toHaveLength(3);
      expect(output.results[0].bike.id).toBe('bike-a');
      expect(output.results[1].bike.id).toBe('bike-c');
      expect(output.results[2].bike.id).toBe('bike-b');
    });
  });

  describe('Brand Diversity Rule (FR-302)', () => {
    it('Limits top 5 to at most 2 bikes per brand', () => {
      const brandXCandidates: BikeCandidate[] = [1, 2, 3, 4].map((i) => ({
        id: `bx-${i}`,
        name: `Brand X Model ${i}`,
        slug: `bx-${i}`,
        modelYear: 2024,
        status: 'active',
        modelId: `mod-bx-${i}`,
        modelName: `Brand X Model ${i}`,
        modelSlug: `bx-${i}`,
        brandId: 'brand-x',
        brandName: 'Brand X',
        segment: 'Commuter',
        bodyType: 'motorcycle',
        exShowroomPrice: 90000 + i * 5000,
        referenceCity: 'Delhi',
        araiMileage: 65 - i,
        primaryStyle: 'Minimal',
        abs: 'single',
        discBrakes: false,
        digitalConsole: false,
        bluetooth: false,
        usbCharging: false,
        electricStart: true,
        ledHeadlamp: false,
        alloyWheels: true,
        tubelessTyres: true,
      }));

      const brandYCandidates: BikeCandidate[] = [1, 2, 3].map((i) => ({
        id: `by-${i}`,
        name: `Brand Y Model ${i}`,
        slug: `by-${i}`,
        modelYear: 2024,
        status: 'active',
        modelId: `mod-by-${i}`,
        modelName: `Brand Y Model ${i}`,
        modelSlug: `by-${i}`,
        brandId: 'brand-y',
        brandName: 'Brand Y',
        segment: 'Commuter',
        bodyType: 'motorcycle',
        exShowroomPrice: 95000 + i * 5000,
        referenceCity: 'Delhi',
        araiMileage: 60 - i,
        primaryStyle: 'Minimal',
        abs: 'single',
        discBrakes: false,
        digitalConsole: false,
        bluetooth: false,
        usbCharging: false,
        electricStart: true,
        ledHeadlamp: false,
        alloyWheels: true,
        tubelessTyres: true,
      }));

      const prefs: UserPreferences = {
        segment: 'Commuter',
        budgetMin: 80000,
        budgetMax: 150000,
      };

      const all = [...brandXCandidates, ...brandYCandidates];
      const output = getRecommendations(all, prefs);

      const brandXInResults = output.results.filter((r) => r.bike.brandId === 'brand-x');
      const brandYInResults = output.results.filter((r) => r.bike.brandId === 'brand-y');

      expect(brandXInResults.length).toBeLessThanOrEqual(2);
      expect(brandYInResults.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Skipped Criteria Renormalization (Section 5.2)', () => {
    it('Correctly renormalizes weights when Style, Mileage, and Features are skipped', () => {
      const bike: BikeCandidate = {
        id: 'test-1',
        name: 'Standard 125',
        slug: 'std-125',
        modelYear: 2024,
        status: 'active',
        modelId: 'm-std',
        modelName: 'Standard 125',
        modelSlug: 'std-125',
        brandId: 'b-1',
        brandName: 'Brand 1',
        segment: 'Commuter',
        bodyType: 'motorcycle',
        exShowroomPrice: 85000,
        referenceCity: 'Delhi',
        araiMileage: 55,
        primaryStyle: 'Minimal',
        abs: 'none',
        discBrakes: false,
        digitalConsole: false,
        bluetooth: false,
        usbCharging: false,
        electricStart: true,
        ledHeadlamp: false,
        alloyWheels: true,
        tubelessTyres: true,
      };

      // Only Segment & Budget provided; Style, Mileage, Features skipped
      const minimalPrefs: UserPreferences = {
        segment: 'Commuter',
        budgetMin: 70000,
        budgetMax: 100000,
      };

      const result = scoreBike(bike, minimalPrefs);
      // Segment: 100 (weight 0.20), Budget: 100 (weight 0.20)
      // Active weights: 0.20 + 0.20 = 0.40
      // Renormalized total: (0.20 * 100 + 0.20 * 100) / 0.40 = 100
      expect(result.totalScore).toBe(100);
      expect(result.activeWeights.segment).toBe(0.20);
      expect(result.activeWeights.budget).toBe(0.20);
      expect(result.activeWeights.features).toBe(0);
      expect(result.activeWeights.mileage).toBe(0);
      expect(result.activeWeights.style).toBe(0);
    });
  });

  describe('Relaxation Ladder (Section 5.6)', () => {
    it('Triggers Step 1 (Raise budget tolerance to 125%) when fewer than 3 bikes pass within 115%', () => {
      // 3 bikes between 115% and 125% of budgetMax (100k)
      const slightlyOverBikes: BikeCandidate[] = [1, 2, 3].map((i) => ({
        id: `rel-${i}`,
        name: `Relaxed Bike ${i}`,
        slug: `rel-bike-${i}`,
        modelYear: 2024,
        status: 'active',
        modelId: `m-rel-${i}`,
        modelName: `Relaxed Bike ${i}`,
        modelSlug: `rel-bike-${i}`,
        brandId: `b-rel-${i}`,
        brandName: `Brand Rel ${i}`,
        segment: 'Commuter',
        bodyType: 'motorcycle',
        exShowroomPrice: 118000 + i * 1000, // 119k, 120k, 121k (> 115k but <= 125k)
        referenceCity: 'Delhi',
        araiMileage: 60,
        primaryStyle: 'Minimal',
        abs: 'single',
        discBrakes: true,
        digitalConsole: true,
        bluetooth: false,
        usbCharging: false,
        electricStart: true,
        ledHeadlamp: true,
        alloyWheels: true,
        tubelessTyres: true,
      }));

      const prefs: UserPreferences = {
        segment: 'Commuter',
        budgetMin: 80000,
        budgetMax: 100000,
      };

      const output = getRecommendations(slightlyOverBikes, prefs);
      expect(output.isRelaxed).toBe(true);
      expect(output.relaxationLevel).toBe(1);
      expect(output.relaxationMessage).toBe('Showing a few bikes slightly above your budget.');
      expect(output.results).toHaveLength(3);
    });
  });
});
