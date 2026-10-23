'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  Zap,
  Shield,
  Gauge,
  Sliders,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  Layers,
  Fuel,
  Compass,
} from 'lucide-react';
import { VehicleSegment } from '@/lib/matching-engine/types';

const SEGMENTS: { id: VehicleSegment; title: string; desc: string; icon: any }[] = [
  { id: 'Commuter', title: 'Commuter', desc: 'Daily efficiency, low running cost, easy ride', icon: Bike },
  { id: 'Sports', title: 'Sports', desc: 'Performance, aggressive ergonomics, quick acceleration', icon: Gauge },
  { id: 'Cruiser', title: 'Cruiser', desc: 'Low seat, relaxed highway posture, distinct thumping feel', icon: Compass },
  { id: 'Adventure', title: 'Adventure (ADV)', desc: 'High ground clearance, upright posture, touring ready', icon: Layers },
  { id: 'Scooter', title: 'Petrol Scooter', desc: 'Step-through ease, automatic transmission, storage', icon: Bike },
  { id: 'Electric', title: 'Electric (EV)', desc: 'Zero emissions, instant motor torque, battery pack', icon: Zap },
  { id: 'Not sure', title: 'Not Sure / Open', desc: 'Explore all two-wheeler options within my budget', icon: Sparkles },
];

const STYLES = ['Sporty', 'Classic', 'Cruiser', 'Rugged', 'Minimal', 'No preference'];

const ICE_MILEAGE_PRESETS = [30, 40, 50, 60, 70];
const EV_RANGE_PRESETS = [60, 80, 100, 120, 150];

const FEATURES_LIST = [
  { id: 'ABS', label: 'ABS (Anti-lock Braking)', desc: 'Essential safety to prevent wheel lockups', isEvOnly: false },
  { id: 'Disc brakes', label: 'Front Disc Brake', desc: 'Stronger, predictable stopping bite', isEvOnly: false },
  { id: 'Digital console', label: 'Digital Instrument Console', desc: 'LCD / TFT speedometer and trip information', isEvOnly: false },
  { id: 'Bluetooth', label: 'Bluetooth & Navigation', desc: 'Turn-by-turn guidance and call alerts', isEvOnly: false },
  { id: 'USB charging', label: 'USB Phone Charger', desc: 'Convenient mobile charging on the go', isEvOnly: false },
  { id: 'Electric start', label: 'Electric / Push Start', desc: 'Self start button without manual kicking', hideForEv: true },
  { id: 'LED headlamp', label: 'LED Headlamp', desc: 'Brighter night illumination and battery efficiency', isEvOnly: false },
  { id: 'Alloy wheels', label: 'Alloy Wheels & Tubeless', desc: 'Low maintenance with puncture resistance', isEvOnly: false },
];

