import { Suspense } from 'react';
import RecommendationForm from '@/components/RecommendationForm';
import { Sparkles, ShieldCheck, Download, Award, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-white to-[#F3F5F9] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-brand-orange text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Consumer Two-Wheeler Shortlist</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-tight mb-6">
              Find your perfect ride in <span className="text-brand-orange">2 minutes</span>.
            </h1>

            {/* Sub-copy */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-8">
              Five plain questions in. Five ranked matches with honest trade-offs and a downloadable verified PDF report out.
            </p>

            {/* CTA and quick links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <a
                href="#finder"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-base shadow-xl shadow-orange-500/25 transition transform hover:-translate-y-0.5"
              >
                Find My Bike <ArrowRight className="w-5 h-5 ml-2" />
              </a>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition"
              >
                How Matching Works
              </a>
            </div>

            {/* Trust cues strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80 text-left">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-brand-green flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">100% Deterministic (No Sponsored Ads)</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-brand-navy flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">Verified OEM Specs (Oct 2026)</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Download className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">Free 9-Page Showroom PDF</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">No Login or Phone Required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Recommendation Engine Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading bike finder...</div>}>
          <RecommendationForm />
        </Suspense>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">The Process</span>
          <h2 className="text-3xl font-extrabold text-brand-navy mt-1">How Bike for U Works</h2>
          <p className="text-slate-500 text-sm mt-2">
            Eliminating technical jargon and showroom bias with plain-English recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange font-black text-xl flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Tell Us Your Needs</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Answer five simple questions on daily riding style, mileage target, safety features (ABS, disc brakes), and your maximum budget.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-navy font-black text-xl flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Deterministic Matching</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our transparent scoring engine filters out discontinued bikes, calculates five sub-scores, prevents brand spam, and explains why each bike fits.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-brand-green font-black text-xl flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Download Showroom PDF</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Get an instant, print-ready 9-page PDF report complete with side-by-side comparison tables, QR code, and a test ride checklist for dealers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
