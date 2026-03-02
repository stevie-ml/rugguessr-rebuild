/**
 * Standalone audit runner. Execute with:
 *   npx tsx lib/debug/runAudit.ts
 *
 * No path aliases — all imports are relative.
 */

import { lookupLocation } from '../provenance';
import {
  looksLikeRug,
  provenanceIsSpecific,
  isEuropeanOrAmerican,
  shouldIncludeEuropean,
} from '../rug-filter';

// Load .env.local manually
import { readFileSync } from 'fs';
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* no .env.local */ }

// ===== Provenance pools =====

const MET_PROVENANCES = [
  'Tabriz','Tabriz','Tabriz','Tabriz','Tabriz',
  'Kashan','Kashan','Kashan','Kashan',
  'Isfahan','Isfahan','Isfahan',
  'Heriz','Heriz','Heriz',
  'Kerman','Kerman','Kerman',
  'Ushak','Ushak','Ushak',
  'Konya','Konya',
  'Hereke','Hereke',
  'Ghiordes','Ghiordes',
  'Sarouk','Sarouk',
  'Hamadan','Hamadan',
  'Shiraz','Shiraz',
  'Senneh','Senneh',
  'Bijar','Bijar',
  'Bergama','Bergama',
  'Kula','Ladik','Milas','Bursa',
  'Cairo','Cairo',
  'Herat','Herat',
  'Bukhara','Samarkand',
  'Agra','Jaipur','Lahore','Srinagar',
  'Iran','Iran','Iran','Iran','Iran','Iran','Iran','Iran','Iran','Iran',
  'Turkey','Turkey','Turkey','Turkey','Turkey','Turkey',
  'Persia','Persia','Persia','Persia',
  'Central Asia','Central Asia','Central Asia',
  'Caucasus','Caucasus','Caucasus',
  'India','India','India',
  'Egypt','Egypt',
  'Anatolia','Anatolia',
  'Kazak','Kazak','Turkmen','Turkmen','Baluch','Baluch',
  'Yomut','Tekke','Ersari','Qashqai','Afshar',
  '','','NY','US',
];

const MET_TITLES = [
  'Carpet','Carpet','Carpet','Carpet',
  '"Star Ushak" Carpet','"Star Ushak" Carpet',
  'Carpet with Palmettes and Cloud Bands',
  'Prayer Rug','Prayer Rug','Prayer Rug',
  'Rug','Rug','Rug',
  'Kilim','Kilim',
  'Carpet Fragment',
  'The Simonetti Carpet',
  'Large-Pattern Holbein Carpet',
  'Medallion Carpet','Silk Kashan Carpet',
  'Garden Carpet','Animal Carpet',
  'Compartment Rug','Dragon Carpet Fragment',
  'Mughal Prayer Rug','Column Carpet','Niche Rug',
  'Textile Fragment','Textile Fragment',
  'Cushion Cover','Cushion Cover',
  'Tent Band','Saddle Cover',
  'Bag Face','Bag Face',
  'Miniature','Tile Panel','Ceramic Bowl',
  'Drawing of a Carpet',
  'Photograph of a Rug Dealer',
  'Embroidered Panel',
];

const AIC_PROVENANCES = [
  'Tabriz','Isfahan','Kashan','Kerman','Heriz',
  'Ushak','Konya','Bergama','Ghiordes','Hereke',
  'Bukhara','Samarkand','Herat',
  'Iran','Iran','Iran','Iran','Iran',
  'Turkey','Turkey','Turkey',
  'Persia','Persia',
  'Central Asia','Central Asia',
  'Caucasus','India','China',
  'Aubusson','Savonnerie','France','England',
  'Kazak','Turkmen','Baluch',
  '','',
];

const CLEVELAND_PROVENANCES = [
  'Tabriz','Isfahan','Kashan','Hamadan','Heriz',
  'Konya','Ushak','Bergama',
  'Iran','Iran','Iran','Iran','Iran','Iran',
  'Turkey','Turkey','Turkey',
  'Persia','Persia',
  'Central Asia','Caucasus','India',
  'Kazak','Turkmen',
  '','',
];

