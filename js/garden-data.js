/** Pure data guards shared by the garden UI and behavioral tests. */
export const LOCAL_FLOWER_KEY = 'fioritura-demo-flower-v3';
export const FLOWER_PALETTES = Object.freeze(['pink', 'gold', 'violet']);
export const FLOWER_SHAPES = Object.freeze(['daisy', 'camellia', 'star']);

const isFiniteIn = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const isIntegerIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function cleanFlowerName(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

export function normalizeLocalFlower(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const name = cleanFlowerName(value.name);
  if (
    value.id !== 'personal-demo' ||
    value.version !== 1 ||
    name.length < 2 ||
    name !== value.name ||
    !FLOWER_PALETTES.includes(value.palette) ||
    !FLOWER_SHAPES.includes(value.shape) ||
    !isFiniteIn(value.x, 0, 1240) ||
    !isFiniteIn(value.y, 0, 860) ||
    !isFiniteIn(value.radius, 36, 72) ||
    !isIntegerIn(value.petals, 6, 12) ||
    !isIntegerIn(value.seed, 1, 999999)
  ) return null;
  return {
    id: 'personal-demo',
    version: 1,
    name,
    palette: value.palette,
    shape: value.shape,
    x: value.x,
    y: value.y,
    radius: value.radius,
    petals: value.petals,
    seed: value.seed,
    demo: true,
    local: true,
  };
}

export function parseLocalFlower(serialized) {
  if (typeof serialized !== 'string' || serialized.length > 2048) return null;
  try {
    return normalizeLocalFlower(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export function filterFlowers(flowers, { palette = 'all', query = '', forceVisibleId = '' } = {}) {
  const safePalette = palette === 'all' || FLOWER_PALETTES.includes(palette) ? palette : 'all';
  const needle = String(query).normalize('NFKC').trim().toLocaleLowerCase('it');
  const matches = flowers.filter((flower) => {
    if (flower?.id === forceVisibleId) return true;
    if (!flower || typeof flower.name !== 'string') return false;
    const paletteMatches = safePalette === 'all' || flower.palette === safePalette;
    const queryMatches = !needle || flower.name.toLocaleLowerCase('it').includes(needle);
    return paletteMatches && queryMatches;
  });
  // The newly created flower must also be present in the initially collapsed list.
  const personalIndex = forceVisibleId ? matches.findIndex(f => f.id === forceVisibleId) : -1;
  if (personalIndex > 0) matches.unshift(matches.splice(personalIndex, 1)[0]);
  return matches;
}
