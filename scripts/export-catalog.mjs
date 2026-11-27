/**
 * Export the live Peak Medical catalog for the client:
 *   exports/<date>/images/<category>/<product-slug>-N.<ext>   every product image
 *   exports/<date>/catalog.csv                                 title, category, SKU, price, tiers, image files, URL
 *   exports/<date>/categories.csv                              category list with product counts
 *
 *   node scripts/export-catalog.mjs            → active products only (default)
 *   node scripts/export-catalog.mjs --all      → include inactive products
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });
const INCLUDE_INACTIVE = process.argv.includes("--all");
const SITE = "https://www.peakmedicalwholesale.com";

const date = new Date().toISOString().slice(0, 10);
const OUT = path.join(__dirname, "..", "exports", `peakmedical-catalog-${date}`);
const IMG = path.join(OUT, "images");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(IMG, { recursive: true });

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const money = (n) => (n == null || n === "" ? "" : Number(n).toFixed(2));
const safe = (s) => String(s).replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
const tierLabel = (t) => (t.maxQ >= 1000 ? `${t.minQ}+` : `${t.minQ}-${t.maxQ}`);

async function download(url, dest) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let q = s.from("products").select("id, slug, title, sku, base_price, price_tiers, is_active, is_free, category:categories(slug, name), images:product_images(url, sort_order)").order("title");
  if (!INCLUDE_INACTIVE) q = q.eq("is_active", true);
  const { data: products, error } = await q;
  if (error) throw error;
  console.log(`products: ${products.length}`);

  // ── images (8 at a time) ─────────────────────────────────────────────────
  const jobs = [];
  const fileNames = new Map(); // product id -> [relative paths]
  for (const p of products) {
    const cat = safe(p.category?.slug ?? "uncategorized");
    const imgs = (p.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    fileNames.set(p.id, []);
    imgs.forEach((im, i) => {
      const extFromUrl = (im.url.split("?")[0].match(/\.(jpe?g|png|webp|gif|avif)$/i) || [, "jpg"])[1].toLowerCase();
      const rel = path.join(cat, `${safe(p.slug)}${imgs.length > 1 ? `-${i + 1}` : ""}.${extFromUrl}`);
      fileNames.get(p.id).push(rel);
      jobs.push({ url: im.url, dest: path.join(IMG, rel) });
    });
  }
  let done = 0, failed = 0;
  const failures = [];
  const queue = jobs.slice();
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const j = queue.shift();
      fs.mkdirSync(path.dirname(j.dest), { recursive: true });
      try { await download(j.url, j.dest); done++; } catch (e) { failed++; failures.push(`${j.url} (${e.message})`); }
      if ((done + failed) % 100 === 0) console.log(`  …${done + failed}/${jobs.length} images`);
    }
  }));
  console.log(`images: ${done} downloaded, ${failed} failed`);

  // ── catalog.csv ──────────────────────────────────────────────────────────
  const header = ["Product", "Category", "SKU", "Price (USD)", "Tier 1 qty", "Tier 1 price", "Tier 2 qty", "Tier 2 price", "Tier 3 qty", "Tier 3 price", "Tier 4 qty", "Tier 4 price", "Pricing summary", "Status", "Image files", "Product URL"];
  const lines = [header.map(csvCell).join(",")];
  for (const p of products) {
    const tiers = Array.isArray(p.price_tiers) ? p.price_tiers : [];
    const tierCols = [];
    for (let i = 0; i < 4; i++) tierCols.push(tiers[i] ? tierLabel(tiers[i]) : "", tiers[i] ? money(tiers[i].price) : "");
    const summary = p.is_free ? "FREE (with peptide orders)" : tiers.length ? tiers.map(t => `${tierLabel(t)}: $${money(t.price)}`).join("; ") : Number(p.base_price) > 0 ? `$${money(p.base_price)}` : "Contact for price";
    lines.push([
      p.title, p.category?.name ?? "", p.sku ?? "", p.is_free ? "0.00" : money(p.base_price),
      ...tierCols, summary, p.is_active ? "Active" : "Inactive",
      fileNames.get(p.id).map(f => "images/" + f.replace(/\\/g, "/")).join("; "),
      `${SITE}/product/${p.slug}`,
    ].map(csvCell).join(","));
  }
  fs.writeFileSync(path.join(OUT, "catalog.csv"), "﻿" + lines.join("\r\n"), "utf8");

  // ── categories.csv ───────────────────────────────────────────────────────
  const { data: cats } = await s.from("categories").select("id, slug, name, parent_id, sort_order").order("sort_order");
  const byId = new Map((cats ?? []).map(c => [c.id, c]));
  const counts = new Map();
  for (const p of products) counts.set(p.category?.slug, (counts.get(p.category?.slug) ?? 0) + 1);
  const clines = [["Category", "Parent category", "Products", "URL"].map(csvCell).join(",")];
  for (const c of cats ?? []) clines.push([c.name, c.parent_id ? byId.get(c.parent_id)?.name ?? "" : "", counts.get(c.slug) ?? 0, `${SITE}/shop/${c.slug}`].map(csvCell).join(","));
  fs.writeFileSync(path.join(OUT, "categories.csv"), "﻿" + clines.join("\r\n"), "utf8");

  fs.writeFileSync(path.join(OUT, "README.txt"),
    `Peak Medical Wholesale — catalog export (${date})\r\n\r\n` +
    `catalog.csv     every ${INCLUDE_INACTIVE ? "" : "active "}product with category, SKU, current price and volume tiers (open in Excel)\r\n` +
    `categories.csv  all categories with product counts\r\n` +
    `images/         product photos, one folder per category, named by product (…-1, -2 for extra photos)\r\n\r\n` +
    `Source: live website database, ${SITE}\r\n`);
  if (failures.length) fs.writeFileSync(path.join(OUT, "image-download-failures.txt"), failures.join("\r\n"));

  console.log(`\nexport folder: ${OUT}`);
}
main().catch(e => { console.error(e); process.exit(1); });