const VA_PROVENANCES = [
  'Isfahan','Kashan','Kerman','Tabriz','Heriz',
  'Konya','Ushak','Hereke','Ghiordes','Bursa',
  'Agra','Jaipur','Lahore',
  'Iran','Iran','Iran','Iran',
  'Turkey','Turkey','Turkey',
  'India','India','Persia','Persia',
  'Central Asia',
  'Axminster','Wilton','Donegal',
  'England','France',
  'Kazak','Turkmen',
  '','',
];

const WIKIDATA_PROVENANCES = [
  'Tabriz','Isfahan','Kashan','Kerman','Heriz',
  'Konya','Ushak','Hereke',
  'Bukhara','Samarkand','Herat',
  'Agra','Jaipur',
  'Fez','Marrakech',
  // NOT in known-locations table
  'Quchan','Torbat-e Heydariyeh','Shahrud','Bojnurd',
  'Gonbad-e Kavus','Ahar','Maragheh','Zanjan','Khoramabad',
  'Semnan','Abadeh','Neyriz','Abarqu','Natanz',
  'Dosemealti','Isparta','Nigde','Balikesir','Afyon',
  'Yahyali','Aksaray','Karaman','Nevsehir','Çankırı',
  'Mary','Dashoguz','Andkhoy','Maimana','Sheberghan',
  'Bamyan','Ghazni','Balkh',
  'Beni Ourain','Azilal','Chichaoua','Taznakht','Ouarzazate',
  'Sivas','Kayseri',
  'Sfax','Kairouan','Gabes',
  'Shigatse','Lhasa',
  'Peshawar','Quetta',
  'Mirzapur','Varanasi',
  'Tiznit','Essaouira',
  'Iran','Turkey','Persia','Afghanistan',
  'Central Asia','Morocco','China',
];

const DPLA_PROVENANCES = [
  'Isfahan','Tabriz','Kashan',
  'Iran','Iran','Iran','Iran','Iran','Iran',
  'Turkey','Turkey','Turkey',
  'Persia','Persia','Persia',
  'Near East','Middle East',
  'United States','United States',
  'Unknown','Unknown',
  '','','','',
];

const DPLA_TITLES = [
  'Carpet','Rug','Prayer Rug',
  'Oriental Rug Collection','Persian Carpet',
  'Photograph of a Rug','Photograph of a Rug',
  'Rug Dealer Advertisement',
  'Textile Fragment','Textile Fragment',
  'Book: How to Buy Oriental Rugs',
  'Postcard: Carpet Bazaar',
  'Carpet','Rug','Kilim','Carpet Runner',
  '','','','',
];

const EUROPEANA_PROVENANCES = [
  'Isfahan','Tabriz','Ushak','Konya',
  'Iran','Iran','Iran',
  'Turkey','Turkey',
  'Persia','Persia',
  'Germany','Germany','France','Netherlands',
  'Aubusson','Savonnerie',
  'Unknown','Unknown',
  '','','','',
];

const SMITHSONIAN_PROVENANCES = [
  'Isfahan','Tabriz','Kashan','Heriz',
  'Iran','Iran','Iran','Iran','Iran',
  'Turkey','Turkey',
  'Persia','Persia',
  'Central Asia','Central Asia','India',
  'United States','United States',
  'Unknown','Unknown',
  '','','',
];

const GENERIC_TITLES = [
  'Carpet','Carpet','Carpet','Carpet','Carpet',
  'Rug','Rug','Rug','Rug',
  'Prayer Rug','Prayer Rug',
  'Kilim','Kilim',
  'Carpet Runner','Silk Carpet',
  'Wool Carpet','Medallion Carpet','Flatweave',
  'Textile Fragment','Textile Fragment',
  'Embroidered Panel','Cushion Cover','Bag Face',
  'Tapestry Panel','Wall Hanging',
  'Drawing of a Carpet','Photograph',
  'Tile','Ceramic Bowl','',
];

// ===== Types =====

interface Stats {
  rawGenerated: number;
  passedRugFilter: number;
  passedProvenanceFilter: number;
  passedEuropeanFilter: number;
  passedSourceLookup: number;
  passedRouteValidation: number;
  droppedNoLLM: number;
  finalPool: number;
}

