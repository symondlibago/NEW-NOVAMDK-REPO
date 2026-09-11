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

export const categoryPath = (slug) => `/treatments/${slug}`;
