import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, Shield, Fuel } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    brand: string;
    model: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brandSlug = params.brand.toLowerCase();
  const modelSlug = `${brandSlug}-${params.model.toLowerCase()}`;

  const model = await prisma.model.findFirst({
    where: {
      OR: [{ slug: modelSlug }, { slug: params.model.toLowerCase() }],
    },
    include: { brand: true, variants: { where: { status: 'active' }, take: 1 } },
  });

  if (!model) {
    return { title: 'Bike Not Found | Bike for U' };
  }

  const v = model.variants[0];
  const price = v ? `starting at INR ${v.exShowroomPrice.toLocaleString('en-IN')}` : '';

  return {
    title: `${model.brand.name} ${model.name} Price, Mileage, Specs & Variants | Bike for U`,
    description: `Complete buying guide for ${model.brand.name} ${model.name} (${model.segment}) ${price}. Detailed mileage, technical specs, and match ranking on Bike for U.`,
    alternates: {
      canonical: `https://www.bikeforu.in/bikes/${params.brand}/${params.model}`,
    },
  };
}

export default async function BikeModelPage({ params }: PageProps) {
  const brandSlug = params.brand.toLowerCase();
  const modelSlug = `${brandSlug}-${params.model.toLowerCase()}`;

  const model = await prisma.model.findFirst({
    where: {
      OR: [{ slug: modelSlug }, { slug: params.model.toLowerCase() }],
    },
    include: {
      brand: true,
      variants: {
        where: { status: 'active' },
        orderBy: { exShowroomPrice: 'asc' },
      },
    },
  });

  if (!model || model.variants.length === 0) {
    notFound();
  }

  const primaryVariant = model.variants[0];
  const isEv = model.segment === 'Electric' || model.bodyType === 'electric';

  // Schema.org Product structured data
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: `${model.brand.name} ${model.name}`,
    image: primaryVariant.heroImage || 'https://via.placeholder.com/600',
    description: model.description || `${model.brand.name} ${model.name} ${model.segment} two-wheeler`,
    brand: {
      '@type': 'Brand',
      name: model.brand.name,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: model.variants[0].exShowroomPrice,
      highPrice: model.variants[model.variants.length - 1].exShowroomPrice,
      priceValidUntil: '2026-12-31',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Schema.org injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-brand-navy hover:text-brand-orange mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Recommendation Finder
        </Link>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-blue-50 text-brand-navy rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                  {model.segment} &bull; {model.brand.name}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-2">
                  {model.brand.name} {model.name}
                </h1>
                <p className="text-slate-600 text-sm mb-6">
                  {model.description || `Verified specifications and ex-showroom price guide for ${model.brand.name} ${model.name}.`}
                </p>

                <div className="grid grid-cols-2 gap-4 bg-brand-light p-4 rounded-xl border border-slate-200 mb-6">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Ex-Showroom Price</span>
                    <p className="text-lg font-bold text-brand-navy">
                      INR {primaryVariant.exShowroomPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      {isEv ? 'Certified Range' : 'ARAI Mileage'}
                    </span>
                    <p className="text-lg font-bold text-brand-green">
                      {isEv
                        ? `${primaryVariant.evRange || 'N/A'} km/charge`
                        : `${primaryVariant.araiMileage || 'N/A'} km/l`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href={`/?segment=${model.segment}`}
                  className="w-full inline-flex items-center justify-center py-3 px-6 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold rounded-xl transition shadow-md"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Find if {model.name} fits you
                </Link>
              </div>
            </div>

            <div className="bg-slate-100 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l border-slate-200">
              <img
                src={primaryVariant.heroImage || 'https://via.placeholder.com/600x400'}
                alt={`${model.brand.name} ${model.name}`}
                className="max-h-72 w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Variants List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-brand-navy mb-4">
            Available Variants ({model.variants.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {model.variants.map((v) => (
              <div key={v.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{v.name}</h3>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span>{v.abs !== 'none' ? `${v.abs.toUpperCase()} ABS` : 'Combined Brakes'}</span>
                    <span>&bull;</span>
                    <span>{v.discBrakes ? 'Front Disc' : 'Drum Brakes'}</span>
                    <span>&bull;</span>
                    <span>{v.digitalConsole ? 'Digital Console' : 'Analog'}</span>
                    <span>&bull;</span>
                    <span>{v.bluetooth ? 'Bluetooth Connected' : 'No Bluetooth'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-brand-navy">
                    INR {v.exShowroomPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400">Ex-Showroom, {v.referenceCity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-4">Key Technical Specifications</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Engine / Motor</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {primaryVariant.engineCc ? `${primaryVariant.engineCc} cc` : `${primaryVariant.motorPower} kW`}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Power</span>
              <p className="font-semibold text-slate-900 mt-0.5">{primaryVariant.maxPower || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Torque</span>
              <p className="font-semibold text-slate-900 mt-0.5">{primaryVariant.maxTorque || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Kerb Weight</span>
              <p className="font-semibold text-slate-900 mt-0.5">{primaryVariant.kerbWeight ? `${primaryVariant.kerbWeight} kg` : 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Seat Height</span>
              <p className="font-semibold text-slate-900 mt-0.5">{primaryVariant.seatHeight ? `${primaryVariant.seatHeight} mm` : 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Ground Clearance</span>
              <p className="font-semibold text-slate-900 mt-0.5">{primaryVariant.groundClearance ? `${primaryVariant.groundClearance} mm` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
