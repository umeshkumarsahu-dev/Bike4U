'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, Info } from 'lucide-react';

interface BikeImageProps {
  src?: string | null;
  alt: string;
  brandName?: string;
  modelName?: string;
  segment?: string;
  className?: string;
  imgClassName?: string;
  showVerifiedBadge?: boolean;
}

export default function BikeImage({
  src,
  alt,
  brandName,
  modelName,
  segment = 'Commuter',
  className = '',
  imgClassName = '',
  showVerifiedBadge = false,
}: BikeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Map segment to accurate vector silhouette
  const getSegmentSilhouette = () => {
    switch (segment) {
      case 'Electric':
        return '/images/electric.svg';
      case 'Sports':
        return '/images/sports.svg';
      case 'Cruiser':
        return '/images/cruiser.svg';
      case 'Adventure':
        return '/images/adventure.svg';
      case 'Scooter':
        return '/images/scooter.svg';
      default:
        return '/images/commuter.svg';
    }
  };

  const silhouette = getSegmentSilhouette();
  const showPlaceholder = !src || hasError;

  if (showPlaceholder) {
    return (
      <div
        className={`relative flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/90 rounded-2xl p-3 text-center select-none overflow-hidden ${className}`}
      >
        {/* Top category label */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>{segment}</span>
          <span className="flex items-center text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-medium text-[9px]">
            <Info className="w-2.5 h-2.5 mr-1" /> Photo Pending
          </span>
        </div>

        {/* Segment vector illustration */}
        <div className="my-1 w-full max-h-24 sm:max-h-28 flex items-center justify-center">
          <img
            src={silhouette}
            alt={`${segment} silhouette`}
            className="w-auto h-20 sm:h-24 object-contain opacity-85 transition-transform hover:scale-105 duration-200"
          />
        </div>

        {/* Bottom Model Name & Verified Specs label */}
        <div className="w-full border-t border-slate-200/60 pt-1.5">
          <div className="font-extrabold text-brand-navy text-xs tracking-tight truncate">
            {brandName && modelName ? `${brandName} ${modelName}` : alt}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            Specifications verified by Bike4U
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-slate-50 rounded-2xl ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />

      {showVerifiedBadge && isLoaded && (
        <span
          title="Verified OEM specification and genuine model image"
          className="absolute bottom-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-[9px] font-bold text-slate-600 shadow-sm border border-slate-200"
        >
          <ShieldCheck className="w-3 h-3 text-brand-green" />
          <span>OEM Verified</span>
        </span>
      )}
    </div>
  );
}
