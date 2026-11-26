/**
 * Ophthalmology pricing update + EYLEA HD launch (boss's price list, Nov 2026).
 *
 *   node scripts/eylea-pricing.mjs --site=peak|ace|mp [--dry] [--scale=0.95]
 *
 * - Re-tiers every EYLEA (non-HD) and VABYSMO product: 1–5 / 6–10 / 11+.
 * - Upserts EYLEA HD 8mg (0.07 mL) prefilled syringe in Ophthalmology with the
 *   product photo from _shared-assets/eylea-hd/eylea-hd.webp.
 * - --scale multiplies every price (e.g. 0.95 for a store priced 5% lower).
 *
 * Sites: peak = peakmedical (title/base_price/product_images), ace = acemedical
 * (name/price/images[]), mp = medicaplanet/web (like peak, images by slug).
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith("--")).map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; }));
const SITE = args.site;
const DRY = Boolean(args.dry);
const SCALE = Number(args.scale ?? 1);

const ROOTS = {
  peak: path.join(__dirname, ".."),
  ace: path.join(__dirname, "..", "..", "acemedical"),
  mp: path.join(__dirname, "..", "..", "medicaplanet", "web"),
  drs: path.join(__dirname, "..", "..", "drsalesdirect"),
};
if (!ROOTS[SITE]) { console.error("usage: --site=peak|ace|mp|drs"); process.exit(1); }
// drsalesdirect already had an EYLEA HD row under this slug — update it in place rather than duplicating.
const HD_SLUG = SITE === "drs" ? "eylea-hd" : "eylea-hd-8mg";
dotenv.config({ path: path.join(ROOTS[SITE], ".env.local"), quiet: true });

const IMAGE = path.join(__dirname, "..", "..", "_shared-assets", "eylea-hd", "eylea-hd.webp");
const MAXQ = 1000;
const r = (n) => Math.round(n * SCALE);
const tiers = (a, b, c) => [
  { minQ: 1, maxQ: 5, price: r(a) },
  { minQ: 6, maxQ: 10, price: r(b) },
  { minQ: 11, maxQ: MAXQ, price: r(c) },
];
const PRICING = {
  eylea: tiers(1099, 1049, 999),
  eyleaHd: tiers(1499, 1399, 1349),
  vabysmo: tiers(1949, 1899, 1849), // updated 26 Nov 2026 (was 2499/2399/2299)
};
// --only=<slug substring>: re-tier just the matching products and skip the EYLEA HD upsert.
const ONLY = typeof args.only === "string" ? args.only.toLowerCase() : null;

const HD = {
  slug: HD_SLUG,
  title: "EYLEA® HD 8MG (0.07ML) PREFILLED SYRINGE",
  sku: "EYLEA-HD-8MG",
  description:
    "EYLEA® HD (aflibercept) Injection 8 mg is the higher-dose formulation of aflibercept, supplied as a single-dose prefilled syringe containing 8 mg in 0.07 mL for intravitreal injection (NDC 61755-005-02). " +
    "It is indicated for neovascular (wet) age-related macular degeneration (nAMD), diabetic macular edema (DME) and diabetic retinopathy (DR), and supports extended dosing intervals of up to every 16 weeks after the initial monthly doses.\n\n" +
    "Each carton contains one prefilled syringe and one 18G × 1½\" filter needle for withdrawal. Regeneron / Bayer. Rx only.\n\n" +
    "Storage: refrigerate at 2–8 °C (36–46 °F) in the original carton to protect from light; do not freeze. Single-dose — discard any unused portion. For intravitreal injection by a qualified ophthalmologist only.",
  short: "Aflibercept 8 mg / 0.07 mL single-dose prefilled syringe for intravitreal injection — nAMD, DME, DR.",
  specs: [
    { label: "Strength", value: "8 mg / 0.07 mL" },
    { label: "Form", value: "Prefilled syringe" },
    { label: "Dose", value: "Single-dose" },
    { label: "Storage", value: "2–8 °C" },
  ],
};

async function main() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const nameCol = SITE === "ace" ? "name" : "title";
  const priceCol = SITE === "ace" ? "price" : "base_price";
  console.log(`site=${SITE} ${process.env.NEXT_PUBLIC_SUPABASE_URL} scale=${SCALE}${DRY ? " DRY RUN" : ""}`);

  // ── 1. Re-tier Eylea + Vabysmo ──────────────────────────────────────────
  const { data: rows } = await s.from("products").select(`id, slug, ${nameCol}, ${priceCol}, price_tiers`)
    .or("slug.ilike.%eylea%,slug.ilike.%vabysmo%");
  for (const p of rows ?? []) {
    if (ONLY && !p.slug.includes(ONLY)) continue;
    const isHd = /eylea-hd|eylea.*hd/i.test(p.slug) || /HD/.test(p[nameCol]);
    const t = p.slug.includes("vabysmo") ? PRICING.vabysmo : isHd ? PRICING.eyleaHd : PRICING.eylea;
    const before = `${p[priceCol]} ${JSON.stringify((p.price_tiers ?? []).map(x => x.price))}`;
    console.log(`  ${isHd ? "EYLEA HD" : p.slug.includes("vabysmo") ? "VABYSMO " : "EYLEA   "} ${p[nameCol].padEnd(32)} ${before}  →  ${t[0].price} ${JSON.stringify(t.map(x => x.price))}`);
    if (DRY) continue;
    const { error } = await s.from("products").update({ [priceCol]: t[0].price, price_tiers: t }).eq("id", p.id);
    if (error) console.error("    update failed:", error.message);
  }

  // ── 2. Upsert EYLEA HD ──────────────────────────────────────────────────
  if (ONLY) return;
  const { data: cat } = await s.from("categories").select("id").eq("slug", "ophthalmology").single();
  if (!cat) throw new Error("ophthalmology category not found");
  const existing = (rows ?? []).find(p => p.slug === HD.slug);
  const t = PRICING.eyleaHd;
  console.log(`\n  EYLEA HD ${existing ? "already exists → updating" : "creating"} (${HD.slug}) at ${t[0].price} ${JSON.stringify(t.map(x => x.price))}`);
  if (DRY) return;

  const img = fs.readFileSync(IMAGE);
  const common = { slug: HD.slug, [nameCol]: HD.title, description: HD.description, sku: HD.sku, category_id: cat.id, [priceCol]: t[0].price, price_tiers: t };

  if (SITE === "ace") {
    const objectPath = `${HD.slug}/hero.webp`;
    const up = await s.storage.from("product-images").upload(objectPath, img, { contentType: "image/webp", upsert: true });
    if (up.error) throw new Error("image upload: " + up.error.message);
    const url = s.storage.from("product-images").getPublicUrl(objectPath).data.publicUrl;
    const { data: brand } = await s.from("brands").select("id").eq("slug", "eylea").single();
    const row = { ...common, short_description: HD.short, images: [url], specs: HD.specs, is_in_stock: true, featured: false, is_free: false, brand_id: brand?.id ?? null };
    const { data, error } = await s.from("products").upsert(row, { onConflict: "slug" }).select("id").single();
    if (error) throw error;
    console.log(`  ✓ ${data.id}  image ${url}`);
    return;
  }

  // peak / mp / drs: products + product_images table
  const extra = SITE === "mp" ? { fda_approved: false, ce_marked: false } : {}; // matches the sibling Eylea rows there
  const { data, error } = await s.from("products").upsert({ ...common, currency: "USD", is_active: true, is_featured: false, is_free: false, ...extra }, { onConflict: "slug" }).select("id").single();
  if (error) throw error;
  const objectPath = SITE === "mp" ? `${HD.slug}/hero.webp` : SITE === "drs" ? `hd/eylea-hd-8mg.webp` : `${data.id}/0.webp`;
  const up = await s.storage.from("product-images").upload(objectPath, img, { contentType: "image/webp", upsert: true });
  if (up.error) throw new Error("image upload: " + up.error.message);
  const url = s.storage.from("product-images").getPublicUrl(objectPath).data.publicUrl;
  await s.from("product_images").delete().eq("product_id", data.id);
  await s.from("product_images").insert({ product_id: data.id, url, sort_order: 0 });
  console.log(`  ✓ ${data.id}  image ${url}`);
}
main().catch(e => { console.error(e); process.exit(1); });
