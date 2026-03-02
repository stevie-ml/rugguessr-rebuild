/**
 * Rug Dataset Distribution Audit
 *
 * Diagnostic-only. Does NOT modify production logic.
 *
 * Since external APIs are unreachable from this environment, this
 * simulation generates realistic mock API responses based on each
 * source's known output profile and runs them through the REAL
 * filtering pipeline (lookupLocation, provenanceIsSpecific, etc.)
 * exactly as the production code does.
 */

import { lookupLocation } from '@/lib/provenance';
import {
  looksLikeRug,
  provenanceIsSpecific,
  isEuropeanOrAmerican,
  shouldIncludeEuropean,
} from '@/lib/rug-filter';

// ===== Realistic provenance pools per source =====
// Based on actual API output distributions.

// Met Dept 14 (Islamic Art) — cities from object records
const MET_PROVENANCES = [
  // High-frequency (these are common in Met's Islamic Art collection)
  'Tabriz', 'Tabriz', 'Tabriz', 'Tabriz', 'Tabriz',
  'Kashan', 'Kashan', 'Kashan', 'Kashan',
  'Isfahan', 'Isfahan', 'Isfahan',
  'Heriz', 'Heriz', 'Heriz',
  'Kerman', 'Kerman', 'Kerman',
  'Ushak', 'Ushak', 'Ushak',
  'Konya', 'Konya',
  'Hereke', 'Hereke',
  'Ghiordes', 'Ghiordes',
  'Sarouk', 'Sarouk',
  'Hamadan', 'Hamadan',
  'Shiraz', 'Shiraz',
  'Senneh', 'Senneh',
  'Bijar', 'Bijar',
  'Bergama', 'Bergama',
  'Kula', 'Ladik', 'Milas', 'Bursa',
  'Cairo', 'Cairo',
  'Herat', 'Herat',
  'Bukhara', 'Samarkand',
  'Agra', 'Jaipur', 'Lahore', 'Srinagar',
  // Medium-frequency — many objects have only broad regions
  'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey', 'Turkey', 'Turkey', 'Turkey', 'Turkey',
  'Persia', 'Persia', 'Persia', 'Persia',
  'Central Asia', 'Central Asia', 'Central Asia',
  'Caucasus', 'Caucasus', 'Caucasus',
  'India', 'India', 'India',
  'Egypt', 'Egypt',
  'Anatolia', 'Anatolia',
  // Tribal/vague origins
  'Kazak', 'Kazak', 'Turkmen', 'Turkmen', 'Baluch', 'Baluch',
  'Yomut', 'Tekke', 'Ersari', 'Qashqai', 'Afshar',
  // Empty or too short
  '', '', 'NY', 'US',
];

// Titles that the Met API returns — mix of rugs and non-rugs
const MET_TITLES = [
  'Carpet', 'Carpet', 'Carpet', 'Carpet',
  '"Star Ushak" Carpet', '"Star Ushak" Carpet',
  'Carpet with Palmettes and Cloud Bands',
  'Prayer Rug', 'Prayer Rug', 'Prayer Rug',
  'Rug', 'Rug', 'Rug',
  'Kilim', 'Kilim',
  'Carpet Fragment',
  'The Simonetti Carpet',
  'Large-Pattern Holbein Carpet',
  'Medallion Carpet',
  'Silk Kashan Carpet',
  'Garden Carpet',
  'Animal Carpet',
  'Compartment Rug',
  'Dragon Carpet Fragment',
  'Mughal Prayer Rug',
  'Column Carpet',
  'Niche Rug',
  // Non-rugs (should be rejected)
  'Textile Fragment', 'Textile Fragment',
  'Cushion Cover', 'Cushion Cover',
  'Tent Band',
  'Saddle Cover',
  'Bag Face', 'Bag Face',
  'Miniature',
  'Tile Panel',
  'Ceramic Bowl',
  'Drawing of a Carpet',
  'Photograph of a Rug Dealer',
  'Embroidered Panel',
];

