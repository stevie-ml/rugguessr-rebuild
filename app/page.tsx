'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import RugPanel from '@/components/RugPanel';
import ScoreChart from '@/components/ScoreChart';
import { Rug, RoundResult } from '@/lib/types';

// Dynamic import for Leaflet (no SSR)
const GameMap = dynamic(() => import('@/components/GameMap'), { ssr: false });

const TOTAL_ROUNDS = 10;
const MAX_SCORE_PER_ROUND = 5000;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateScore(distanceKm: number): number {
  // Exponential decay: perfect at 0km, ~0 at 5000+km
  if (distanceKm < 1) return MAX_SCORE_PER_ROUND;
  const score = MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / 1500);
  return Math.max(0, Math.round(score));
}

type Phase = 'start' | 'loading' | 'guessing' | 'result' | 'finished';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('start');
  const [currentRug, setCurrentRug] = useState<Rug | null>(null);
  const [round, setRound] = useState(0);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [guessPos, setGuessPos] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmedGuess, setConfirmedGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadRetries, setLoadRetries] = useState(0);

  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);

  // Preloaded next rug
  const preloadedRef = useRef<Rug | null>(null);

  const fetchRug = useCallback(async (): Promise<Rug | null> => {
    try {
      const res = await fetch('/api/rugs/next');
      if (!res.ok) {
        if (res.status === 503) {
          return null; // Pool refreshing
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch rug:', err);
      return null;
    }
  }, []);

  const preloadNext = useCallback(async () => {
    const rug = await fetchRug();
    preloadedRef.current = rug;
  }, [fetchRug]);

  const loadRound = useCallback(async () => {
    setPhase('loading');
    setGuessPos(null);
    setConfirmedGuess(null);
    setCurrentDistance(null);
    setCurrentScore(null);
    setError(null);

    // Use preloaded rug if available
    let rug = preloadedRef.current;
    preloadedRef.current = null;

    if (!rug) {
      rug = await fetchRug();
    }

    if (!rug) {
      // Retry a few times
      if (loadRetries < 3) {
        setLoadRetries(prev => prev + 1);
        setTimeout(() => loadRound(), 2000);
        return;
      }
      setError('Could not load rugs. The pool may still be building. Please try again in a moment.');
      setPhase('guessing');
      return;
    }

    setLoadRetries(0);
    setCurrentRug(rug);
    setPhase('guessing');

    // Preload next rug in background
    preloadNext();
  }, [fetchRug, preloadNext, loadRetries]);

  const startGame = useCallback(() => {
    setRounds([]);
    setRound(1);
    loadRound();
  }, [loadRound]);

  const handleGuess = useCallback((lat: number, lng: number) => {
    setGuessPos({ lat, lng });
  }, []);

  const confirmGuess = useCallback(() => {
    if (!guessPos || !currentRug) return;

    const dist = haversineDistance(
      guessPos.lat, guessPos.lng,
      currentRug.location.lat, currentRug.location.lng
    );
    const score = calculateScore(dist);

    setConfirmedGuess(guessPos);
    setCurrentDistance(dist);
    setCurrentScore(score);
    setPhase('result');

    setRounds(prev => [...prev, {
      rug: currentRug,
      guessLat: guessPos.lat,
      guessLng: guessPos.lng,
      distanceKm: dist,
      score,
    }]);
  }, [guessPos, currentRug]);

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setPhase('finished');
    } else {
      setRound(prev => prev + 1);
      loadRound();
    }
  }, [round, loadRound]);

  // Start screen
  if (phase === 'start') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl font-bold mb-4 tracking-tight">
          <span className="text-amber-400">Rug</span>Guessr
        </h1>
        <p className="text-neutral-400 text-lg mb-8 text-center max-w-md">
          You&apos;ll see a rug from a museum collection. Place a pin on the map
          where you think it was made. {TOTAL_ROUNDS} rounds, up to {MAX_SCORE_PER_ROUND.toLocaleString()} points each.
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    );
  }

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <ScoreChart
          playerScore={totalScore}
          roundResults={rounds}
        />
        <button
          onClick={() => {
            setPhase('start');
            setRound(0);
            setRounds([]);
            setCurrentRug(null);
          }}
          className="mt-8 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Game screen (loading, guessing, result)
  return (
    <div className="h-screen flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <h1 className="text-xl font-bold">
          <span className="text-amber-400">Rug</span>Guessr
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-400">
            Round <span className="text-white font-semibold">{round}</span>/{TOTAL_ROUNDS}
          </span>
          <span className="text-amber-400 font-semibold">
            {totalScore.toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Rug image panel */}
        <div className="w-1/3 min-w-[300px] max-w-[500px] p-3 flex flex-col min-h-0">
          {phase === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="spinner" />
              <p className="text-neutral-400">Loading rug...</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={loadRound}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {currentRug && (phase === 'guessing' || phase === 'result') && (
            <RugPanel
              rug={currentRug}
              showDetails={phase === 'result'}
              distanceKm={currentDistance ?? undefined}
              score={currentScore ?? undefined}
            />
          )}
        </div>

        {/* Right: Map */}
        <div className="flex-1 relative min-h-0">
          <GameMap
            onGuess={handleGuess}
            actualLocation={phase === 'result' && currentRug ? currentRug.location : null}
            guessLocation={phase === 'result' ? confirmedGuess : null}
            disabled={phase !== 'guessing'}
          />

          {/* Confirm / Next buttons overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
            {phase === 'guessing' && guessPos && (
              <button
                onClick={confirmGuess}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg shadow-lg transition-colors text-lg"
              >
                Confirm Guess
              </button>
            )}
            {phase === 'result' && (
              <button
                onClick={nextRound}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg shadow-lg transition-colors text-lg"
              >
                {round >= TOTAL_ROUNDS ? 'See Results' : 'Next Rug'}
              </button>
            )}
          </div>

          {/* Score popup on result */}
          {phase === 'result' && currentScore !== null && currentDistance !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-sm rounded-xl px-6 py-3 text-center shadow-lg">
              <div className="text-3xl font-bold text-amber-400">{currentScore.toLocaleString()} pts</div>
              <div className="text-neutral-300 text-sm">
                {currentDistance < 1
                  ? 'Less than 1 km away!'
                  : `${Math.round(currentDistance).toLocaleString()} km away`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score bar at bottom */}
      <div className="h-2 bg-neutral-800">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${(totalScore / (MAX_SCORE_PER_ROUND * TOTAL_ROUNDS)) * 100}%` }}
        />
      </div>
    </div>
  );
}
