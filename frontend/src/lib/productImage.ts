// Live keyword-search image proxies (LoremFlickr, Unsplash Source) turned out to be
// unreliable — thin-tag keywords 500 unpredictably, and Unsplash Source is defunct.
// So each category maps to a specific, verified Unsplash CDN photo id instead: no
// query-time search, no failure risk.
// Order matters: more specific/exclusive terms first, since flavor modifiers
// (e.g. "Infused Honey — Coffee") can make a product name match more than one
// category's regex. Honey, jewelry, textile, superfood, and spice terms don't
// otherwise collide, so only "coffee" needs to be checked last.
const CATEGORY_PHOTOS: [RegExp, string][] = [
  [/(teff|grain|flour)/i, "1612329529758-64e0a90d86af"],
  [/(berbere|mitmita|cardamom|cumin|spice)/i, "1769628702933-39ba968cb198"],
  [/honey/i, "1481900369621-54a7facacc6c"],
  [/(cotton|scarf|fabric|tibeb|textile)/i, "1507434745378-235a6297156b"],
  [/(necklace|pendant|opal|filigree|gold|jewel)/i, "1611107683227-e9060eccd846"],
  [/(moringa|spirulina|powder|superfood)/i, "1755685068178-4b57210ddcd4"],
  [/coffee/i, "1573883841850-49e42245e193"],
];

const FALLBACK_PHOTO_ID = "1764543603830-0eb9fb26ed35"; // market stall

export function productImagePhotoId(name: string): string {
  for (const [pattern, photoId] of CATEGORY_PHOTOS) {
    if (pattern.test(name)) return photoId;
  }
  return FALLBACK_PHOTO_ID;
}
