/**
 * Summarise Lighthouse JSON reports into a score table (markdown).
 *
 *   node scripts/lighthouse-summary.mjs <dir> [<dir2>]
 *   e.g. node scripts/lighthouse-summary.mjs seo-reports/before
 *        node scripts/lighthouse-summary.mjs seo-reports/before seo-reports/after   → before→after diff
 *
 * Reads every *.report.json in the directory and prints Performance /
 * Accessibility / Best Practices / SEO scores (0–100) plus LCP, CLS, TBT,
 * Speed Index. With two directories it prints before → after per page.
 */
import fs from 'fs'
import path from 'path'

const [beforeDir, afterDir] = process.argv.slice(2)
if (!beforeDir) { console.error('usage: node scripts/lighthouse-summary.mjs <dir> [<afterDir>]'); process.exit(1) }

function load(dir) {
  const out = {}
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.report.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const c = j.categories, a = j.audits
    const pct = v => (v == null ? '—' : Math.round(v * 100))
    out[f.replace('.report.json', '')] = {
      url: j.finalDisplayedUrl ?? j.requestedUrl,
      perf: pct(c.performance?.score), a11y: pct(c.accessibility?.score),
      bp: pct(c['best-practices']?.score), seo: pct(c.seo?.score),
      lcp: a['largest-contentful-paint']?.displayValue ?? '—',
      cls: a['cumulative-layout-shift']?.displayValue ?? '—',
      tbt: a['total-blocking-time']?.displayValue ?? '—',
      si: a['speed-index']?.displayValue ?? '—',
      seoFails: Object.values(a).filter(x => c.seo?.auditRefs.some(r => r.id === x.id) && x.score != null && x.score < 1).map(x => x.title),
    }
  }
  return out
}

const before = load(beforeDir)
const after = afterDir ? load(afterDir) : null
const cell = (b, a) => (a == null ? String(b) : b === a ? `${b}` : `${b} → **${a}**`)

console.log(`| Page | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Speed Index |`)
console.log(`|---|---|---|---|---|---|---|---|---|`)
for (const [name, b] of Object.entries(before)) {
  const a = after?.[name]
  console.log(`| ${name} | ${cell(b.perf, a?.perf)} | ${cell(b.a11y, a?.a11y)} | ${cell(b.bp, a?.bp)} | ${cell(b.seo, a?.seo)} | ${cell(b.lcp, a?.lcp)} | ${cell(b.cls, a?.cls)} | ${cell(b.tbt, a?.tbt)} | ${cell(b.si, a?.si)} |`)
}
console.log()
for (const [name, b] of Object.entries(before)) {
  if (b.seoFails.length) console.log(`SEO audits failing on ${name}: ${b.seoFails.join('; ')}`)
}
