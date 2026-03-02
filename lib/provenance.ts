import { ProvenanceValidation } from './types';

// Well-known rug-producing cities/regions with coordinates
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // Iran
  'tabriz': { lat: 38.08, lng: 46.29 },
  'isfahan': { lat: 32.65, lng: 51.68 },
  'esfahan': { lat: 32.65, lng: 51.68 },
  'kashan': { lat: 33.98, lng: 51.44 },
  'kerman': { lat: 30.28, lng: 57.08 },
  'kirman': { lat: 30.28, lng: 57.08 },
  'hamadan': { lat: 34.80, lng: 48.51 },
  'hamedan': { lat: 34.80, lng: 48.51 },
  'mashhad': { lat: 36.31, lng: 59.60 },
  'meshad': { lat: 36.31, lng: 59.60 },
  'shiraz': { lat: 29.59, lng: 52.58 },
  'heriz': { lat: 38.15, lng: 47.17 },
  'serapi': { lat: 38.15, lng: 47.17 },
  'sarouk': { lat: 33.95, lng: 49.42 },
  'saruk': { lat: 33.95, lng: 49.42 },
  'nain': { lat: 32.86, lng: 53.09 },
  'qom': { lat: 34.64, lng: 50.88 },
  'qum': { lat: 34.64, lng: 50.88 },
  'bijar': { lat: 35.87, lng: 47.60 },
  'senneh': { lat: 35.31, lng: 47.00 },
  'sanandaj': { lat: 35.31, lng: 47.00 },
  'ardabil': { lat: 38.25, lng: 48.30 },
  'ardebil': { lat: 38.25, lng: 48.30 },
  'joshaghan': { lat: 33.50, lng: 51.58 },
  'sultanabad': { lat: 34.09, lng: 49.69 },
  'arak': { lat: 34.09, lng: 49.69 },
  'feraghan': { lat: 34.05, lng: 49.55 },
  'farahan': { lat: 34.05, lng: 49.55 },
  'veramin': { lat: 35.32, lng: 51.65 },
  'varamin': { lat: 35.32, lng: 51.65 },
  'yazd': { lat: 31.90, lng: 54.37 },
  'tehran': { lat: 35.69, lng: 51.39 },
  'birjand': { lat: 32.87, lng: 59.22 },
  'sistan': { lat: 30.97, lng: 61.50 },
  'khorasan': { lat: 35.10, lng: 58.80 },
  'ravar': { lat: 31.26, lng: 56.81 },
  'lavar': { lat: 31.26, lng: 56.81 },

  // Turkey
  'hereke': { lat: 40.79, lng: 29.63 },
  'ghiordes': { lat: 38.93, lng: 28.31 },
  'gördes': { lat: 38.93, lng: 28.31 },
  'konya': { lat: 37.87, lng: 32.48 },
  'ladik': { lat: 40.90, lng: 35.89 },
  'milas': { lat: 37.32, lng: 27.78 },
  'melas': { lat: 37.32, lng: 27.78 },
  'bergama': { lat: 39.12, lng: 27.18 },
  'oushak': { lat: 38.68, lng: 29.41 },
  'ushak': { lat: 38.68, lng: 29.41 },
  'usak': { lat: 38.68, lng: 29.41 },
  'kayseri': { lat: 38.73, lng: 35.49 },
  'sivas': { lat: 39.75, lng: 37.02 },
  'istanbul': { lat: 41.01, lng: 28.98 },
  'smyrna': { lat: 38.42, lng: 27.14 },
  'izmir': { lat: 38.42, lng: 27.14 },
  'kula': { lat: 38.55, lng: 28.65 },
  'demirci': { lat: 39.05, lng: 28.66 },
  'yuntdag': { lat: 38.80, lng: 27.50 },
  'manisa': { lat: 38.62, lng: 27.43 },
  'canakkale': { lat: 40.15, lng: 26.41 },
  'bandirma': { lat: 40.35, lng: 27.97 },
  'ezine': { lat: 39.78, lng: 26.35 },
  'bursa': { lat: 40.18, lng: 29.06 },
  'mucur': { lat: 39.07, lng: 34.39 },
  'kirsehir': { lat: 39.15, lng: 34.16 },

  // Caucasus
  'shirvan': { lat: 40.50, lng: 49.00 },
  'kuba': { lat: 41.36, lng: 48.51 },
  'baku': { lat: 40.41, lng: 49.87 },
  'karabagh': { lat: 39.82, lng: 46.76 },
  'karabakh': { lat: 39.82, lng: 46.76 },
  'moghan': { lat: 39.40, lng: 48.40 },
  'gendje': { lat: 40.68, lng: 46.36 },
  'ganja': { lat: 40.68, lng: 46.36 },
  'kazakh': { lat: 41.09, lng: 45.37 },
  'talish': { lat: 38.70, lng: 48.80 },
  'dagestan': { lat: 42.27, lng: 47.10 },
  'derbend': { lat: 42.06, lng: 48.29 },
  'derbent': { lat: 42.06, lng: 48.29 },
  'yerevan': { lat: 40.18, lng: 44.51 },
  'tbilisi': { lat: 41.72, lng: 44.79 },
  'tiflis': { lat: 41.72, lng: 44.79 },

  // Central Asia
  'bukhara': { lat: 39.77, lng: 64.42 },
  'bokhara': { lat: 39.77, lng: 64.42 },
  'samarkand': { lat: 39.65, lng: 66.96 },
  'samarqand': { lat: 39.65, lng: 66.96 },
  'khiva': { lat: 41.38, lng: 60.36 },
  'merv': { lat: 37.66, lng: 62.17 },
  'herat': { lat: 34.35, lng: 62.20 },
  'kabul': { lat: 34.53, lng: 69.17 },
  'mazar-i-sharif': { lat: 36.71, lng: 67.11 },
  'kunduz': { lat: 36.73, lng: 68.86 },
  'kashgar': { lat: 39.47, lng: 75.99 },
  'khotan': { lat: 37.11, lng: 79.93 },
  'hotan': { lat: 37.11, lng: 79.93 },
  'tashkent': { lat: 41.30, lng: 69.28 },
  'kokand': { lat: 40.53, lng: 70.94 },
  'fergana': { lat: 40.38, lng: 71.79 },
  'ashgabat': { lat: 37.96, lng: 58.33 },

  // India
  'agra': { lat: 27.18, lng: 78.02 },
  'jaipur': { lat: 26.92, lng: 75.79 },
  'lahore': { lat: 31.55, lng: 74.35 },
  'amritsar': { lat: 31.63, lng: 74.87 },
  'srinagar': { lat: 34.08, lng: 74.80 },
  'bhadohi': { lat: 25.40, lng: 82.57 },
  'mirzapur': { lat: 25.15, lng: 82.58 },
  'varanasi': { lat: 25.32, lng: 83.01 },
  'delhi': { lat: 28.61, lng: 77.23 },

  // China
  'beijing': { lat: 39.90, lng: 116.40 },
  'peking': { lat: 39.90, lng: 116.40 },
  'ningxia': { lat: 37.27, lng: 106.17 },
  'gansu': { lat: 36.06, lng: 103.83 },
  'baotou': { lat: 40.66, lng: 109.84 },
  'tianjin': { lat: 39.34, lng: 117.36 },
  'tientsin': { lat: 39.34, lng: 117.36 },
  'shanghai': { lat: 31.23, lng: 121.47 },

  // Morocco
  'fez': { lat: 34.03, lng: -5.00 },
  'fes': { lat: 34.03, lng: -5.00 },
  'marrakech': { lat: 31.63, lng: -8.00 },
  'rabat': { lat: 34.02, lng: -6.84 },
  'casablanca': { lat: 33.57, lng: -7.59 },
  'meknes': { lat: 33.89, lng: -5.55 },

  // Egypt
  'cairo': { lat: 30.04, lng: 31.24 },
  'fustat': { lat: 30.01, lng: 31.23 },

  // Europe
  'aubusson': { lat: 45.96, lng: 2.17 },
  'savonnerie': { lat: 48.83, lng: 2.22 },
  'axminster': { lat: 50.79, lng: -3.00 },
  'wilton': { lat: 51.08, lng: -1.86 },
  'donegal': { lat: 54.65, lng: -8.11 },
  'arraiolos': { lat: 38.72, lng: -7.99 },
  'cuenca': { lat: 40.07, lng: -2.14 },
  'alcaraz': { lat: 38.67, lng: -2.49 },
};

