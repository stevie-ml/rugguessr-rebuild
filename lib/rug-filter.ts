// Keywords that indicate the item IS a rug/carpet
const RUG_KEYWORDS = [
  'carpet', 'rug', 'kilim', 'flatweave', 'prayer rug', 'runner',
  'tapijt', 'teppich', 'tapis', 'alfombra', 'halı', 'qali',
  'sumak', 'soumak', 'dhurrie', 'drugget'
];

// Keywords that indicate the item is NOT a rug
const REJECT_KEYWORDS = [
  'painting', 'portrait', 'cap', 'hat', 'bag', 'cushion', 'pillow',
  'textile fragment', 'embroidery', 'dress', 'coat', 'robe', 'shirt',
  'trousers', 'shoe', 'boot', 'slipper', 'curtain', 'tent', 'saddle',
  'drawing', 'photograph', 'print', 'lithograph', 'watercolor',
  'sketch', 'engraving', 'etching', 'book', 'manuscript',
  'tile', 'ceramic', 'pottery', 'bowl', 'plate', 'vase',
  'jewelry', 'necklace', 'bracelet', 'ring', 'brooch',
  'sword', 'dagger', 'armor', 'shield', 'helmet',
  'furniture', 'chair', 'table', 'chest', 'door',
  'miniature', 'illustration', 'postcard', 'poster',
  'tapestry panel', 'wall hanging',
];

// Regions/countries that are too broad as provenance
const TOO_BROAD = [
  'turkey', 'iran', 'persia', 'central asia', 'caucasus', 'caucasian',
  'anatolia', 'anatolian', 'middle east', 'near east', 'far east',
  'asia', 'africa', 'europe', 'india', 'china', 'afghanistan',
  'morocco', 'tunisia', 'egypt', 'pakistan', 'turkmenistan',
  'uzbekistan', 'azerbaijan', 'armenia', 'georgia', 'kurdistan',
  'unknown', 'uncertain', 'possibly', 'probably',
  'islamic', 'ottoman', 'safavid', 'mughal', 'timurid',
  'eastern mediterranean', 'western asia', 'south asia',
];

// Tribal/ethnic names that are too vague for map pinning
const TRIBAL_NAMES = [
  'kazak', 'turkmen', 'turkoman', 'baluch', 'baluchi', 'Kurdish',
  'yomut', 'yomud', 'tekke', 'ersari', 'salor', 'saryk',
  'chodor', 'arabachi', 'beshir', 'luri', 'lori', 'bakhtiari',
  'qashqai', 'afshar', 'shahsavan', 'khamseh',
  'nomadic', 'tribal', 'village',
];

// European/Americas countries - we want these to be super rare
const EUROPEAN_AMERICAS = [
  'france', 'french', 'england', 'english', 'britain', 'british',
  'spain', 'spanish', 'italy', 'italian', 'germany', 'german',
  'belgium', 'belgian', 'netherlands', 'dutch', 'portugal', 'portuguese',
  'sweden', 'swedish', 'norway', 'norwegian', 'denmark', 'danish',
  'finland', 'finnish', 'poland', 'polish', 'russia', 'russian',
  'austria', 'austrian', 'switzerland', 'swiss', 'romania', 'romanian',
  'america', 'american', 'united states', 'usa', 'canada', 'canadian',
  'mexico', 'mexican', 'brazil', 'brazilian', 'argentina',
  'aubusson', 'savonnerie', 'axminster', 'wilton',
];

export function looksLikeRug(title: string): boolean {
  const t = title.toLowerCase();
  // Must contain a rug keyword
  if (!RUG_KEYWORDS.some(k => t.includes(k))) return false;
  // Must not contain a reject keyword
  if (REJECT_KEYWORDS.some(k => t.includes(k))) return false;
  return true;
}

export function provenanceIsSpecific(provenance: string): boolean {
  const p = provenance.toLowerCase().trim();
  if (!p || p.length < 3) return false;
  if (TOO_BROAD.some(b => p === b || p === b + 'n' || p === b + 'an')) return false;
  if (TOO_BROAD.some(b => p === b)) return false;
  if (TRIBAL_NAMES.some(t => p.toLowerCase().includes(t.toLowerCase()))) return false;
  return true;
}

export function isEuropeanOrAmerican(provenance: string): boolean {
  const p = provenance.toLowerCase();
  return EUROPEAN_AMERICAS.some(e => p.includes(e));
}

export function shouldIncludeEuropean(): boolean {
  // ~5% chance of including European/Americas rugs
  return Math.random() < 0.05;
}
