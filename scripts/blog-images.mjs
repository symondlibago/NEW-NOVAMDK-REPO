/* Local, resized copies of the blog's hero images.
 *
 * Posts are authored in GoHighLevel and its CDN serves whatever the author
 * uploaded, at full resolution and with no resize parameters of any kind
 * (?width=, ?w=, ?tr= are all ignored — the bytes come back identical). In
 * practice that is a 9.2MB PNG and two JPEGs over 8MB. A 6000x4000 image costs
 * ~96MB of RAM once decoded, and the home page puts eight of them on screen at
 * once: enough to take Chrome to "page unresponsive" on a laptop without much
 * memory to spare.
 *
 * So each image is fetched once, resized into a short WebP ladder under
 * public/blog/, and recorded in src/content/blog/images.json against the URL it
 * came from. The site reads that manifest through blog.js and falls back to the
 * original URL for anything missing, so a post whose image has not been
 * processed still renders.
 *
 * WebP rather than AVIF on purpose: AVIF files are smaller, but they are slower
 * to decode, and decode time on a weak machine is the thing being fixed here.
 *
 * Idempotent — a derivative that already exists is left alone — so it is cheap
 * to leave in the build. Run it after a blog sync:
 *
 *   node scripts/blog-images.mjs          # only what is missing
 *   node scripts/blog-images.mjs --force  # rebuild everything
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Imported dynamically, and the build carries on without it.
 *
 * A static `import sharp` throws while the module is loading, which is before
 * any try/catch here can run: the script would exit non-zero and `&&` would
 * take the rest of the deploy down with it. That would mean a native module
 * failing to install could stop a blog post reaching the site, which is a worse
 * failure than the one this script exists to fix. Without sharp it leaves the
 * committed manifest alone and the site serves whatever it already had. */
let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch (err) {
  console.warn(`blog-images: sharp unavailable, leaving existing images in place\n  ${err.message}`);
  process.exit(0);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = path.join(ROOT, "src/content/blog/posts.json");
const MANIFEST = path.join(ROOT, "src/content/blog/images.json");
const OUT_DIR = path.join(ROOT, "public/blog");

/* The widest slot on the site is the home page's feature card, about 860 CSS
   pixels. 1200 covers it on a retina screen without paying for pixels no
   layout asks for. */
const WIDTHS = [400, 800, 1200];
const QUALITY = 72;

const force = process.argv.includes("--force");
const key = (url) => createHash("sha1").update(url).digest("hex").slice(0, 12);

async function build(url) {
  const id = key(url);
  const widths = WIDTHS.map((w) => ({ w, file: path.join(OUT_DIR, `${id}-${w}.webp`) }));

  // Nothing to do, but the manifest still needs this image's real dimensions.
  if (!force && widths.every((v) => existsSync(v.file))) {
    const meta = await sharp(widths[widths.length - 1].file).metadata();
    return { base: `/blog/${id}`, widths: WIDTHS, w: meta.width, h: meta.height };
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const src = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(src).metadata();

  let last = null;
  for (const { w, file } of widths) {
    /* withoutEnlargement: a source narrower than the ladder's top rung should
       stop at its own width rather than be upscaled into a soft copy. */
    const out = await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer({ resolveWithObject: true });
    await writeFile(file, out.data);
    last = out.info;
  }

  const mb = (n) => (n / 1048576).toFixed(2);
  console.log(
    `  ${id}  ${meta.width}x${meta.height} ${meta.format} ${mb(src.length)}MB` +
      `  ->  ${last.width}x${last.height} webp`,
  );
  return { base: `/blog/${id}`, widths: WIDTHS, w: last.width, h: last.height };
}

async function main() {
  const posts = JSON.parse(await readFile(POSTS, "utf8"));
  const urls = [
    ...new Set(posts.filter((p) => !p.draft && p.image).map((p) => p.image)),
  ].filter((u) => /^https?:\/\//.test(u));

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  let failed = 0;

  console.log(`blog-images: ${urls.length} image(s)`);
  for (const url of urls) {
    try {
      manifest[url] = await build(url);
    } catch (err) {
      /* Never fail the build over this. The site falls back to the original
         URL, which is slow but correct, and the next run tries again. */
      failed += 1;
      console.warn(`  skipped ${url}\n    ${err.message}`);
    }
  }

  /* A run where everything failed means the network was the problem, not the
     posts. Overwriting a good manifest with {} would quietly put every 9MB
     original back on the site, so the committed one is left as it is. */
  if (failed && !Object.keys(manifest).length) {
    console.warn("blog-images: nothing could be fetched, keeping the existing manifest");
    return;
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  /* Derivatives of images no longer referenced by any post. GoHighLevel gives a
     new URL when an author swaps a hero image, so without this the folder only
     ever grows. Skipped when anything failed: a download that timed out is not
     evidence that its images are unused. */
  let pruned = 0;
  if (!failed) {
    const live = new Set(Object.values(manifest).map((m) => m.base.split("/").pop()));
    for (const f of await readdir(OUT_DIR)) {
      const id = /^([0-9a-f]{12})-\d+\.webp$/.exec(f)?.[1];
      if (id && !live.has(id)) {
        await rm(path.join(OUT_DIR, f));
        pruned += 1;
      }
    }
  }

  console.log(
    `blog-images: ${Object.keys(manifest).length} ready` +
      (failed ? `, ${failed} skipped` : "") +
      (pruned ? `, ${pruned} stale file(s) removed` : ""),
  );
}

main().catch((err) => {
  console.error("blog-images failed:", err);
  process.exitCode = 0; // still never fatal to a deploy
});
