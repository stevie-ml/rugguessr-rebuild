import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://api.dp.la/v2/items';

export async function fetchDPLARugs(): Promise<Rug[]> {
  const apiKey = process.env.DPLA_API_KEY;
  if (!apiKey) return [];

  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `${BASE}?q=carpet+rug+kilim&page=${page}&page_size=30&api_key=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data.docs || [];

    const results: Rug[] = [];
    for (const doc of docs) {
      if (results.length >= 15) break;

      const title = doc.sourceResource?.title?.[0] || doc.sourceResource?.title || '';
      if (!looksLikeRug(String(title))) continue;

      const imageUrl = doc.object || '';
      if (!imageUrl) continue;

      const spatial = doc.sourceResource?.spatial?.[0];
      const provenance = spatial?.name || spatial?.city || '';
      if (!provenance || !provenanceIsSpecific(provenance)) continue;

      if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) continue;

      // Try to get coordinates from spatial data or lookup
      let lat = parseFloat(spatial?.coordinates?.lat || '');
      let lng = parseFloat(spatial?.coordinates?.lon || '');

      if (isNaN(lat) || isNaN(lng)) {
        const coords = lookupLocation(provenance);
        if (!coords) continue;
        lat = coords.lat;
        lng = coords.lng;
      }

      results.push({
        id: `dpla-${doc.id}`,
        title: String(title),
        imageUrl,
        location: { name: provenance, lat, lng },
        source: 'DPLA',
        museumUrl: doc.isShownAt || `https://dp.la/item/${doc.id}`,
        date: doc.sourceResource?.date?.displayDate,
        medium: doc.sourceResource?.format?.[0],
        description: doc.sourceResource?.description?.[0],
        collection: doc.sourceResource?.collection?.title,
      });
    }

    return results;
  } catch (err) {
    console.error('DPLA fetch error:', err);
    return [];
  }
}
