'use client';

import { ScoredBikeResult } from '@/lib/matching-engine/types';
import { Check, X } from 'lucide-react';

interface ComparisonTableProps {
  results: ScoredBikeResult[];
  onSelectBike: (bike: ScoredBikeResult) => void;
}

export default function ComparisonTable({ results, onSelectBike }: ComparisonTableProps) {
  const topBikes = results.slice(0, 5);

  if (topBikes.length === 0) return null;

  // Find best value in key rows
  const lowestPrice = Math.min(...topBikes.map((b) => b.bike.exShowroomPrice));
  const highestEff = Math.max(
    ...topBikes.map((b) => b.bike.araiMileage || b.bike.evRange || 0)
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 overflow-hidden">
      <div className="mb-6">
        <h3 className="text-xl font-black text-brand-navy">Side-by-Side Comparison</h3>
        <p className="text-xs text-slate-500 mt-1">
          Comparing key metrics across your top recommendations. Green highlight denotes top performer in that row.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-brand-navy">
              <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider w-40">
                Specification
              </th>
              {topBikes.map((item, idx) => (
                <th key={item.bike.id} className="py-3 px-4 text-center min-w-[150px]">
                  <div className="text-[10px] font-bold text-brand-orange uppercase">Rank #{idx + 1}</div>
                  <div className="text-sm font-extrabold text-brand-navy mt-0.5">{item.bike.modelName}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{item.bike.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Match Score */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Match Score</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center font-black text-brand-green text-sm">
                  {item.matchPercentage}%
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Ex-Showroom Price</td>
              {topBikes.map((item) => {
                const isBest = item.bike.exShowroomPrice === lowestPrice;
                return (
                  <td
                    key={item.bike.id}
                    className={`py-3 px-4 text-center font-bold ${
                      isBest ? 'bg-green-50 text-green-700 font-black' : 'text-slate-900'
                    }`}
                  >
                    INR {item.bike.exShowroomPrice.toLocaleString('en-IN')}
                    {isBest && <span className="block text-[9px] uppercase font-bold text-green-600">Lowest</span>}
                  </td>
                );
              })}
            </tr>

            {/* Mileage / Range */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Mileage / Range</td>
              {topBikes.map((item) => {
                const val = item.bike.araiMileage || item.bike.evRange || 0;
                const isBest = val === highestEff;
                const unit = item.bike.segment === 'Electric' ? 'km/charge' : 'km/l';
                return (
                  <td
                    key={item.bike.id}
                    className={`py-3 px-4 text-center ${
                      isBest ? 'bg-green-50 text-green-700 font-black' : 'text-slate-900 font-medium'
                    }`}
                  >
                    {val} {unit}
                    {isBest && <span className="block text-[9px] uppercase font-bold text-green-600">Top Range</span>}
                  </td>
                );
              })}
            </tr>

            {/* Segment */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Segment</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center font-medium text-slate-700">
                  {item.bike.segment}
                </td>
              ))}
            </tr>

            {/* Engine / Motor */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Engine / Motor</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center font-medium text-slate-700">
                  {item.bike.engineCc ? `${item.bike.engineCc} cc` : `${item.bike.motorPower} kW`}
                </td>
              ))}
            </tr>

            {/* ABS */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Anti-Lock Brakes (ABS)</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center">
                  {item.bike.abs !== 'none' ? (
                    <span className="inline-flex items-center text-green-600 font-bold">
                      <Check className="w-3.5 h-3.5 mr-1" /> {item.bike.abs.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-slate-400">Combined</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Front Disc */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Front Disc Brake</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center">
                  {item.bike.discBrakes ? (
                    <Check className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )}
                </td>
              ))}
            </tr>

            {/* Digital Console */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Digital Console</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center">
                  {item.bike.digitalConsole ? (
                    <Check className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )}
                </td>
              ))}
            </tr>

            {/* Bluetooth */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Bluetooth Pairing</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center">
                  {item.bike.bluetooth ? (
                    <Check className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )}
                </td>
              ))}
            </tr>

            {/* Kerb Weight */}
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-700">Kerb Weight</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center font-medium text-slate-700">
                  {item.bike.kerbWeight ? `${item.bike.kerbWeight} kg` : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-700">Action</td>
              {topBikes.map((item) => (
                <td key={item.bike.id} className="py-3 px-4 text-center">
                  <button
                    onClick={() => onSelectBike(item)}
                    className="px-3 py-1.5 rounded-lg bg-brand-navy hover:bg-slate-800 text-white font-semibold text-[11px] transition"
                  >
                    View Specs
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
