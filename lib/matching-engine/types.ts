export type VehicleSegment = 'Commuter' | 'Sports' | 'Cruiser' | 'Adventure' | 'Scooter' | 'Electric' | 'Not sure';

export type BodyType = 'motorcycle' | 'scooter' | 'electric';

export type AbsType = 'none' | 'single' | 'dual';

export interface UserPreferences {
  segment: VehicleSegment;
  budgetMin: number;
  budgetMax: number;
  styles?: string[]; // e.g. ['Sporty', 'Classic'] or ['No preference']
  mileageMin?: number; // km/l for ICE or km per charge for EV
  features?: string[]; // e.g. ['ABS', 'Disc brakes', 'Digital console', 'Bluetooth', 'USB charging', 'Electric start', 'LED headlamp', 'Alloy wheels']
}

export interface BikeCandidate {
  id: string;
  name: string; // variant name
  slug: string;
  modelYear: number;
  status: 'active' | 'discontinued' | 'upcoming';
  modelId: string;
  modelName: string;
  modelSlug: string;
  brandId: string;
  brandName: string;
  segment: VehicleSegment;
  bodyType: BodyType;
  exShowroomPrice: number;
  referenceCity: string;
  priceEffectiveDate?: string | Date;
  araiMileage?: number | null;
  realWorldMileage?: number | null;
  evRange?: number | null;
  batteryCapacity?: number | null;
  chargingTime?: number | null;
  engineCc?: number | null;
  maxPower?: string | null;
  maxTorque?: string | null;
  gearbox?: string | null;
  topSpeed?: number | null;
  motorPower?: number | null;
  primaryStyle: string;
  secondaryStyle?: string | null;
  abs: AbsType;
  discBrakes: boolean;
  digitalConsole: boolean;
  bluetooth: boolean;
  usbCharging: boolean;
  electricStart: boolean;
  ledHeadlamp: boolean;
  alloyWheels: boolean;
  tubelessTyres: boolean;
  kerbWeight?: number | null;
  seatHeight?: number | null;
  groundClearance?: number | null;
  fuelTankCapacity?: number | null;
  heroImage?: string | null;
  gallery?: string[];
  brochureUrl?: string | null;
  sourceUrl?: string | null;
  colors?: string[];
  lastVerifiedAt?: string | Date;
  datasetVersion?: string;
}

export interface SubScores {
  segment: number;
  features: number;
  budget: number;
  mileage: number;
  style: number;
}

export interface ScoredBikeResult {
  bike: BikeCandidate;
  totalScore: number;
  matchPercentage: number;
  subScores: SubScores;
  activeWeights: {
    segment: number;
    features: number;
    budget: number;
    mileage: number;
    style: number;
  };
  whyMatched: string[];
  tradeOffs: string[];
  oneLineReason: string;
}

export interface RecommendationOutput {
  results: ScoredBikeResult[];
  datasetVersion: string;
  isRelaxed: boolean;
  relaxationLevel: number;
  relaxationMessage?: string;
  totalActiveEvaluated: number;
  candidatesPassedHardFilter: number;
  unlockHint?: {
    additionalBudgetNeeded?: number;
    bikesUnlocked?: number;
  };
}
