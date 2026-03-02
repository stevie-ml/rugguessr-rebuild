import { Rug } from '../types';
import { looksLikeRug, provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';
import { lookupLocation } from '../provenance';

const BASE = 'https://api.si.edu/openaccess/api/v1.0/search';

export async function fetchSmithsonianRugs(): Promise<Rug[]> {
  const apiKey = process.env.SMITHSONIAN_API_KEY;
  if (!apiKey) return [];

  try {
    const start = Math.floor(Math.random() * 50);
    const res = await fetch(
      `${BASE}?q=carpet+rug+kilim&rows=30&start=${start}&api_key=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data.response?.rows || [];

    const results: Rug[] = [];
    for (const row of rows) {
      if (results.length >= 15) break;

      const content = row.content?.descriptiveNonRepeating || {};
      const freetext = row.content?.freetext || {};
      const indexed = row.content?.indexedStructured || {};

      const title = content.title?.content || row.title || '';
      if (!looksLikeRug(title)) continue;

      // Get image
      const media = content.online_media?.media;
      const imageUrl = media?.[0]?.content || media?.[0]?.thumbnail || '';
      if (!imageUrl) continue;

      // Get provenance from place, geoLocation, or culture
      const places = indexed.place || [];
      const geoLocations = indexed.geoLocation || [];
      const notes = freetext.notes || [];
      const placeNotes = freetext.place || [];

      let provenance = '';
      for (const p of placeNotes) {
        if (p.content && provenanceIsSpecific(p.content)) {
          provenance = p.content;
          break;
        }
      }
      if (!provenance) {
        for (const p of places) {
          if (provenanceIsSpecific(p)) {
            provenance = p;
            break;
          }
        }
      }
      if (!provenance) continue;

      if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) continue;

      // Try to get coordinates
      let lat: number | undefined;
      let lng: number | undefined;
      for (const geo of geoLocations) {
        if (geo.points?.point) {
          lat = parseFloat(geo.points.point.latitude?.content || '');
          lng = parseFloat(geo.points.point.longitude?.content || '');
        }
      }

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const coords = lookupLocation(provenance);
        if (!coords) continue;
        lat = coords.lat;
        lng = coords.lng;
      }

      const recordLink = content.record_link || '';
      results.push({
        id: `si-${row.id || Math.random().toString(36).slice(2)}`,
        title,
        imageUrl,
        location: { name: provenance, lat, lng },
        source: 'Smithsonian',
        museumUrl: recordLink,
        date: indexed.date?.[0],
        medium: freetext.physicalDescription?.[0]?.content,
        culture: indexed.culture?.[0],
        collection: content.data_source,
      });
    }

    return results;
  } catch (err) {
    console.error('Smithsonian fetch error:', err);
    return [];
  }
}
