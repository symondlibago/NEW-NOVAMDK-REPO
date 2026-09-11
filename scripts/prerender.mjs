import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SITE_URL, buildRoutes } from "./seo-routes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shell = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderRoute(route) {
  const url = `${SITE_URL}${route.path}`;
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(route.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(route.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(route.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  if (route.image) {
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${route.image}$2`);
  }
  if (route.jsonLd) {
    html = html.replace(
      "</head>",
      `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>\n  </head>`
    );
  }
  return html;
}

let count = 0;
for (const route of buildRoutes()) {
  const html = renderRoute(route);
  if (route.path === "/") {
    writeFileSync(join(dist, "index.html"), html);
  } else {
    const dir = join(dist, ...route.path.split("/").filter(Boolean));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
  count++;
}
console.log(`prerender: ${count} routes written to dist/`);