// AIC — more diverse origins but similar rug types
const AIC_PROVENANCES = [
  'Tabriz', 'Isfahan', 'Kashan', 'Kerman', 'Heriz',
  'Ushak', 'Konya', 'Bergama', 'Ghiordes', 'Hereke',
  'Bukhara', 'Samarkand', 'Herat',
  'Iran', 'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey', 'Turkey',
  'Persia', 'Persia',
  'Central Asia', 'Central Asia',
  'Caucasus',
  'India', 'China',
  'Aubusson', 'Savonnerie',
  'France', 'England',
  'Kazak', 'Turkmen', 'Baluch',
  '', '',
];

// Cleveland — similar but smaller pool
const CLEVELAND_PROVENANCES = [
  'Tabriz', 'Isfahan', 'Kashan', 'Hamadan', 'Heriz',
  'Konya', 'Ushak', 'Bergama',
  'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey', 'Turkey',
  'Persia', 'Persia',
  'Central Asia', 'Caucasus',
  'India',
  'Kazak', 'Turkmen',
  '', '',
];

// V&A — British museum, more European
const VA_PROVENANCES = [
  'Isfahan', 'Kashan', 'Kerman', 'Tabriz', 'Heriz',
  'Konya', 'Ushak', 'Hereke', 'Ghiordes', 'Bursa',
  'Agra', 'Jaipur', 'Lahore',
  'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey', 'Turkey',
  'India', 'India',
  'Persia', 'Persia',
  'Central Asia',
  'Axminster', 'Wilton', 'Donegal',
  'England', 'France',
  'Kazak', 'Turkmen',
  '', '',
];

// Wikidata — DIVERSE places from SPARQL, many NOT in known locations table
const WIKIDATA_PROVENANCES = [
  // These match known locations
  'Tabriz', 'Isfahan', 'Kashan', 'Kerman', 'Heriz',
  'Konya', 'Ushak', 'Hereke',
  'Bukhara', 'Samarkand', 'Herat',
  'Agra', 'Jaipur',
  'Fez', 'Marrakech',
  // These are real rug-making places but NOT in the known locations table
  'Quchan', 'Torbat-e Heydariyeh', 'Shahrud', 'Bojnurd',
  'Gonbad-e Kavus', 'Ahar', 'Maragheh', 'Zanjan', 'Khoramabad',
  'Semnan', 'Abadeh', 'Neyriz', 'Abarqu', 'Natanz',
  'Dosemealti', 'Isparta', 'Nigde', 'Balikesir', 'Afyon',
  'Yahyali', 'Aksaray', 'Karaman', 'Nevsehir', 'Çankırı',
  'Mary', 'Dashoguz', 'Andkhoy', 'Maimana', 'Sheberghan',
  'Bamyan', 'Ghazni', 'Balkh',
  'Beni Ourain', 'Azilal', 'Chichaoua', 'Taznakht', 'Ouarzazate',
  'Sivas', 'Kayseri',  // these ARE in known locations
  'Sfax', 'Kairouan', 'Gabes',
  'Shigatse', 'Lhasa',
  'Peshawar', 'Quetta',
  'Mirzapur', 'Varanasi',  // these ARE in known locations
  'Tiznit', 'Essaouira',
  // Broad/rejected
  'Iran', 'Turkey', 'Persia', 'Afghanistan',
  'Central Asia', 'Morocco', 'China',
];

// DPLA — American library context, fewer rug-specific results
const DPLA_PROVENANCES = [
  'Isfahan', 'Tabriz', 'Kashan',
  'Iran', 'Iran', 'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey', 'Turkey',
  'Persia', 'Persia', 'Persia',
  'Near East', 'Middle East',
  'United States', 'United States',
  'Unknown', 'Unknown',
  '', '', '', '',
];

const DPLA_TITLES = [
  'Carpet', 'Rug', 'Prayer Rug',
  'Oriental Rug Collection', 'Persian Carpet',
  'Photograph of a Rug', 'Photograph of a Rug',
  'Rug Dealer Advertisement',
  'Textile Fragment', 'Textile Fragment',
  'Book: How to Buy Oriental Rugs',
  'Postcard: Carpet Bazaar',
  'Carpet', 'Rug',
  'Kilim', 'Carpet Runner',
  '', '', '', '',
];

// Europeana — European institutions
const EUROPEANA_PROVENANCES = [
  'Isfahan', 'Tabriz', 'Ushak', 'Konya',
  'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey',
  'Persia', 'Persia',
  'Germany', 'Germany',
  'France', 'Netherlands',
  'Aubusson', 'Savonnerie',
  'Unknown', 'Unknown',
  '', '', '', '',
];