export default function RecommendationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Wizard step (1 to 5)
  const [step, setStep] = useState<number>(1);
  const formRef = useRef<HTMLDivElement>(null);

  // Form states initialized with URL params if available (FR-107)
  const [segment, setSegment] = useState<VehicleSegment>(
    (searchParams.get('segment') as VehicleSegment) || 'Commuter'
  );
  const [budgetMin, setBudgetMin] = useState<number>(
    searchParams.get('min') ? Number(searchParams.get('min')) : 70000
  );
  const [budgetMax, setBudgetMax] = useState<number>(
    searchParams.get('max') ? Number(searchParams.get('max')) : 150000
  );
  const [styles, setStyles] = useState<string[]>(
    searchParams.get('styles') ? searchParams.get('styles')!.split(',') : []
  );
  const [mileageMin, setMileageMin] = useState<number | undefined>(
    searchParams.get('mileage') ? Number(searchParams.get('mileage')) : undefined
  );
  const [features, setFeatures] = useState<string[]>(
    searchParams.get('features') ? searchParams.get('features')!.split(',') : []
  );

  // Live count hint (FR-108)
  const [countHint, setCountHint] = useState<string>('Loading matching bikes...');
  const [hintLoading, setHintLoading] = useState<boolean>(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Fetch live count hint whenever segment or budget changes
  useEffect(() => {
    let active = true;
    const fetchHint = async () => {
      setHintLoading(true);
      try {
        const res = await fetch(`/api/count-hint?segment=${segment}&budgetMax=${budgetMax}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setCountHint(data.message);
        }
      } catch (e) {
        // ignore
      } finally {
        if (active) setHintLoading(false);
      }
    };

    const timer = setTimeout(fetchHint, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [segment, budgetMax]);

  // Validation
  const validateBudget = () => {
    if (budgetMax <= budgetMin) {
      setBudgetError('Maximum budget must be higher than minimum budget.');
      return false;
    }
    if (budgetMax - budgetMin < 20000) {
      setBudgetError('Minimum difference between min and max budget is INR 20,000.');
      return false;
    }
    setBudgetError(null);
    return true;
  };

  const scrollToForm = () => {
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      // If form top is scrolled out of view or too far down, align it smoothly
      if (rect.top < 60 || rect.top > 180) {
        const yOffset = -75; // clearance for top sticky navbar
        const targetY = rect.top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  };

  const handleNextStep = () => {
    if (step === 2 && !validateBudget()) {
      return;
    }
    if (step < 5) {
      setStep(step + 1);
      setTimeout(scrollToForm, 50);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setTimeout(scrollToForm, 50);
    }
  };

  // Submit preferences
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateBudget()) {
      setStep(2);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segment,
            budgetMin,
            budgetMax,
            styles,
            mileageMin,
            features,
          }),
        });

        if (!res.ok) {
          throw new Error('Recommendation query failed');
        }

        const data = await res.json();
        if (data.snapshotId) {
          router.push(`/results/${data.snapshotId}`);
        }
      } catch (err) {
        console.error(err);
        alert('Unable to load matches. Please try again.');
      }
    });
  };

  // Quick budget presets
  const handleQuickBudget = (min: number, max: number) => {
    setBudgetMin(min);
    setBudgetMax(max);
    setBudgetError(null);
  };

  // Toggle style
  const handleToggleStyle = (styleName: string) => {
    if (styleName === 'No preference') {
      setStyles(['No preference']);
      return;
    }
    let updated = styles.filter((s) => s !== 'No preference');
    if (updated.includes(styleName)) {
      updated = updated.filter((s) => s !== styleName);
    } else {
      if (updated.length >= 2) {
        updated = [updated[1], styleName]; // max 2
      } else {
        updated.push(styleName);
      }
    }
    setStyles(updated);
  };

  // Toggle feature
  const handleToggleFeature = (feat: string) => {
    if (features.includes(feat)) {
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const isEv = segment === 'Electric';
  const mileagePresets = isEv ? EV_RANGE_PRESETS : ICE_MILEAGE_PRESETS;
  const mileageUnit = isEv ? 'km per charge' : 'km/l';

  return (
    <div id="finder" ref={formRef} className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
      {/* Form Progress Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              Step {step} of 5
            </span>
            <span className="text-xs font-medium text-slate-500">
              {step === 1 && 'Riding Category & Segment'}
              {step === 2 && 'Ex-Showroom Budget Range'}
              {step === 3 && 'Aesthetic & Style Preference'}
              {step === 4 && (isEv ? 'Minimum Battery Range' : 'Minimum Fuel Mileage')}
              {step === 5 && 'Must-Have Features & Safety'}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {step === 5 ? 'Final Step' : `${5 - step} questions remaining`}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-orange h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content Area */}
      <div className="p-6 sm:p-10">
        {/* ================= STEP 1: SEGMENT ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                What kind of vehicle are you looking for?
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Select the primary vehicle type that fits your daily travel requirement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEGMENTS.map((seg) => {
                const IconComponent = seg.icon;
                const isSelected = segment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSegment(seg.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-orange bg-orange-50/50 shadow-md ring-2 ring-brand-orange/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isSelected ? 'bg-brand-orange text-white' : 'bg-slate-100 text-brand-navy'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <span className="text-brand-orange text-xs font-bold flex items-center">
                            <Check className="w-4 h-4 mr-0.5" /> Selected
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-brand-navy text-base">{seg.title}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{seg.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: BUDGET ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                What is your target budget range?
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your ex-showroom budget limit. Matching considers up to 115% for high-value candidates.
              </p>
            </div>

            {/* Quick-pick budget buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickBudget(60000, 100000)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Under 1 Lakh
              </button>
              <button
                type="button"
                onClick={() => handleQuickBudget(80000, 130000)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                80k - 1.3 Lakh
              </button>
              <button
                type="button"
                onClick={() => handleQuickBudget(100000, 160000)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                1.0 - 1.6 Lakh
              </button>
              <button
                type="button"
                onClick={() => handleQuickBudget(150000, 250000)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                1.5 - 2.5 Lakh
              </button>
            </div>

            {/* Min and Max Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Minimum Budget (INR)
                </label>
                <input
                  type="number"
                  min="30000"
                  max="2500000"
                  step="5000"
                  value={budgetMin}
                  onChange={(e) => {
                    setBudgetMin(Number(e.target.value));
                    setBudgetError(null);
                  }}
                  className="w-full text-2xl font-black text-brand-navy bg-transparent outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  INR {budgetMin.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Maximum Budget (INR)
                </label>
                <input
                  type="number"
                  min="50000"
                  max="2500000"
                  step="5000"
                  value={budgetMax}
                  onChange={(e) => {
                    setBudgetMax(Number(e.target.value));
                    setBudgetError(null);
                  }}
                  className="w-full text-2xl font-black text-brand-orange bg-transparent outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  INR {budgetMax.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {budgetError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
                {budgetError}
              </div>
            )}

            {/* Slider visualizer */}
            <div className="pt-2">
              <label className="text-xs text-slate-400 block mb-2">Adjust Maximum Budget Slider</label>
              <input
                type="range"
                min="50000"
                max="300000"
                step="5000"
                value={budgetMax}
                onChange={(e) => {
                  setBudgetMax(Number(e.target.value));
                  setBudgetError(null);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>INR 50,000</span>
                <span>INR 1,75,000</span>
                <span>INR 3,00,000+</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: STYLE ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                  What styling resonates with you?
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                  Optional &bull; Max 2
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Pick up to 2 style cues you prefer, or select &ldquo;No preference&rdquo; to distribute weight to mileage and features.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLES.map((st) => {
                const isSelected = styles.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleToggleStyle(st)}
                    className={`py-4 px-5 rounded-2xl border-2 font-semibold text-sm transition-all text-center flex items-center justify-center space-x-2 ${
                      isSelected
                        ? 'border-brand-orange bg-orange-50 text-brand-orange shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{st}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-orange" />}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Style scoring gives 100 points for primary manufacturer styling tags and 60 for secondary design cues.
            </div>
          </div>
        )}

        {/* ================= STEP 4: MILEAGE / RANGE ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                  {isEv ? 'Minimum battery range per charge?' : 'Minimum fuel economy target?'}
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                  Optional
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {isEv
                  ? 'Certified real-world range on full charge (km per charge).'
                  : 'Official ARAI certified mileage (km per litre).'}
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {mileagePresets.map((val) => {
                const isSelected = mileageMin === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMileageMin(isSelected ? undefined : val)}
                    className={`py-4 px-3 rounded-2xl border-2 font-bold text-center transition-all ${
                      isSelected
                        ? 'border-brand-orange bg-orange-50 text-brand-orange shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="text-lg">{val}+</div>
                    <div className="text-[10px] font-normal text-slate-400">{mileageUnit}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Custom Minimum Target ({mileageUnit})
                </label>
                <span className="text-xs text-slate-400">Leave blank if no strict minimum</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 45"
                value={mileageMin || ''}
                onChange={(e) => setMileageMin(e.target.value ? Number(e.target.value) : undefined)}
                className="w-24 text-right text-xl font-bold text-brand-navy bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:border-brand-orange outline-none"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 5: FEATURES ================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                  Which features matter most to you?
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                  Optional
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Select safety and convenience features. Variants with more selected equipment receive higher scores.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES_LIST.filter((f) => !(isEv && f.hideForEv)).map((feat) => {
                const isChecked = features.includes(feat.id);
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleToggleFeature(feat.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-3 ${
                      isChecked
                        ? 'border-brand-orange bg-orange-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        isChecked ? 'bg-brand-orange text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy text-sm">{feat.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{feat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (always visible in thumb zone & predictable location) */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 sm:px-10 rounded-b-3xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {/* Live hint footer strip (FR-108) */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse flex-shrink-0" />
            <span className="font-medium text-slate-700">{hintLoading ? 'Calculating...' : countHint}</span>
          </div>

          <div className="text-slate-400 hidden sm:block text-[11px]">
            {segment} &bull; INR {budgetMin.toLocaleString('en-IN')} - {budgetMax.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center px-7 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-sm transition shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Next Step <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit()}
              className="inline-flex items-center px-8 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-base transition shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95"
            >
              {isPending ? (
                <span>Generating Matches...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" /> Show My Matches
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