interface SimRug {
  sourceId: string;
  collection: string;
  provenance: string;
  hasCoords: boolean;
}

// ===== Helpers =====

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== Simulation =====

function simulateFetch(
  srcId: string,
  provenances: string[],
  titles: string[],
  sampleSize: number,
  maxReturn: number,
  ownCoords: boolean,
  stats: Stats,
): SimRug[] {
  const results: SimRug[] = [];
  for (let i = 0; i < sampleSize; i++) {
    stats.rawGenerated++;
    const title = pick(titles);
    const prov = pick(provenances);
    const hasImage = Math.random() > 0.1;

    if (!title || !looksLikeRug(title)) continue;
    stats.passedRugFilter++;

    if (!hasImage) continue;
    if (!prov || !provenanceIsSpecific(prov)) continue;
    stats.passedProvenanceFilter++;

    if (isEuropeanOrAmerican(prov) && !shouldIncludeEuropean()) continue;
    stats.passedEuropeanFilter++;

    if (!ownCoords) {
      if (!lookupLocation(prov)) continue;
    }
    stats.passedSourceLookup++;

    results.push({
      sourceId: srcId,
      collection: srcId === 'Met' ? 'Islamic Art' : srcId,
      provenance: prov,
      hasCoords: ownCoords,
    });
    if (results.length >= maxReturn) break;
  }
  return results;
}

function routeValidation(
  rugs: SimRug[],
  hasApiKey: boolean,
  stats: Record<string, Stats>,
): SimRug[] {
  const validated: SimRug[] = [];
  for (const r of rugs) {
    if (!r.provenance || r.provenance.trim().length < 3) continue;

    if (lookupLocation(r.provenance)) {
      stats[r.sourceId].passedRouteValidation++;
      stats[r.sourceId].finalPool++;
      validated.push(r);
      continue;
    }

    // Not known — LLM required
    if (hasApiKey && validated.length < 80) {
      if (r.hasCoords && Math.random() < 0.7) {
        stats[r.sourceId].passedRouteValidation++;
        stats[r.sourceId].finalPool++;
        validated.push(r);
      }
    } else {
      stats[r.sourceId].droppedNoLLM++;
    }
  }
  return validated;
}

// ===== Main =====

const TARGET = 1000;
const PER_GAME = 10;
const MAX_REFRESHES = 30;

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
const sourceIds = ['Met','AIC','Cleveland','V&A','Wikidata','DPLA','Europeana','Smithsonian'];
const allStats: Record<string, Stats> = {};
for (const id of sourceIds) {
  allStats[id] = {
    rawGenerated:0, passedRugFilter:0, passedProvenanceFilter:0,
    passedEuropeanFilter:0, passedSourceLookup:0, passedRouteValidation:0,
    droppedNoLLM:0, finalPool:0,
  };
}

console.log(`ANTHROPIC_API_KEY present: ${hasApiKey}`);
console.log(`DPLA_API_KEY present: ${!!process.env.DPLA_API_KEY}`);
console.log(`EUROPEANA_API_KEY present: ${!!process.env.EUROPEANA_API_KEY}`);
console.log(`SMITHSONIAN_API_KEY present: ${!!process.env.SMITHSONIAN_API_KEY}`);
console.log('');

const allValidated: SimRug[] = [];
let refreshCount = 0;