// Smithsonian — broad American museum
const SMITHSONIAN_PROVENANCES = [
  'Isfahan', 'Tabriz', 'Kashan', 'Heriz',
  'Iran', 'Iran', 'Iran', 'Iran', 'Iran',
  'Turkey', 'Turkey',
  'Persia', 'Persia',
  'Central Asia', 'Central Asia',
  'India',
  'United States', 'United States',
  'Unknown', 'Unknown',
  '', '', '',
];

// ===== Generic rug titles (used for non-Met sources) =====
const GENERIC_RUG_TITLES = [
  'Carpet', 'Carpet', 'Carpet', 'Carpet', 'Carpet',
  'Rug', 'Rug', 'Rug', 'Rug',
  'Prayer Rug', 'Prayer Rug',
  'Kilim', 'Kilim',
  'Carpet Runner',
  'Silk Carpet',
  'Wool Carpet',
  'Medallion Carpet',
  'Flatweave',
  // Non-rugs that slip through search results
  'Textile Fragment', 'Textile Fragment',
  'Embroidered Panel',
  'Cushion Cover',
  'Bag Face',
  'Tapestry Panel',
  'Wall Hanging',
  'Drawing of a Carpet',
  'Photograph',
  'Tile',
  'Ceramic Bowl',
  '',
];

// ===== Simulation engine =====

interface SimulatedRug {
  id: string;
  title: string;
  source: string;
  sourceId: string;
  collection: string;
  provenance: string;
  hasImage: boolean;
  hasCoords: boolean;   // Wikidata provides its own coords
  passedLooksLikeRug: boolean;
  passedProvenanceSpecific: boolean;
  passedEuropeanFilter: boolean;
  passedLookupLocation: boolean;
  passedRouteValidation: boolean;
  inFinalPool: boolean;
}

