import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

export async function fetchMetRugs(): Promise<Rug[]> {
  try {
    // Search for rugs and carpets
    const searchRes = await fetch(
      `${BASE}/search?hasImages=true&q=carpet+rug+kilim&departmentId=14`,
      { cache: 'no-store' }
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const objectIDs: number[] = searchData.objectIDs || [];
    if (objectIDs.length === 0) return [];

    // Randomly sample up to 40 IDs to check
    const shuffled = objectIDs.sort(() => Math.random() - 0.5).slice(0, 40);

    const results: Rug[] = [];
    const fetches = shuffled.map(async (id) => {
      try {
        const res = await fetch(`${BASE}/objects/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const obj = await res.json();

        const title = obj.title || '';
        if (!looksLikeRug(title) && !looksLikeRug(obj.objectName || '')) return null;

        const imageUrl = obj.primaryImage || obj.primaryImageSmall;
        if (!imageUrl) return null;

        // Determine provenance from various fields
        const provenance = obj.city || obj.subregion || obj.locale || obj.region || obj.country || '';
        if (!provenance || !provenanceIsSpecific(provenance)) return null;

        if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) return null;

        const coords = lookupLocation(provenance);
        if (!coords) return null;

        return {
          id: `met-${obj.objectID}`,
          title,
          imageUrl,
          location: { name: provenance, ...coords },
          source: 'The Metropolitan Museum of Art',
          museumUrl: obj.objectURL || `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
          date: obj.objectDate,
          medium: obj.medium,
          dimensions: obj.dimensions,
          culture: obj.culture,
          collection: obj.department,
        } as Rug;
      } catch {
        return null;
      }
    });

    const fetched = await Promise.all(fetches);
    for (const r of fetched) {
      if (r) results.push(r);
      if (results.length >= 15) break;
    }

    return results;
  } catch (err) {
    console.error('Met fetch error:', err);
    return [];
  }
}
