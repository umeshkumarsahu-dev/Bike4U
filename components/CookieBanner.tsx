'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bikeforu_dpdp_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bikeforu_dpdp_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('bikeforu_dpdp_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-brand-navy text-white shadow-2xl border-t border-slate-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3 text-xs sm:text-sm">
          <ShieldCheck className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">DPDP Act (2023) Compliance Notice:</span>{' '}
            <span className="text-slate-300">
              Bike for U does not collect personal identifiers, sell vehicle leads, or require sign-up. We store anonymous recommendation preferences to generate your shortlist and PDF report.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0 text-xs">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
          >
            Strictly Necessary Only
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