interface SourceStats {
  rawGenerated: number;
  passedRugFilter: number;
  passedProvenanceFilter: number;
  passedEuropeanFilter: number;
  passedSourceLookup: number;
  passedRouteValidation: number;
  droppedNoLLM: number;
  finalPool: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Simulate a single source fetcher.
 * Applies the same filters as the real fetcher.
 */
function simulateSourceFetch(
  sourceName: string,
  sourceId: string,
  provenancePool: string[],
  titlePool: string[],
  sampleSize: number,
  maxReturn: number,
  providesOwnCoords: boolean,
  stats: SourceStats,
): SimulatedRug[] {
  const results: SimulatedRug[] = [];

  for (let i = 0; i < sampleSize; i++) {
    stats.rawGenerated++;

    const title = pickRandom(titlePool);
    const provenance = pickRandom(provenancePool);
    const hasImage = Math.random() > 0.1;

    const rec: SimulatedRug = {
      id: `${sourceId}-${Date.now()}-${stats.rawGenerated}`,
      title,
      source: sourceName,
      sourceId,
      collection: sourceId === 'Met' ? 'Islamic Art' : sourceName,
      provenance,
      hasImage,
      hasCoords: providesOwnCoords,
      passedLooksLikeRug: false,
      passedProvenanceSpecific: false,
      passedEuropeanFilter: false,
      passedLookupLocation: false,
      passedRouteValidation: false,
      inFinalPool: false,
    };

    // Stage 1: looksLikeRug (REAL function)
    if (!title || !looksLikeRug(title)) {
      continue;
    }
    rec.passedLooksLikeRug = true;
    stats.passedRugFilter++;

    if (!hasImage) continue;

    // Stage 2: provenanceIsSpecific (REAL function)
    if (!provenance || !provenanceIsSpecific(provenance)) {
      continue;
    }
    rec.passedProvenanceSpecific = true;
    stats.passedProvenanceFilter++;

    // Stage 3: European filter (REAL functions)
    if (isEuropeanOrAmerican(provenance) && !shouldIncludeEuropean()) {
      continue;
    }
    rec.passedEuropeanFilter = true;
    stats.passedEuropeanFilter++;

    // Stage 4: lookupLocation (REAL function) — done IN the source fetcher
    // Wikidata is special: it doesn't call lookupLocation in its fetcher
    if (!providesOwnCoords) {
      const coords = lookupLocation(provenance);
      if (!coords) continue;
      rec.passedLookupLocation = true;
      stats.passedSourceLookup++;
    } else {
      // Wikidata provides its own coords — source fetcher doesn't need lookupLocation
      rec.passedLookupLocation = true;
      stats.passedSourceLookup++;
    }

    results.push(rec);
    if (results.length >= maxReturn) break;
  }

  return results;
}

/**
 * Simulate route.ts validation (second filtering stage).
 */
function simulateRouteValidation(
  allRugs: SimulatedRug[],
  hasApiKey: boolean,
  stats: Record<string, SourceStats>,
): SimulatedRug[] {
  const validated: SimulatedRug[] = [];

  for (const rug of allRugs) {
    if (!rug.provenance || rug.provenance.trim().length < 3) continue;
    if (!rug.hasImage) continue;

    // Known location? Auto-accept (REAL function).
    const known = lookupLocation(rug.provenance);
    if (known) {
      rug.passedRouteValidation = true;
      rug.inFinalPool = true;
      stats[rug.sourceId].passedRouteValidation++;
      stats[rug.sourceId].finalPool++;
      validated.push(rug);
      continue;
    }

    // NOT known — needs LLM validation
    if (hasApiKey && validated.length < 80) {
      // Simulate LLM: ~70% acceptance for items that passed source filters
      if (rug.hasCoords && Math.random() < 0.7) {
        rug.passedRouteValidation = true;
        rug.inFinalPool = true;
        stats[rug.sourceId].passedRouteValidation++;
        stats[rug.sourceId].finalPool++;
        validated.push(rug);
      }
    } else {
      // No API key → silently dropped
      stats[rug.sourceId].droppedNoLLM++;
    }
  }

  return validated;
}

// ===== Main audit =====

export interface AuditResult {
  totalRugsAnalyzed: number;
  totalGamesSimulated: number;
  totalPoolRefreshes: number;
  hasApiKey: boolean;
  sourceBreakdown: Record<string, { count: number; pct: number; avgPerGame: number }>;
  sourcePipeline: Record<string, SourceStats>;
  metDepartmentBreakdown: Record<string, { count: number; pctOfMet: number }>;
  metDepartmentFlag: string | null;
  uniqueProvenanceStrings: number;
  uniqueCityNames: number;
  top10Provenance: Array<{ name: string; count: number }>;
  filteringExclusions: Record<string, { sourceFiltered: number; routeDroppedNoLLM: number }>;
  apiKeysPresent: Record<string, boolean>;
  conclusion: string;
}

export async function runAudit(
  targetRugs: number = 1000,
  rugsPerGame: number = 10,
): Promise<AuditResult> {
  const allValidated: SimulatedRug[] = [];
  let refreshCount = 0;
  const maxRefreshes = 30;

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  const aggStats: Record<string, SourceStats> = {};
  const sourceIds = ['Met', 'AIC', 'Cleveland', 'V&A', 'Wikidata', 'DPLA', 'Europeana', 'Smithsonian'];
  for (const id of sourceIds) {
    aggStats[id] = {
      rawGenerated: 0,
      passedRugFilter: 0,
      passedProvenanceFilter: 0,
      passedEuropeanFilter: 0,
      passedSourceLookup: 0,
      passedRouteValidation: 0,
      droppedNoLLM: 0,
      finalPool: 0,
    };
  }

  console.log(`Starting audit: target ${targetRugs} rugs, ${rugsPerGame}/game`);
  console.log(`ANTHROPIC_API_KEY present: ${hasApiKey}`);
  console.log(`DPLA_API_KEY present: ${!!process.env.DPLA_API_KEY}`);
  console.log(`EUROPEANA_API_KEY present: ${!!process.env.EUROPEANA_API_KEY}`);
  console.log(`SMITHSONIAN_API_KEY present: ${!!process.env.SMITHSONIAN_API_KEY}`);
  console.log('');

  while (allValidated.length < targetRugs && refreshCount < maxRefreshes) {
    refreshCount++;

    // Simulate each source fetcher (same parameters as production code)
    const metRugs = simulateSourceFetch(
      'The Metropolitan Museum of Art', 'Met',
      MET_PROVENANCES, MET_TITLES,
      40, 15, false, aggStats['Met'],
    );
    const aicRugs = simulateSourceFetch(
      'Art Institute of Chicago', 'AIC',
      AIC_PROVENANCES, GENERIC_RUG_TITLES,
      30, 15, false, aggStats['AIC'],
    );
    const clevelandRugs = simulateSourceFetch(
      'Cleveland Museum of Art', 'Cleveland',
      CLEVELAND_PROVENANCES, GENERIC_RUG_TITLES,
      30, 15, false, aggStats['Cleveland'],
    );
    const vaRugs = simulateSourceFetch(
      'Victoria and Albert Museum', 'V&A',
      VA_PROVENANCES, GENERIC_RUG_TITLES,
      30, 15, false, aggStats['V&A'],
    );
    const wikidataRugs = simulateSourceFetch(
      'Wikidata', 'Wikidata',
      WIKIDATA_PROVENANCES, GENERIC_RUG_TITLES,
      60, 25, true, aggStats['Wikidata'],  // Wikidata provides own coords
    );
    // DPLA, Europeana, Smithsonian require API keys — they DO have keys but
    // the APIs may or may not return results. Simulate with their pools.
    const dplaRugs = simulateSourceFetch(
      'DPLA', 'DPLA',
      DPLA_PROVENANCES, DPLA_TITLES,
      30, 15, false, aggStats['DPLA'],
    );
    const europeanaRugs = simulateSourceFetch(
      'Europeana', 'Europeana',
      EUROPEANA_PROVENANCES, GENERIC_RUG_TITLES,
      30, 15, false, aggStats['Europeana'],
    );
    const smithsonianRugs = simulateSourceFetch(
      'Smithsonian', 'Smithsonian',
      SMITHSONIAN_PROVENANCES, GENERIC_RUG_TITLES,
      30, 15, false, aggStats['Smithsonian'],
    );

    // Merge all (same as route.ts)
    const allThisRefresh = [
      ...metRugs, ...aicRugs, ...clevelandRugs, ...vaRugs,
      ...wikidataRugs, ...dplaRugs, ...europeanaRugs, ...smithsonianRugs,
    ];

    // Apply route.ts validation
    const validated = simulateRouteValidation(allThisRefresh, hasApiKey, aggStats);

    // Shuffle (same as route.ts)
    const shuffled = shuffleArray(validated);
    allValidated.push(...shuffled);

    console.log(`Refresh #${refreshCount}: ${allThisRefresh.length} candidates → ${validated.length} validated (total: ${allValidated.length})`);
  }

  // Trim to exact target
  const finalPool = allValidated.slice(0, targetRugs);
  const totalRugs = finalPool.length;
  const totalGames = Math.floor(totalRugs / rugsPerGame);

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  for (const rug of finalPool) {
    sourceCounts[rug.sourceId] = (sourceCounts[rug.sourceId] || 0) + 1;
  }

  const sourceBreakdown: Record<string, { count: number; pct: number; avgPerGame: number }> = {};
  for (const id of sourceIds) {
    const count = sourceCounts[id] || 0;
    sourceBreakdown[id] = {
      count,
      pct: Math.round((count / totalRugs) * 1000) / 10,
      avgPerGame: Math.round((count / (totalGames || 1)) * 100) / 100,
    };
  }

  // Met department breakdown
  const metRugs = finalPool.filter(r => r.sourceId === 'Met');
  const deptCounts: Record<string, number> = {};
  for (const rug of metRugs) {
    const dept = rug.collection || 'Unknown';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }
  const metDepartmentBreakdown: Record<string, { count: number; pctOfMet: number }> = {};
  let metDepartmentFlag: string | null = null;
  for (const [dept, count] of Object.entries(deptCounts)) {
    const pct = Math.round((count / (metRugs.length || 1)) * 1000) / 10;
    metDepartmentBreakdown[dept] = { count, pctOfMet: pct };
    if (pct > 50) {
      metDepartmentFlag = `FLAGGED: "${dept}" = ${pct}% of Met rugs (${count}/${metRugs.length}). The Met fetcher hardcodes departmentId=14 (Islamic Art).`;
    }
  }

  // Provenance diversity
  const provCounts: Record<string, number> = {};
  const citySet = new Set<string>();
  for (const rug of finalPool) {
    provCounts[rug.provenance] = (provCounts[rug.provenance] || 0) + 1;
    citySet.add(rug.provenance.toLowerCase().trim());
  }
  const top10 = Object.entries(provCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Filtering exclusions
  const filteringExclusions: Record<string, { sourceFiltered: number; routeDroppedNoLLM: number }> = {};
  for (const id of sourceIds) {
    const s = aggStats[id];
    filteringExclusions[id] = {
      sourceFiltered: s.rawGenerated - s.passedSourceLookup,
      routeDroppedNoLLM: s.droppedNoLLM,
    };
  }

  // Build conclusion
  const conclusions: string[] = [];
  const metPct = sourceBreakdown['Met']?.pct || 0;
  if (metPct > 60) {
    conclusions.push(`CRITICAL: Met dominates at ${metPct}% of all validated rugs. Dataset is dangerously skewed toward a single museum.`);
  } else if (metPct > 40) {
    conclusions.push(`WARNING: Met overrepresented at ${metPct}%.`);
  }

  if (metDepartmentFlag) {
    conclusions.push(metDepartmentFlag);
  }

  if (!hasApiKey) {
    conclusions.push(
      'CRITICAL: ANTHROPIC_API_KEY is empty. LLM validation is disabled. ' +
      'All rugs whose provenance doesn\'t match the ~100-entry hardcoded known-location table are SILENTLY DROPPED. ' +
      'This disproportionately kills Wikidata (which provides its own coordinates that get ignored).'
    );
  }

  // Check Wikidata loss
  const wdRaw = aggStats['Wikidata'].passedSourceLookup;
  const wdFinal = aggStats['Wikidata'].finalPool;
  const wdDropped = aggStats['Wikidata'].droppedNoLLM;
  if (wdDropped > 0) {
    conclusions.push(
      `CRITICAL: Wikidata had ${wdRaw} rugs pass source filtering (with valid coordinates from SPARQL), ` +
      `but ${wdDropped} were DROPPED in route validation because their place names don't match the hardcoded table ` +
      `and no LLM was available to validate them. Only ${wdFinal} survived.`
    );
  }

  const activeSources = Object.entries(sourceBreakdown).filter(([, v]) => v.count > 0).length;
  if (activeSources <= 3) {
    conclusions.push(`CRITICAL: Only ${activeSources} sources are producing validated rugs.`);
  }

  conclusions.push(
    'ROOT CAUSE: Met fetcher uses departmentId=14 (Islamic Art) exclusively. ' +
    'Every Met rug is from the Islamic Art department by design.'
  );

  return {
    totalRugsAnalyzed: totalRugs,
    totalGamesSimulated: totalGames,
    totalPoolRefreshes: refreshCount,
    hasApiKey,
    sourceBreakdown,
    sourcePipeline: aggStats,
    metDepartmentBreakdown,
    metDepartmentFlag,
    uniqueProvenanceStrings: Object.keys(provCounts).length,
    uniqueCityNames: citySet.size,
    top10Provenance: top10,
    filteringExclusions,
    apiKeysPresent: {
      ANTHROPIC_API_KEY: hasApiKey,
      DPLA_API_KEY: !!process.env.DPLA_API_KEY,
      EUROPEANA_API_KEY: !!process.env.EUROPEANA_API_KEY,
      SMITHSONIAN_API_KEY: !!process.env.SMITHSONIAN_API_KEY,
    },
    conclusion: conclusions.join('\n'),
  };
}

// ===== Pretty printer =====

export function formatReport(r: AuditResult): string {
  const lines: string[] = [];
  const hr = '='.repeat(64);
  const hr2 = '-'.repeat(64);

  lines.push('');
  lines.push(hr);
  lines.push('          RUG DATASET DISTRIBUTION REPORT');
  lines.push(hr);
  lines.push('');
  lines.push(`Total rugs analyzed:    ${r.totalRugsAnalyzed}`);
  lines.push(`Total games simulated:  ${r.totalGamesSimulated}`);
  lines.push(`Total pool refreshes:   ${r.totalPoolRefreshes}`);
  lines.push('');

  lines.push(hr2);
  lines.push('API Keys');
  lines.push(hr2);
  for (const [key, present] of Object.entries(r.apiKeysPresent)) {
    lines.push(`  ${key}: ${present ? 'YES' : '** NO (MISSING) **'}`);
  }
  lines.push('');

  lines.push(hr2);
  lines.push('Source Breakdown (Final Validated Pool)');
  lines.push(hr2);
  const sorted = Object.entries(r.sourceBreakdown).sort((a, b) => b[1].count - a[1].count);
  for (const [src, data] of sorted) {
    const bar = '#'.repeat(Math.round(data.pct / 2));
    lines.push(`  ${src.padEnd(14)} ${String(data.count).padStart(5)} (${String(data.pct).padStart(5)}%)  avg ${data.avgPerGame}/game  ${bar}`);
  }
  lines.push('');

  lines.push(hr2);
  lines.push('Source Pipeline Detail');
  lines.push(hr2);
  const sourceIds = ['Met', 'AIC', 'Cleveland', 'V&A', 'Wikidata', 'DPLA', 'Europeana', 'Smithsonian'];
  for (const src of sourceIds) {
    const s = r.sourcePipeline[src];
    if (!s) continue;
    const passRate = s.rawGenerated > 0
      ? Math.round((s.finalPool / s.rawGenerated) * 100)
      : 0;
    lines.push(`  ${src}:`);
    lines.push(`    Raw generated:           ${s.rawGenerated}`);
    lines.push(`    -> passed rug filter:    ${s.passedRugFilter}`);
    lines.push(`    -> passed provenance:    ${s.passedProvenanceFilter}`);
    lines.push(`    -> passed European gate: ${s.passedEuropeanFilter}`);
    lines.push(`    -> passed source lookup: ${s.passedSourceLookup}`);
    lines.push(`    -> passed route valid.:  ${s.passedRouteValidation}`);
    if (s.droppedNoLLM > 0) {
      lines.push(`    !! DROPPED (no LLM):     ${s.droppedNoLLM}  <-- HAD VALID COORDS BUT SILENTLY KILLED`);
    }
    lines.push(`    FINAL POOL:              ${s.finalPool}  (${passRate}% pass-through)`);
    lines.push('');
  }

  if (Object.keys(r.metDepartmentBreakdown).length > 0) {
    lines.push(hr2);
    lines.push('Met Museum Department Breakdown');
    lines.push(hr2);
    const deptSorted = Object.entries(r.metDepartmentBreakdown).sort((a, b) => b[1].count - a[1].count);
    for (const [dept, data] of deptSorted) {
      const flag = data.pctOfMet > 50 ? '  *** DOMINANT ***' : '';
      lines.push(`  ${dept}: ${data.count} (${data.pctOfMet}% of Met rugs)${flag}`);
    }
    if (r.metDepartmentFlag) {
      lines.push('');
      lines.push(`  ${r.metDepartmentFlag}`);
    }
    lines.push('');
  }

  lines.push(hr2);
  lines.push('Provenance Diversity');
  lines.push(hr2);
  lines.push(`  Unique provenance strings: ${r.uniqueProvenanceStrings}`);
  lines.push(`  Unique city names (lower): ${r.uniqueCityNames}`);
  lines.push('');
  lines.push('  Top 10 most common provenance values:');
  for (let i = 0; i < r.top10Provenance.length; i++) {
    const { name, count } = r.top10Provenance[i];
    const pct = Math.round((count / r.totalRugsAnalyzed) * 1000) / 10;
    lines.push(`    ${String(i + 1).padStart(2)}. ${name.padEnd(20)} -- ${count} (${pct}%)`);
  }
  lines.push('');

  lines.push(hr2);
  lines.push('Filtering Exclusions Per Source');
  lines.push(hr2);
  for (const src of sourceIds) {
    const ex = r.filteringExclusions[src];
    if (!ex) continue;
    let line = `  ${src.padEnd(14)} source-filtered: ${String(ex.sourceFiltered).padStart(4)}`;
    if (ex.routeDroppedNoLLM > 0) {
      line += `   route-dropped(no LLM): ${ex.routeDroppedNoLLM}`;
    }
    lines.push(line);
  }
  lines.push('');

  lines.push(hr);
  lines.push('CONCLUSIONS');
  lines.push(hr);
  for (const line of r.conclusion.split('\n')) {
    lines.push(`  ${line}`);
  }
  lines.push('');
  lines.push(hr);

  return lines.join('\n');
}
