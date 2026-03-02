'use client';

import { useState } from 'react';
import { Rug } from '@/lib/types';

interface RugPanelProps {
  rug: Rug;
  showDetails: boolean;
  distanceKm?: number;
  score?: number;
  onImageError?: () => void;
}

export default function RugPanel({ rug, showDetails, distanceKm, score, onImageError }: RugPanelProps) {
  const [zoomed, setZoomed] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const handleImageError = () => {
    setImgBroken(true);
    onImageError?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Rug image */}
      <div
        className={`relative cursor-pointer overflow-hidden rounded-lg bg-neutral-900 ${
          zoomed ? 'fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4' : 'flex-1 min-h-0'
        }`}
        onClick={() => !imgBroken && setZoomed(!zoomed)}
      >
        {imgBroken ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-neutral-500">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 16l5-5 4 4 4-4 5 5" />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <p className="text-sm">Image unavailable</p>
            <p className="text-xs text-neutral-600">Loading next rug...</p>
          </div>
        ) : (
          <>
            <img
              src={rug.imageUrl}
              alt={rug.title}
              className={`${
                zoomed
                  ? 'max-w-full max-h-full object-contain'
                  : 'w-full h-full object-contain'
              }`}
              loading="eager"
              onError={handleImageError}
            />
            {!zoomed && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Click to zoom
              </div>
            )}
            {zoomed && (
              <button
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-2xl w-10 h-10 rounded-full flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
              >
                &times;
              </button>
            )}
          </>
        )}
      </div>

      {/* Info below image */}
      {showDetails && (
        <div className="mt-3 p-3 bg-neutral-800 rounded-lg text-sm space-y-1 overflow-y-auto max-h-60">
          {/* Score banner */}
          {typeof score === 'number' && typeof distanceKm === 'number' && (
            <div className="mb-2 p-2 rounded bg-neutral-700 text-center">
              <div className="text-2xl font-bold text-amber-400">{score} pts</div>
              <div className="text-neutral-300">
                {distanceKm < 1
                  ? 'Less than 1 km away!'
                  : `${Math.round(distanceKm).toLocaleString()} km away`}
              </div>
            </div>
          )}

          <h3 className="font-semibold text-white text-base">{rug.title}</h3>

          {rug.location && (
            <p className="text-amber-300">
              Origin: {rug.location.name}
            </p>
          )}

          {rug.date && <p className="text-neutral-300">Date: {rug.date}</p>}
          {rug.medium && <p className="text-neutral-300">Medium: {rug.medium}</p>}
          {rug.dimensions && <p className="text-neutral-300">Dimensions: {rug.dimensions}</p>}
          {rug.culture && <p className="text-neutral-300">Culture: {rug.culture}</p>}
          {rug.collection && <p className="text-neutral-300">Collection: {rug.collection}</p>}
          {rug.description && <p className="text-neutral-400 text-xs">{rug.description}</p>}

          <p className="text-neutral-400 text-xs">
            Source: {rug.source}
            {rug.museumUrl && (
              <>
                {' — '}
                <a
                  href={rug.museumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View in collection
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
