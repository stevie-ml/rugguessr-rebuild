import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://api.vam.ac.uk/v2/objects/search';

export async function fetchVARugs(): Promise<Rug[]> {
  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `${BASE}?q=carpet rug kilim&images_exist=true&page=${page}&page_size=30&order_by=random`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const records = data.records || [];

    const results: Rug[] = [];
    for (const rec of records) {
      if (results.length >= 15) break;

      const title = rec._primaryTitle || rec._currentLocation?.displayName || '';
      const objectType = rec._objectType || '';
      if (!looksLikeRug(title) && !looksLikeRug(objectType)) continue;

      const imageId = rec._primaryImageId;
      if (!imageId) continue;
      const imageUrl = `https://framemark.vam.ac.uk/collections/${imageId}/full/full/0/default.jpg`;

      const placesOfOrigin = rec._primaryPlace || '';
      if (!placesOfOrigin || !provenanceIsSpecific(placesOfOrigin)) continue;

      if (isEuropeanOrAmerican(placesOfOrigin) && !shouldIncludeEuropean()) continue;

      const coords = lookupLocation(placesOfOrigin);
      if (!coords) continue;

      const sysNum = rec.systemNumber || '';
      results.push({
        id: `va-${sysNum}`,
        title: title || `${objectType} from ${placesOfOrigin}`,
        imageUrl,
        location: { name: placesOfOrigin, ...coords },
        source: 'Victoria and Albert Museum',
        museumUrl: `https://collections.vam.ac.uk/item/${sysNum}`,
        date: rec._primaryDate,
        medium: rec._primaryMaker?.name,
        culture: placesOfOrigin,
        collection: 'V&A',
      });
    }

    return results;
  } catch (err) {
    console.error('V&A fetch error:', err);
    return [];
  }
}