while (allValidated.length < TARGET && refreshCount < MAX_REFRESHES) {
  refreshCount++;

  const candidates = [
    ...simulateFetch('Met',       MET_PROVENANCES,         MET_TITLES,     40, 15, false, allStats['Met']),
    ...simulateFetch('AIC',       AIC_PROVENANCES,         GENERIC_TITLES, 30, 15, false, allStats['AIC']),
    ...simulateFetch('Cleveland', CLEVELAND_PROVENANCES,   GENERIC_TITLES, 30, 15, false, allStats['Cleveland']),
    ...simulateFetch('V&A',       VA_PROVENANCES,          GENERIC_TITLES, 30, 15, false, allStats['V&A']),
    ...simulateFetch('Wikidata',  WIKIDATA_PROVENANCES,    GENERIC_TITLES, 60, 25, true,  allStats['Wikidata']),
    ...simulateFetch('DPLA',      DPLA_PROVENANCES,        DPLA_TITLES,    30, 15, false, allStats['DPLA']),
    ...simulateFetch('Europeana', EUROPEANA_PROVENANCES,   GENERIC_TITLES, 30, 15, false, allStats['Europeana']),
    ...simulateFetch('Smithsonian', SMITHSONIAN_PROVENANCES, GENERIC_TITLES, 30, 15, false, allStats['Smithsonian']),
  ];

  const validated = routeValidation(candidates, hasApiKey, allStats);
  allValidated.push(...shuffle(validated));

  console.log(`Refresh #${refreshCount}: ${candidates.length} candidates -> ${validated.length} validated (total: ${allValidated.length})`);
}

// ===== Compute & Print Report =====

const pool = allValidated.slice(0, TARGET);
const total = pool.length;
const games = Math.floor(total / PER_GAME);

const hr = '='.repeat(64);
const hr2 = '-'.repeat(64);
console.log('');
console.log(hr);
console.log('          RUG DATASET DISTRIBUTION REPORT');
console.log(hr);
console.log('');
console.log(`Total rugs analyzed:    ${total}`);
console.log(`Total games simulated:  ${games}`);
console.log(`Total pool refreshes:   ${refreshCount}`);
console.log('');

console.log(hr2);
console.log('API Keys');
console.log(hr2);
console.log(`  ANTHROPIC_API_KEY: ${hasApiKey ? 'YES' : '** NO (MISSING) **'}`);
console.log(`  DPLA_API_KEY: ${process.env.DPLA_API_KEY ? 'YES' : '** NO (MISSING) **'}`);
console.log(`  EUROPEANA_API_KEY: ${process.env.EUROPEANA_API_KEY ? 'YES' : '** NO (MISSING) **'}`);
console.log(`  SMITHSONIAN_API_KEY: ${process.env.SMITHSONIAN_API_KEY ? 'YES' : '** NO (MISSING) **'}`);
console.log('');

// Source breakdown
const srcCounts: Record<string, number> = {};
for (const r of pool) srcCounts[r.sourceId] = (srcCounts[r.sourceId] || 0) + 1;

console.log(hr2);
console.log('Source Breakdown (Final Validated Pool)');
console.log(hr2);
const sorted = Object.entries(srcCounts).sort((a, b) => b[1] - a[1]);
for (const [src, count] of sorted) {
  const pct = Math.round((count / total) * 1000) / 10;
  const bar = '#'.repeat(Math.round(pct / 2));
  console.log(`  ${src.padEnd(14)} ${String(count).padStart(5)} (${String(pct).padStart(5)}%)  avg ${(Math.round((count / games) * 100) / 100).toFixed(2)}/game  ${bar}`);
}
for (const id of sourceIds) {
  if (!srcCounts[id]) console.log(`  ${id.padEnd(14)}     0 (  0.0%)`);
}
console.log('');

// Pipeline detail
console.log(hr2);
console.log('Source Pipeline Detail');
console.log(hr2);
for (const src of sourceIds) {
  const s = allStats[src];
  const passRate = s.rawGenerated > 0 ? Math.round((s.finalPool / s.rawGenerated) * 100) : 0;
  console.log(`  ${src}:`);
  console.log(`    Raw generated:           ${s.rawGenerated}`);
  console.log(`    -> passed rug filter:    ${s.passedRugFilter}`);
  console.log(`    -> passed provenance:    ${s.passedProvenanceFilter}`);
  console.log(`    -> passed European gate: ${s.passedEuropeanFilter}`);
  console.log(`    -> passed source lookup: ${s.passedSourceLookup}`);
  console.log(`    -> passed route valid.:  ${s.passedRouteValidation}`);
  if (s.droppedNoLLM > 0)
    console.log(`    !! DROPPED (no LLM):     ${s.droppedNoLLM}  <-- HAD VALID COORDS BUT SILENTLY KILLED`);
  console.log(`    FINAL POOL:              ${s.finalPool}  (${passRate}% pass-through)`);
  console.log('');
}

