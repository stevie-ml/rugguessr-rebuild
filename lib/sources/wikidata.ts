import { Rug } from '../types';
import { provenanceIsSpecific, isEuropeanOrAmerican, shouldIncludeEuropean } from '../rug-filter';

const ENDPOINT = 'https://query.wikidata.org/sparql';

// Wikidata should be the most common source - we fetch more from here
export async function fetchWikidataRugs(): Promise<Rug[]> {
  try {
    // Random offset for variety
    const offset = Math.floor(Math.random() * 200);

    const query = `
SELECT DISTINCT ?item ?itemLabel ?image ?placeLabel ?placeLat ?placeLon
       ?collectionLabel ?materialLabel ?dateLabel ?itemDescription
WHERE {
  # Items that are rugs, carpets, kilims, or instances of carpet
  {
    ?item wdt:P31/wdt:P279* wd:Q163446 .  # carpet
  } UNION {
    ?item wdt:P31 wd:Q163446 .  # instance of carpet
  } UNION {
    ?item wdt:P31 wd:Q15071054 . # kilim
  } UNION {
    ?item wdt:P31 wd:Q2558257 . # prayer rug
  }

  # Must have an image
  ?item wdt:P18 ?image .

  # Must have a place of creation with coordinates.
  # P1071 = location of creation (where it was MADE).
  # P276 (location) is deliberately excluded — it returns the museum, not the origin.
  # P495 (country of origin) is excluded — too broad for map-pinning.
  ?item wdt:P1071 ?place .
  ?place wdt:P625 ?coords .
  BIND(geof:latitude(?coords) AS ?placeLat)
  BIND(geof:longitude(?coords) AS ?placeLon)

  OPTIONAL { ?item wdt:P195 ?collection . }
  OPTIONAL { ?item wdt:P186 ?material . }
  OPTIONAL { ?item wdt:P571 ?date . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,fr,nl,it,es" . }
}
OFFSET ${offset}
LIMIT 60
`;

    const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'RugGuessr/1.0 (educational project)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Wikidata query failed:', res.status, await res.text().catch(() => ''));
      return [];
    }

    const data = await res.json();
    const bindings = data.results?.bindings || [];

    const results: Rug[] = [];
    const seen = new Set<string>();

    for (const b of bindings) {
      if (results.length >= 25) break; // More from Wikidata than other sources

      const itemUri = b.item?.value || '';
      const qid = itemUri.split('/').pop() || '';
      if (seen.has(qid)) continue;
      seen.add(qid);

      const title = b.itemLabel?.value || '';
      if (!title || title === qid) continue; // Skip items without labels

      const imageUrl = b.image?.value || '';
      if (!imageUrl) continue;

      const placeName = b.placeLabel?.value || '';
      if (!placeName || !provenanceIsSpecific(placeName)) continue;

      if (isEuropeanOrAmerican(placeName) && !shouldIncludeEuropean()) continue;

      const lat = parseFloat(b.placeLat?.value || '');
      const lng = parseFloat(b.placeLon?.value || '');
      if (isNaN(lat) || isNaN(lng)) continue;

      results.push({
        id: `wd-${qid}`,
        title,
        imageUrl,
        location: { name: placeName, lat, lng },
        source: 'Wikidata',
        museumUrl: `https://www.wikidata.org/wiki/${qid}`,
        date: b.dateLabel?.value,
        medium: b.materialLabel?.value,
        culture: placeName,
        collection: b.collectionLabel?.value,
        description: b.itemDescription?.value,
      });
    }

    return results;
  } catch (err) {
    console.error('Wikidata fetch error:', err);
    return [];
  }
}
