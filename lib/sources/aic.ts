import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://api.artic.edu/api/v1';

export async function fetchAICRugs(): Promise<Rug[]> {
  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `${BASE}/artworks/search?q=carpet rug kilim&fields=id,title,image_id,place_of_origin,date_display,medium_display,dimensions,classification_title,api_link&limit=30&page=${page}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const artworks = data.data || [];
    const iiifBase = data.config?.iiif_url || 'https://www.artic.edu/iiif/2';

    const results: Rug[] = [];
    for (const art of artworks) {
      if (results.length >= 15) break;

      const title = art.title || '';
      if (!looksLikeRug(title) && !looksLikeRug(art.classification_title || '')) continue;

      if (!art.image_id) continue;
      const imageUrl = `${iiifBase}/${art.image_id}/full/843,/0/default.jpg`;

      const provenance = art.place_of_origin || '';
      if (!provenance || !provenanceIsSpecific(provenance)) continue;

      if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) continue;

      const coords = lookupLocation(provenance);
      if (!coords) continue;

      results.push({
        id: `aic-${art.id}`,
        title,
        imageUrl,
        location: { name: provenance, ...coords },
        source: 'Art Institute of Chicago',
        museumUrl: `https://www.artic.edu/artworks/${art.id}`,
        date: art.date_display,
        medium: art.medium_display,
        dimensions: art.dimensions,
        collection: 'Art Institute of Chicago',
      });
    }

    return results;
  } catch (err) {
    console.error('AIC fetch error:', err);
    return [];
  }
}