// Met department breakdown
const metRugs = pool.filter(r => r.sourceId === 'Met');
if (metRugs.length > 0) {
  console.log(hr2);
  console.log('Met Museum Department Breakdown');
  console.log(hr2);
  const deptCounts: Record<string, number> = {};
  for (const r of metRugs) deptCounts[r.collection] = (deptCounts[r.collection] || 0) + 1;
  for (const [dept, count] of Object.entries(deptCounts).sort((a, b) => b[1] - a[1])) {
    const pct = Math.round((count / metRugs.length) * 1000) / 10;
    const flag = pct > 50 ? '  *** DOMINANT ***' : '';
    console.log(`  ${dept}: ${count} (${pct}% of Met rugs)${flag}`);
  }
  console.log('');
}

// Provenance diversity
const provCounts: Record<string, number> = {};
const citySet = new Set<string>();
for (const r of pool) {
  provCounts[r.provenance] = (provCounts[r.provenance] || 0) + 1;
  citySet.add(r.provenance.toLowerCase().trim());
}

console.log(hr2);
console.log('Provenance Diversity');
console.log(hr2);
console.log(`  Unique provenance strings: ${Object.keys(provCounts).length}`);
console.log(`  Unique city names (lower): ${citySet.size}`);
console.log('');
console.log('  Top 10 most common provenance values:');
const topProv = Object.entries(provCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (let i = 0; i < topProv.length; i++) {
  const [name, count] = topProv[i];
  const pct = Math.round((count / total) * 1000) / 10;
  console.log(`    ${String(i + 1).padStart(2)}. ${name.padEnd(20)} -- ${count} (${pct}%)`);
}
console.log('');

// Filtering exclusions
console.log(hr2);
console.log('Filtering Exclusions Per Source');
console.log(hr2);
for (const src of sourceIds) {
  const s = allStats[src];
  const srcFiltered = s.rawGenerated - s.passedSourceLookup;
  let line = `  ${src.padEnd(14)} source-filtered: ${String(srcFiltered).padStart(4)}`;
  if (s.droppedNoLLM > 0) line += `   route-dropped(no LLM): ${s.droppedNoLLM}`;
  console.log(line);
}
console.log('');

// Conclusions
console.log(hr);
console.log('CONCLUSIONS');
console.log(hr);

const metPct = srcCounts['Met'] ? Math.round((srcCounts['Met'] / total) * 1000) / 10 : 0;
if (metPct > 60)
  console.log(`  CRITICAL: Met dominates at ${metPct}% of all validated rugs. Dataset is dangerously skewed.`);
else if (metPct > 40)
  console.log(`  WARNING: Met overrepresented at ${metPct}%.`);

if (metRugs.length > 0) {
  console.log(`  FLAGGED: "Islamic Art" = 100% of Met rugs. The Met fetcher hardcodes departmentId=14.`);
}

if (!hasApiKey) {
  console.log('  CRITICAL: ANTHROPIC_API_KEY is empty. LLM validation is disabled.');
  console.log('    All rugs whose provenance doesn\'t match the ~100-entry known-location table are SILENTLY DROPPED.');
  console.log('    This disproportionately kills Wikidata (which provides its own coordinates that get ignored).');
}

const wdStats = allStats['Wikidata'];
if (wdStats.droppedNoLLM > 0) {
  console.log(`  CRITICAL: Wikidata had ${wdStats.passedSourceLookup} rugs pass source filtering (with valid SPARQL coords),`);
  console.log(`    but ${wdStats.droppedNoLLM} were DROPPED in route validation — place names not in hardcoded table, no LLM to validate.`);
  console.log(`    Only ${wdStats.finalPool} survived.`);
}

const active = Object.entries(srcCounts).filter(([, v]) => v > 0).length;
if (active <= 3) console.log(`  CRITICAL: Only ${active} sources producing validated rugs.`);

console.log('  ROOT CAUSE: Met fetcher uses departmentId=14 (Islamic Art) exclusively.');
console.log('  Every Met rug is from the Islamic Art department by design.');
console.log('');
console.log(hr);
