import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://api.europeana.eu/record/v2/search.json';

export async function fetchEuropeanaRugs(): Promise<Rug[]> {
  const apiKey = process.env.EUROPEANA_API_KEY;
  if (!apiKey) return [];

  try {
    const start = Math.floor(Math.random() * 50) + 1;
    const res = await fetch(
      `${BASE}?query=carpet+OR+rug+OR+kilim+OR+teppich+OR+tapis&media=true&thumbnail=true&rows=30&start=${start}&wskey=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];

    const results: Rug[] = [];
    for (const item of items) {
      if (results.length >= 15) break;

      const title = item.title?.[0] || '';
      if (!looksLikeRug(title) && !looksLikeRug(item.dcDescription?.[0] || '')) continue;

      const imageUrl = item.edmIsShownBy?.[0] || item.edmPreview?.[0] || '';
      if (!imageUrl) continue;

      const provenance = item.edmPlaceLabel?.[0]?.def?.[0] ||
        item.dcCoverage?.[0] || '';
      if (!provenance || !provenanceIsSpecific(provenance)) continue;

      if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) continue;

      // Check for coordinates in the data
      let lat: number | undefined;
      let lng: number | undefined;
      if (item.edmPlaceLatitude?.[0] && item.edmPlaceLongitude?.[0]) {
        lat = parseFloat(item.edmPlaceLatitude[0]);
        lng = parseFloat(item.edmPlaceLongitude[0]);
      }

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const coords = lookupLocation(provenance);
        if (!coords) continue;
        lat = coords.lat;
        lng = coords.lng;
      }

      results.push({
        id: `eu-${item.id?.replace(/\//g, '-') || Math.random().toString(36).slice(2)}`,
        title,
        imageUrl,
        location: { name: provenance, lat, lng },
        source: 'Europeana',
        museumUrl: item.edmIsShownAt?.[0] || item.guid || '',
        date: item.year?.[0]?.toString(),
        medium: item.dcType?.[0],
        culture: provenance,
        collection: item.dataProvider?.[0],
      });
    }

    return results;
  } catch (err) {
    console.error('Europeana fetch error:', err);
    return [];
  }
}