export function lookupLocation(provenance: string): { lat: number; lng: number } | null {
  const p = provenance.toLowerCase().trim();

  // Direct match
  if (KNOWN_LOCATIONS[p]) return KNOWN_LOCATIONS[p];

  // Check if any known location name is contained in the provenance string
  for (const [name, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (p.includes(name)) return coords;
  }

  return null;
}

export async function validateWithLLM(
  title: string,
  provenance: string,
  culture?: string
): Promise<ProvenanceValidation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fall back to heuristic if no API key
    const coords = lookupLocation(provenance);
    return {
      isSpecific: coords !== null,
      isRug: true,
      lat: coords?.lat,
      lng: coords?.lng,
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are helping filter items for a geography guessing game about rugs and carpets. The game asks players to guess WHERE a rug was MANUFACTURED/WOVEN — not where it is currently held.

Given this museum item:
- Title: "${title}"
- Stated origin/location: "${provenance}"
${culture ? `- Culture: "${culture}"` : ''}

Answer in JSON:
1. "isRug": Is this actually a rug, carpet, kilim, or flatweave? (not a painting, textile fragment, clothing, bag, or furniture)
2. "isManufactureOrigin": Does the stated origin refer to WHERE THE RUG WAS MADE (a weaving city/district)? Answer false if the stated origin is a museum name, gallery, collection, auction house, dealer, collector, or the city where the museum is located rather than where the rug was woven. Examples: "David Collection" = false (that's a museum in Copenhagen), "Tabriz" = true (rug-weaving city), "Metropolitan Museum" = false, "Heriz" = true, "Sotheby's" = false, "V&A" = false, "Konya" = true.
3. "isSpecific": Is the manufacturing location specific enough to pin on a map? A city or well-known rug-producing district = yes. A whole country, broad region, continent, or tribal/ethnic name = no. "Tabriz" = yes, "Turkey" = no, "Caucasus" = no, "Kazak" = no (tribal).
4. "lat": If isManufactureOrigin AND isSpecific, latitude of the manufacturing location
5. "lng": If isManufactureOrigin AND isSpecific, longitude of the manufacturing location
6. "reason": Brief explanation

Respond ONLY with valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('LLM validation failed:', response.status);
      const coords = lookupLocation(provenance);
      return { isSpecific: coords !== null, isRug: true, lat: coords?.lat, lng: coords?.lng };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const coords = lookupLocation(provenance);
      return { isSpecific: coords !== null, isRug: true, lat: coords?.lat, lng: coords?.lng };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isSpecific: parsed.isManufactureOrigin === true && parsed.isSpecific === true,
      isRug: parsed.isRug === true,
      lat: typeof parsed.lat === 'number' ? parsed.lat : undefined,
      lng: typeof parsed.lng === 'number' ? parsed.lng : undefined,
      reason: parsed.reason,
    };
  } catch (err) {
    console.error('LLM validation error:', err);
    const coords = lookupLocation(provenance);
    return { isSpecific: coords !== null, isRug: true, lat: coords?.lat, lng: coords?.lng };
  }
}
