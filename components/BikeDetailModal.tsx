'use client';

import { ScoredBikeResult } from '@/lib/matching-engine/types';
import { X, ExternalLink, Check, AlertCircle, Shield, Gauge, Fuel, Info } from 'lucide-react';
import BikeImage from './BikeImage';

interface BikeDetailModalProps {
  result: ScoredBikeResult | null;
  onClose: () => void;
}

export default function BikeDetailModal({ result, onClose }: BikeDetailModalProps) {
  if (!result) return null;
  const { bike, matchPercentage, subScores, whyMatched, tradeOffs } = result;

  const isEv = bike.bodyType === 'electric' || bike.segment === 'Electric';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-navy text-white mb-1">
              {bike.segment}
            </div>
            <h2 className="text-2xl font-black text-brand-navy">
              {bike.brandName} {bike.modelName}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Variant: {bike.name} ({bike.modelYear})
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-black text-brand-green">{matchPercentage}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Match</div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Hero Image & Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <BikeImage
              src={bike.heroImage}
              alt={bike.modelName}
              brandName={bike.brandName}
              modelName={bike.modelName}
              segment={bike.segment}
              className="h-56 w-full shadow-sm"
              showVerifiedBadge={true}
            />

            <div className="space-y-4">
              <div className="bg-brand-light p-4 rounded-2xl border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500 block mb-0.5">Ex-Showroom Price</span>
                <div className="text-3xl font-black text-brand-navy">
                  INR {bike.exShowroomPrice.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Reference: {bike.referenceCity} &bull; Indicative figure
                </div>
              </div>

              <div className="bg-brand-light p-4 rounded-2xl border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500 block mb-0.5">
                  {isEv ? 'Certified Battery Range' : 'ARAI Mileage'}
                </span>
                <div className="text-2xl font-black text-brand-green">
                  {isEv ? `${bike.evRange || 'N/A'} km per charge` : `${bike.araiMileage || 'N/A'} km/l`}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {isEv ? 'IDC / ARAI Certified Range' : 'Official claimed economy'}
                </div>
              </div>
            </div>
          </div>

          {/* 5-Criteria Sub-Score Breakdown Bars */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-navy mb-4">
              Algorithm Score Breakdown
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Features Fit (25% Weight)', score: subScores.features },
                { label: 'Budget Alignment (20% Weight)', score: subScores.budget },
                { label: 'Segment Match (20% Weight)', score: subScores.segment },
                { label: 'Mileage / Range (20% Weight)', score: subScores.mileage },
                { label: 'Styling Fit (15% Weight)', score: subScores.style },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-brand-navy font-bold">{Math.round(item.score)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-orange h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why It Matched & Trade-Offs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-green-50/60 rounded-2xl border border-green-200">
              <h4 className="text-sm font-bold text-green-900 flex items-center mb-3">
                <Check className="w-4 h-4 mr-1.5 text-green-600" /> Why It Matched You
              </h4>
              <ul className="space-y-2 text-xs text-green-800">
                {whyMatched.map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 font-bold">&bull;</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-red-50/60 rounded-2xl border border-red-200">
              <h4 className="text-sm font-bold text-red-900 flex items-center mb-3">
                <AlertCircle className="w-4 h-4 mr-1.5 text-red-500" /> Honest Trade-offs
              </h4>
              {tradeOffs.length > 0 ? (
                <ul className="space-y-2 text-xs text-red-800">
                  {tradeOffs.map((t, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 font-bold">&bull;</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No significant trade-offs identified against your inputs.</p>
              )}
            </div>
          </div>

          {/* Detailed Specifications Table */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-navy mb-3">
              Full Specifications
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                <span className="font-semibold text-slate-600">Engine / Motor</span>
                <span className="font-medium text-slate-900">
                  {bike.engineCc ? `${bike.engineCc} cc (Petrol)` : `${bike.motorPower} kW Electric Motor`}
                </span>
              </div>
              <div className="grid grid-cols-2 p-3">
                <span className="font-semibold text-slate-600">Max Power</span>
                <span className="font-medium text-slate-900">{bike.maxPower || `${bike.motorPower} kW`}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                <span className="font-semibold text-slate-600">Max Torque</span>
                <span className="font-medium text-slate-900">{bike.maxTorque || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 p-3">
                <span className="font-semibold text-slate-600">Gearbox / Transmission</span>
                <span className="font-medium text-slate-900">{bike.gearbox || 'Direct Drive'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                <span className="font-semibold text-slate-600">Braking System</span>
                <span className="font-medium text-slate-900">
                  {bike.abs !== 'none' ? `${bike.abs.toUpperCase()} ABS` : 'Combined Brakes'} &bull;{' '}
                  {bike.discBrakes ? 'Front Disc' : 'Drum'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-3">
                <span className="font-semibold text-slate-600">Console & Connectivity</span>
                <span className="font-medium text-slate-900">
                  {bike.digitalConsole ? 'Digital LCD' : 'Analog'} &bull;{' '}
                  {bike.bluetooth ? 'Bluetooth Connected' : 'No Bluetooth'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                <span className="font-semibold text-slate-600">Kerb Weight</span>
                <span className="font-medium text-slate-900">{bike.kerbWeight ? `${bike.kerbWeight} kg` : 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 p-3">
                <span className="font-semibold text-slate-600">Seat Height & Clearance</span>
                <span className="font-medium text-slate-900">
                  {bike.seatHeight ? `${bike.seatHeight} mm` : 'N/A'} seat &bull;{' '}
                  {bike.groundClearance ? `${bike.groundClearance} mm` : 'N/A'} clearance
                </span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                <span className="font-semibold text-slate-600">Fuel Tank / Battery</span>
                <span className="font-medium text-slate-900">
                  {bike.fuelTankCapacity
                    ? `${bike.fuelTankCapacity} Litres`
                    : `${bike.batteryCapacity || 'N/A'} kWh Battery`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href={bike.sourceUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-semibold text-brand-navy hover:text-brand-orange transition"
          >
            Visit Official OEM Page <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
