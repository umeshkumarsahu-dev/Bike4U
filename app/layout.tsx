import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import CookieBanner from '@/components/CookieBanner';
import { Compass, FileText, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bike for U - Find Your Right Motorcycle or Scooter in Under 2 Minutes',
  description:
    'Five preferences in. Ranked matches and a downloadable verified PDF report out. Free Indian two-wheeler recommendations.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F3F5F9] text-brand-navy">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-1.5 group">
              <span className="text-2xl font-black tracking-tight text-brand-navy">
                BIKE<span className="text-brand-orange">4</span>U
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-orange-100 text-brand-orange rounded-full ml-2">
                MVP v1.0
              </span>
            </Link>

            <nav className="flex items-center space-x-4 sm:space-x-6 text-sm font-medium">
              <Link
                href="/#finder"
                className="inline-flex items-center text-slate-700 hover:text-brand-orange transition"
              >
                <Compass className="w-4 h-4 mr-1.5" /> Find Bike
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center text-slate-500 hover:text-brand-navy transition text-xs"
              >
                <Settings className="w-3.5 h-3.5 mr-1" /> Admin CMS
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <footer className="bg-brand-navy text-slate-300 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="text-2xl font-black text-white tracking-tight mb-3">
                  BIKE<span className="text-brand-orange">4</span>U
                </div>
                <p className="text-slate-400 text-sm max-w-sm mb-4">
                  Find the right motorcycle or scooter in under two minutes. Transparent, non-sponsored, deterministic recommendations.
                </p>
                <div className="text-xs text-slate-400">
                  Compliant with India's Digital Personal Data Protection Act, 2023. No account or phone number required.
                </div>
              </div>

              <div>
                <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
                  Browse Segments
                </h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/?segment=Commuter" className="hover:text-white transition">Commuter Motorcycles</Link></li>
                  <li><Link href="/?segment=Sports" className="hover:text-white transition">Sports Bikes</Link></li>
                  <li><Link href="/?segment=Cruiser" className="hover:text-white transition">Cruiser Motorcycles</Link></li>
                  <li><Link href="/?segment=Scooter" className="hover:text-white transition">Petrol Scooters</Link></li>
                  <li><Link href="/?segment=Electric" className="hover:text-white transition">Electric Scooters (EV)</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
                  Trust & Transparency
                </h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Data Source: Verified OEM Press & Portals</li>
                  <li>Pricing: Ex-Showroom (Reference Metro)</li>
                  <li>Scoring Engine: Open deterministic algorithm</li>
                  <li>Release: October 2026 Production Build</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
              <p>&copy; {new Date().getFullYear()} Bike for U. All rights reserved.</p>
              <p className="mt-2 sm:mt-0">Prices are ex-showroom and indicative; confirm with an authorized dealer.</p>
            </div>
          </div>
        </footer>

        {/* DPDP Act Banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
