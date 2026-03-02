'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  onGuess: (lat: number, lng: number) => void;
  actualLocation?: { lat: number; lng: number; name: string } | null;
  guessLocation?: { lat: number; lng: number } | null;
  disabled?: boolean;
}

export default function GameMap({ onGuess, actualLocation, guessLocation, disabled }: GameMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const actualMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);

  // Custom pin icon for the guess
  const guessPinIcon = L.divIcon({
    className: 'guess-pin',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.72 23.28 0 15 0z" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
      <circle cx="15" cy="14" r="6" fill="white"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });

  // Flag icon for the actual location
  const actualPinIcon = L.divIcon({
    className: 'actual-pin',
    html: `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#2ecc71" stroke="#27ae60" stroke-width="1"/>
      <text x="18" y="22" text-anchor="middle" font-size="18">🏁</text>
    </svg>`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (disabled) return;
    setSelectedPos({ lat: e.latlng.lat, lng: e.latlng.lng });
  }, [disabled]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 50],
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      worldCopyJump: true,
    });

    // Use OpenStreetMap tiles (Latin alphabet names)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click events
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on('click', handleMapClick);
    return () => { map.off('click', handleMapClick); };
  }, [handleMapClick]);

  // Update guess marker when position changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }

    if (selectedPos && !disabled) {
      guessMarkerRef.current = L.marker([selectedPos.lat, selectedPos.lng], { icon: guessPinIcon })
        .addTo(map);
      onGuess(selectedPos.lat, selectedPos.lng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPos, disabled]);

  // Show result: actual location, guess location, and connecting line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up previous result markers
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove();
      actualMarkerRef.current = null;
    }
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    if (actualLocation && guessLocation) {
      // Show actual location flag
      actualMarkerRef.current = L.marker(
        [actualLocation.lat, actualLocation.lng],
        { icon: actualPinIcon }
      ).addTo(map).bindPopup(
        `<strong>${actualLocation.name}</strong>`,
        { closeButton: false }
      ).openPopup();

      // Show guess marker (red pin)
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
      }
      guessMarkerRef.current = L.marker(
        [guessLocation.lat, guessLocation.lng],
        { icon: guessPinIcon }
      ).addTo(map).bindPopup('Your guess').openPopup();

      // Draw line between guess and actual
      lineRef.current = L.polyline(
        [
          [guessLocation.lat, guessLocation.lng],
          [actualLocation.lat, actualLocation.lng],
        ],
        {
          color: '#e74c3c',
          weight: 2,
          dashArray: '8, 8',
          opacity: 0.8,
        }
      ).addTo(map);

      // Fit map to show both points
      const bounds = L.latLngBounds(
        [guessLocation.lat, guessLocation.lng],
        [actualLocation.lat, actualLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualLocation, guessLocation]);

  // Reset map when starting new round
  useEffect(() => {
    if (!actualLocation && !guessLocation && mapRef.current) {
      // Clear all markers and lines
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
        guessMarkerRef.current = null;
      }
      if (actualMarkerRef.current) {
        actualMarkerRef.current.remove();
        actualMarkerRef.current = null;
      }
      if (lineRef.current) {
        lineRef.current.remove();
        lineRef.current = null;
      }
      setSelectedPos(null);
      mapRef.current.setView([30, 50], 3);
    }
  }, [actualLocation, guessLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      {!disabled && selectedPos && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-sm px-3 py-1 rounded-full">
          Click map to move pin
        </div>
      )}
    </div>
  );
}
