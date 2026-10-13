export function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const productSlug = (p) => p.slug || slugify(p.name);

export const productPath = (p) => `/product/${productSlug(p)}`;

/* Does this product answer to a given /product/:id segment?
 *
 * URLs use keyword slugs; legacy numeric ids still resolve so old links and
 * printed QR codes keep working, and slugAliases carries a product's previous
 * slug so a rename never 404s a link that is already indexed or bookmarked.
 *
 * Shared, because the route now picks between two page layouts and both it and
 * the page itself have to resolve the same product from the same segment. */
export const matchesProduct = (p, id) =>
  String(p.id) === String(id) || productSlug(p) === id || (p.slugAliases || []).includes(id);

export const categoryPath = (slug) => `/treatments/${slug}`;
