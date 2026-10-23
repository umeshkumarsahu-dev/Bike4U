'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Share2,
  Check,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { ScoredBikeResult, UserPreferences } from '@/lib/matching-engine/types';
import BikeDetailModal from './BikeDetailModal';
import ComparisonTable from './ComparisonTable';

interface ResultsViewProps {
  snapshotId: string;
  results: ScoredBikeResult[];
  inputs: UserPreferences;
  isRelaxed: boolean;
  relaxationMessage?: string;
  createdAt: string;
  datasetVersion: string;
  unlockHint?: {
    additionalBudgetNeeded?: number;
    bikesUnlocked?: number;
  };
}

export default function ResultsView({
  snapshotId,
  results,
  inputs,
  isRelaxed,
  relaxationMessage,
  createdAt,
  datasetVersion,
  unlockHint,
}: ResultsViewProps) {
  const router = useRouter();

  // Modals & views
  const [selectedBike, setSelectedBike] = useState<ScoredBikeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'compare'>('cards');

  // PDF downloading state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Feedback state (FR-306)
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState<boolean | null>(null);

  // Link copied state
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setDownloadError(null);

    try {
      const res = await fetch(`/api/reports/${snapshotId}/pdf`);
      if (!res.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BikeForU_Report_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${snapshotId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      setDownloadError('Could not download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    setFeedbackVote(helpful);
    setFeedbackSent(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId,
          helpful,
        }),
      });
    } catch (e) {
      // ignore
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F3F5F9] pb-32">
      {/* Sticky Top Inputs Summary Bar (FR-304) */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-1">Your Filters:</span>

            <span className="px-2.5 py-1 bg-slate-100 text-brand-navy font-semibold rounded-lg border border-slate-200">
              {inputs.segment}
            </span>

            <span className="px-2.5 py-1 bg-slate-100 text-brand-navy font-semibold rounded-lg border border-slate-200">
              INR {inputs.budgetMin.toLocaleString('en-IN')} - {inputs.budgetMax.toLocaleString('en-IN')}
            </span>

            {inputs.mileageMin && (
              <span className="px-2.5 py-1 bg-slate-100 text-brand-navy font-semibold rounded-lg border border-slate-200">
                {inputs.mileageMin}+ {inputs.segment === 'Electric' ? 'km/charge' : 'km/l'}
              </span>
            )}

            {inputs.styles && inputs.styles.length > 0 && !inputs.styles.includes('No preference') && (
              <span className="px-2.5 py-1 bg-slate-100 text-brand-navy font-semibold rounded-lg border border-slate-200">
                Style: {inputs.styles.join(', ')}
              </span>
            )}

            {inputs.features && inputs.features.length > 0 && (
              <span className="px-2.5 py-1 bg-slate-100 text-brand-navy font-semibold rounded-lg border border-slate-200">
                {inputs.features.length} Features Required
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/?segment=${inputs.segment}&min=${inputs.budgetMin}&max=${inputs.budgetMax}`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Edit Preferences
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              {copiedLink ? 'Link Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Relaxation Banner (FR-204, FR-506) */}
        {isRelaxed && relaxationMessage && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center space-x-3 text-sm text-brand-orange">
            <Info className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong className="font-bold">Recommendation Adjusted:</strong> {relaxationMessage}
            </div>
          </div>
        )}

        {/* View Switcher Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
              Your Top 5 Two-Wheeler Shortlist
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Prices are ex-showroom and indicative &bull; Verified dataset v{datasetVersion} as of {formattedDate}.
            </p>
          </div>

          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm text-xs font-bold">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'cards' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              Ranked Cards
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'compare' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              Side-by-Side Compare
            </button>
          </div>
        </div>

        {/* Empty State with Unlock Hint (FR-204 / 5.6 Step 4) */}
        {results.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
            <div className="w-16 h-16 bg-orange-100 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">No Matching Bikes Found</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              We couldn&apos;t find an active variant matching your exact combination of segment, budget limit, and minimum mileage.
            </p>

            {unlockHint && unlockHint.additionalBudgetNeeded ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-brand-orange mb-6 text-left">
                <strong>Unlock Hint:</strong> Raise your budget by about{' '}
                <strong>INR {unlockHint.additionalBudgetNeeded.toLocaleString('en-IN')}</strong> to unlock{' '}
                {unlockHint.bikesUnlocked || 3} great bikes in this segment.
              </div>
            ) : null}

            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-sm shadow-md transition"
            >
              Adjust Preferences
            </Link>
          </div>
        )}

        {/* ================= VIEW 1: RANKED CARDS ================= */}
        {activeTab === 'cards' && results.length > 0 && (
          <div className="space-y-4">
            {results.map((item, idx) => {
              const isEv = item.bike.bodyType === 'electric' || item.bike.segment === 'Electric';
              const effUnit = isEv ? 'km/charge' : 'km/l';
              const effVal = item.bike.araiMileage || item.bike.evRange;

              return (
                <div
                  key={item.bike.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Col 1: Rank & Image */}
                    <div className="lg:col-span-4 flex items-center space-x-4">
                      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                        <span className="text-2xl font-black text-brand-navy">#{idx + 1}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400">Rank</span>
                      </div>

                      <div className="w-36 h-28 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 flex-shrink-0">
                        <img
                          src={item.bike.heroImage || 'https://via.placeholder.com/300x200'}
                          alt={item.bike.modelName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div>
                        <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                          {item.bike.segment}
                        </div>
                        <h3 className="text-lg font-black text-brand-navy">
                          {item.bike.brandName} {item.bike.modelName}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">Variant: {item.bike.name}</div>
                      </div>
                    </div>

                    {/* Col 2: Key Numbers & Match Score */}
                    <div className="lg:col-span-3 grid grid-cols-2 gap-3 border-y lg:border-y-0 lg:border-x border-slate-100 py-3 lg:py-0 lg:px-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Ex-Showroom</span>
                        <div className="text-base font-black text-brand-navy">
                          INR {item.bike.exShowroomPrice.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">{item.bike.referenceCity}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {isEv ? 'Range' : 'Claimed'}
                        </span>
                        <div className="text-base font-black text-brand-green">
                          {effVal ? `${effVal} ${effUnit}` : 'N/A'}
                        </div>
                        <span className="text-[10px] text-slate-400">ARAI / Certified</span>
                      </div>
                    </div>

                    {/* Col 3: Why it matched & Trade-offs */}
                    <div className="lg:col-span-4 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {item.whyMatched.slice(0, 3).map((w, wIdx) => (
                          <span
                            key={wIdx}
                            className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200"
                          >
                            <Check className="w-3 h-3 mr-1 text-green-600 flex-shrink-0" /> {w}
                          </span>
                        ))}

                        {item.tradeOffs.slice(0, 2).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200"
                          >
                            <AlertCircle className="w-3 h-3 mr-1 text-red-500 flex-shrink-0" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Col 4: Match % Badge & CTA */}
                    <div className="lg:col-span-1 flex lg:flex-col items-center justify-between lg:justify-center gap-2">
                      <div className="text-center">
                        <div className="text-2xl font-black text-brand-green">{item.matchPercentage}%</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Match</div>
                      </div>

                      <button
                        onClick={() => setSelectedBike(item)}
                        className="px-3 py-1.5 rounded-xl bg-brand-light hover:bg-slate-200 text-brand-navy font-bold text-xs transition border border-slate-200"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= VIEW 2: SIDE-BY-SIDE COMPARE ================= */}
        {activeTab === 'compare' && results.length > 0 && (
          <ComparisonTable results={results} onSelectBike={(bike) => setSelectedBike(bike)} />
        )}

        {/* Feedback Section (FR-306) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div>
            <h4 className="font-bold text-brand-navy text-sm">Was this recommendation helpful?</h4>
            <p className="text-xs text-slate-500">Your anonymous feedback trains our scoring engine.</p>
          </div>

          {feedbackSent ? (
            <div className="text-xs font-semibold text-brand-green flex items-center">
              <Check className="w-4 h-4 mr-1" /> Thank you for your feedback!
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleFeedback(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 hover:bg-green-50 hover:border-green-300 text-slate-700 text-xs font-bold transition"
              >
                <ThumbsUp className="w-3.5 h-3.5 mr-1.5 text-green-600" /> Yes, helpful
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-300 text-slate-700 text-xs font-bold transition"
              >
                <ThumbsDown className="w-3.5 h-3.5 mr-1.5 text-red-500" /> Not quite
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar with PDF Download (FR-401, FR-403) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-brand-navy">Take this shortlist with you to dealerships</div>
            <div className="text-xs text-slate-400">
              Generates verified 9-page PDF with side-by-side comparison tables and QR code.
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {downloadError && <span className="text-xs text-red-500 font-medium mr-2">{downloadError}</span>}

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-brand-orange hover:bg-brand-orange-hover text-white font-black text-sm shadow-xl shadow-orange-500/25 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloadingPdf ? 'Generating PDF...' : 'Download Showroom PDF Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal for bike details */}
      <BikeDetailModal result={selectedBike} onClose={() => setSelectedBike(null)} />
    </div>
  );
}
