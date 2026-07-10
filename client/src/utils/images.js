/**
 * Central image sources. All URLs are verified-reachable CDN assets used as
 * production-grade placeholders. Swap any of these for the client's real brand
 * assets later — nothing else in the app needs to change.
 *
 *  • Unsplash  → themed photography (category banners, hero, testimonials)
 *  • DiceBear  → deterministic avatars when a user has no uploaded photo
 */

const UNSPLASH = 'https://images.unsplash.com';
const q = (id, w = 800) => `${UNSPLASH}/${id}?w=${w}&q=70&auto=format&fit=crop`;

// Themed banner per campaign category
const CATEGORY_IMAGE = {
  Restaurant: q('photo-1517248135467-4c7edcad34c4'),
  Food: q('photo-1504674900247-0877df9cc836'),
  Fashion: q('photo-1441984904996-e0b6ba687e04'),
  Beauty: q('photo-1522335789203-aabd1fc54bc9'),
  Travel: q('photo-1476514525535-07fb3b4ae5f1'),
  Gaming: q('photo-1542751371-adc38448a05e'),
  Tech: q('photo-1498050108023-c5249f4df085'),
  Fitness: q('photo-1571019614242-c5c5dee9f50b'),
  Education: q('photo-1522202176988-66273c2fd55f'),
};

export function categoryImage(category) {
  return CATEGORY_IMAGE[category] || q('photo-1611162616475-46b635cb6868');
}

// Editorial photos for the marketing hero collage
export const HERO_IMAGES = {
  a: q('photo-1524504388940-b1c1722653e1', 500),
  b: q('photo-1519085360753-af0119f7cbe7', 500),
  c: q('photo-1611162616475-46b635cb6868', 500),
};

// Deterministic avatar fallback (SVG, cached by seed)
export function generatedAvatar(seed = 'user') {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&radius=50`;
}
