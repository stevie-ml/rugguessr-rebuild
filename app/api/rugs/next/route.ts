import { NextResponse } from 'next/server';
import { Rug } from '@/lib/types';
import {
  getRugPool, isPoolStale, setRugPool,
  isPoolRefreshing, setPoolRefreshing, removeFromPool
} from '@/lib/cache';
import { validateWithLLM, lookupLocation } from '@/lib/provenance';
import { fetchMetRugs } from '@/lib/sources/met';
import { fetchAICRugs } from '@/lib/sources/aic';
import { fetchClevelandRugs } from '@/lib/sources/cleveland';
import { fetchVARugs } from '@/lib/sources/va';
import { fetchWikidataRugs } from '@/lib/sources/wikidata';
import { fetchDPLARugs } from '@/lib/sources/dpla';
import { fetchEuropeanaRugs } from '@/lib/sources/europeana';
import { fetchSmithsonianRugs } from '@/lib/sources/smithsonian';

async function refreshPool(): Promise<void> {
  if (isPoolRefreshing()) return;
  setPoolRefreshing(true);

  try {
    console.log('Refreshing rug pool...');

    // Fetch from all sources in parallel
    const [met, aic, cleveland, va, wikidata, dpla, europeana, smithsonian] =
      await Promise.allSettled([
        fetchMetRugs(),
        fetchAICRugs(),
        fetchClevelandRugs(),
        fetchVARugs(),
        fetchWikidataRugs(),
        fetchDPLARugs(),
        fetchEuropeanaRugs(),
        fetchSmithsonianRugs(),
      ]);

    const allRugs: Rug[] = [];
    const results = [met, aic, cleveland, va, wikidata, dpla, europeana, smithsonian];
    const names = ['Met', 'AIC', 'Cleveland', 'V&A', 'Wikidata', 'DPLA', 'Europeana', 'Smithsonian'];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        console.log(`${names[i]}: ${result.value.length} rugs`);
        allRugs.push(...result.value);
      } else {
        console.error(`${names[i]} failed:`, result.reason);
      }
    }

    // LLM validation pass - validate rugs that don't have coordinates from known locations
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const validated: Rug[] = [];

    for (const rug of allRugs) {
      // Quick heuristic check first
      const knownCoords = lookupLocation(rug.location.name);
      if (knownCoords) {
        // Known location - use our coordinates (more reliable)
        rug.location.lat = knownCoords.lat;
        rug.location.lng = knownCoords.lng;
        validated.push(rug);
        continue;
      }

      // If coordinates come from the source API (like Wikidata), validate with LLM
      if (hasApiKey && validated.length < 80) {
        try {
          const result = await validateWithLLM(rug.title, rug.location.name, rug.culture);
          if (result.isRug && result.isSpecific) {
            if (result.lat && result.lng) {
              rug.location.lat = result.lat;
              rug.location.lng = result.lng;
            }
            validated.push(rug);
          } else {
            console.log(`LLM rejected: "${rug.title}" (${rug.location.name}) - ${result.reason}`);
          }
        } catch {
          // If LLM fails, include rug if it has coordinates
          if (rug.location.lat && rug.location.lng) {
            validated.push(rug);
          }
        }
      } else if (rug.location.lat && rug.location.lng) {
        // No API key but has coordinates from source - include it
        validated.push(rug);
      }
    }

    // Shuffle the pool
    for (let i = validated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validated[i], validated[j]] = [validated[j], validated[i]];
    }

    setRugPool(validated);
    console.log(`Rug pool refreshed: ${validated.length} rugs from ${allRugs.length} candidates`);
  } catch (err) {
    console.error('Pool refresh error:', err);
  } finally {
    setPoolRefreshing(false);
  }
}

export async function GET() {
  try {
    // Refresh pool if stale or empty
    if (isPoolStale()) {
      await refreshPool();
    }

    const pool = getRugPool();
    if (pool.length === 0) {
      return NextResponse.json(
        { error: 'No rugs available. Pool is being refreshed, please try again.' },
        { status: 503 }
      );
    }

    // Pick a random rug and remove it from the pool so it won't repeat in this session
    const index = Math.floor(Math.random() * pool.length);
    const rug = pool[index];
    removeFromPool(rug.id);

    return NextResponse.json(rug);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
