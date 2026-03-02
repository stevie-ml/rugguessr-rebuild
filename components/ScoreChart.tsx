'use client';

import { useEffect, useState } from 'react';

interface ScoreChartProps {
  playerScore: number;
  roundResults: Array<{ score: number; distanceKm: number; rug: { title: string; location: { name: string } } }>;
}

export default function ScoreChart({ playerScore, roundResults }: ScoreChartProps) {
  const [dailyScores, setDailyScores] = useState<number[]>([]);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    // Submit score and get daily comparison
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: playerScore }),
    })
      .then(res => res.json())
      .then(data => {
        setDailyScores(data.scores || []);
        setPercentile(data.percentile);
        setTotalPlayers(data.totalPlayers || 0);
      })
      .catch(console.error);
  }, [playerScore]);

  // Create histogram buckets
  const maxPossible = 50000; // 5000 per round * 10 rounds
  const bucketCount = 10;
  const bucketSize = maxPossible / bucketCount;
  const buckets = new Array(bucketCount).fill(0);

  for (const s of dailyScores) {
    const idx = Math.min(Math.floor(s / bucketSize), bucketCount - 1);
    buckets[idx]++;
  }

  const maxBucket = Math.max(...buckets, 1);
  const playerBucket = Math.min(Math.floor(playerScore / bucketSize), bucketCount - 1);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Final score header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-1">Game Over!</h2>
        <div className="text-5xl font-bold text-amber-400 mb-1">
          {playerScore.toLocaleString()}
        </div>
        <div className="text-neutral-400">
          out of {maxPossible.toLocaleString()} possible points
        </div>
        {percentile !== null && totalPlayers > 1 && (
          <div className="mt-2 text-lg text-emerald-400">
            Better than {percentile}% of today&apos;s {totalPlayers} players
          </div>
        )}
      </div>

      {/* Round-by-round breakdown */}
      <div className="bg-neutral-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-3">Round Breakdown</h3>
        <div className="space-y-2">
          {roundResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-neutral-500 w-6 text-right">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-neutral-300" title={r.rug.title}>
                  {r.rug.location.name}
                </div>
              </div>
              <span className="text-neutral-400 text-xs w-20 text-right">
                {Math.round(r.distanceKm).toLocaleString()} km
              </span>
              <span className="text-amber-400 font-mono w-16 text-right">
                {r.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily histogram */}
      {dailyScores.length > 1 && (
        <div className="bg-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-3">
            Today&apos;s Scores
          </h3>
          <div className="flex items-end gap-1 h-32">
            {buckets.map((count, i) => {
              const height = (count / maxBucket) * 100;
              const isPlayer = i === playerBucket;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPlayer ? 'bg-amber-400' : 'bg-neutral-600'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {isPlayer && (
                    <div className="text-amber-400 text-xs">You</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>0</span>
            <span>{(maxPossible / 2).toLocaleString()}</span>
            <span>{maxPossible.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
