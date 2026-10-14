import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SITE_URL, buildRoutes } from "./seo-routes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Dose rungs point at their shelf page as canonical, so they stay out.
const routes = buildRoutes().filter((r) => r.sitemap !== false);

/* A date only where one is known (a blog post's). Stamping every page with
   the build date taught Google to ignore the field. */
const urls = routes
  .map(
    ({ path, priority, lastmod }) => `  <url>
    <loc>${SITE_URL}${path}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`sitemap.xml written: ${routes.length} URLs`);
