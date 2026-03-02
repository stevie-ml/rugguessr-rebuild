import { NextRequest, NextResponse } from 'next/server';
import { addDailyScore, getDailyScores } from '@/lib/cache';

export async function GET() {
  const scores = getDailyScores();
  return NextResponse.json({ scores, count: scores.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score } = body;

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    addDailyScore(score);
    const scores = getDailyScores();

    // Calculate percentile
    const sorted = [...scores].sort((a, b) => a - b);
    const rank = sorted.filter(s => s < score).length;
    const percentile = Math.round((rank / sorted.length) * 100);

    return NextResponse.json({
      score,
      percentile,
      totalPlayers: scores.length,
      scores: sorted,
    });
  } catch (err) {
    console.error('Score error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
