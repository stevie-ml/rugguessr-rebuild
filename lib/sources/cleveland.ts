import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://openaccess-api.clevelandart.org/api/artworks';

export async function fetchClevelandRugs(): Promise<Rug[]> {
  try {
    const skip = Math.floor(Math.random() * 50);
    const res = await fetch(
      `${BASE}?q=carpet rug kilim&has_image=1&limit=30&skip=${skip}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const artworks = data.data || [];

    const results: Rug[] = [];
    for (const art of artworks) {
      if (results.length >= 15) break;

      const title = art.title || '';
      if (!looksLikeRug(title) && !looksLikeRug(art.type || '')) continue;

      const imageUrl = art.images?.web?.url;
      if (!imageUrl) continue;

      const provenance = art.culture?.[0] || art.creation_date_earliest
        ? (art.find_spot || '')
        : '';
      const origin = art.culture || art.find_spot || '';
      const provenanceStr = typeof origin === 'string' ? origin : Array.isArray(origin) ? origin[0] || '' : '';

      if (!provenanceStr || !provenanceIsSpecific(provenanceStr)) continue;
      if (isEuropeanOrAmerican(provenanceStr) && !shouldIncludeEuropean()) continue;

      const coords = lookupLocation(provenanceStr);
      if (!coords) continue;

      results.push({
        id: `cma-${art.id}`,
        title,
        imageUrl,
        location: { name: provenanceStr, ...coords },
        source: 'Cleveland Museum of Art',
        museumUrl: art.url || `https://www.clevelandart.org/art/${art.id}`,
        date: art.creation_date,
        medium: art.technique,
        dimensions: art.measurements,
        culture: typeof art.culture === 'string' ? art.culture : art.culture?.[0],
        collection: 'Cleveland Museum of Art',
      });
    }

    return results;
  } catch (err) {
    console.error('Cleveland fetch error:', err);
    return [];
  }
}
