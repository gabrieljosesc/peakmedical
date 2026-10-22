/**
 * Sends the "Important update regarding upcoming shipments" (DDP/duties)
 * notice to every registered user in the database, skipping test accounts.
 *
 * Each message is sent through the site's own SMTP server AND the exact
 * same raw message is appended to the mailbox's Sent folder over IMAP,
 * so every email shows up in Sent for info@peakmedicalwholesale.com.
 *
 *   node scripts/send-ddp-notice.mjs                 → list targets only (no emails)
 *   node scripts/send-ddp-notice.mjs --only=a@b.com  → send ONE test email
 *   node scripts/send-ddp-notice.mjs --send          → send to all targets
 *   node scripts/send-ddp-notice.mjs --report        → print progress summary
 *
 * Other flags: --limit=N  --delay=ms (default 400)  --exclude=a@x.com,b@y.com
 *
 * Resume-safe: every result is written to scripts/.ddp-notice-progress.json as
 * it happens; re-running --send skips addresses already sent, so a crash, a
 * sleeping laptop or a mail-server rate limit never causes a double send.
 *
 * Requires SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env.local.
 * IMAP defaults to the same host/credentials on port 993 (override with
 * IMAP_HOST / IMAP_PORT). Needs `imapflow` (npm i imapflow --no-save).
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? true];
  })
);

const SEND = args.send === true;
const REPORT = args.report === true;
const ONLY = (typeof args.only === "string" ? args.only : "").toLowerCase().trim();
// --list=<file>: send to the addresses in this file (one per line) instead of every DB user.
const LIST = typeof args.list === "string" ? path.resolve(args.list) : null;
const LIMIT = parseInt(args.limit ?? "99999", 10);
const DELAY = parseInt(args.delay ?? "400", 10);
const EXCLUDE = new Set(
  String(args.exclude ?? "gabbymayuga77@gmail.com").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean)
);
const PROGRESS_FILE = path.join(__dirname, ".ddp-notice-progress.json");

const SUBJECT = "Important update regarding upcoming shipments";
const FROM_NAME = "Peak Medical Wholesale";
const FROM_ADDR = "info@peakmedicalwholesale.com";
const PHONE = "+1-888-222-0373";
const SITE = "https://www.peakmedicalwholesale.com/";

const NAVY = "#1a3a5c";
const GOLD = "#c9a35a";
const INK = "#1f2937";
const P = `style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 12px"`;
const H = `style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${INK};font-weight:bold;margin:18px 0 6px"`;

const EMAIL_HTML = `
  <div style="font-family:Arial,sans-serif;background:#f3f4f6;padding:32px 16px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:${NAVY};padding:18px 24px">
        <span style="color:${GOLD};font-family:Georgia,serif;font-size:18px;font-weight:600;letter-spacing:3px">PEAK MEDICAL</span>
        <span style="color:#cbd5e1;font-size:10px;letter-spacing:3px;margin-left:8px">WHOLESALE</span>
      </div>
      <div style="padding:26px 24px;color:${INK}">
        <h1 style="font-family:Arial,sans-serif;font-size:20px;margin:0 0 14px;color:${INK}">Important update regarding upcoming shipments</h1>
        <p ${P}>Dear Valued Customer,</p>
        <p ${P}>We want to share an important update that may affect your shipments going forward.</p>
        <p ${P}>Effective at the end of this month, most major courier companies are expected to
        discontinue the Delivered Duty Paid (DDP) shipping option for U.S.-bound deliveries.
        Until now, we have prepaid all duties and customs clearance on your shipments in advance.
        With this policy change, carriers may no longer allow us to continue that process in the
        same way.</p>
        <p ${H}>What this means for you</p>
        <p ${P}>Our logistics team is already putting solutions in place to keep your delivery
        experience as seamless as possible. Our priority remains to handle all applicable duties
        and taxes on your behalf so you don&rsquo;t have to.</p>
        <p ${P}>However, due to these changes, there may be rare cases where the courier asks you
        to pay duties, taxes, or local charges before a shipment can be released or delivered.</p>
        <p ${H}>Our commitment to you</p>
        <p ${P}>We are managing the back-end logistics so that you have zero out-of-pocket costs
        or, at most, a minimal amount.</p>
        <p ${P}><strong>Full reimbursement:</strong> If you are required to pay any upfront
        delivery fees or duties to release your shipment, we will fully reimburse you. Simply
        forward the receipt to our team and we will process your reimbursement promptly.</p>
        <p ${P}>We value your trust and are committed to minimizing any disruption to your
        deliveries. If you have any questions about this transition, please don&rsquo;t hesitate
        to reach out.</p>
        <p ${P}>We look forward to continuing to work with you, and thank you for your loyalty as
        a valued client.</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4b5563;margin:18px 0 0">
          Regards,<br>
          <strong style="color:${INK}">Peak Medical Wholesale</strong><br>
          &#128231; <a href="mailto:${FROM_ADDR}" style="color:${NAVY}">${FROM_ADDR}</a><br>
          &#128222; ${PHONE}<br>
          &#127760; <a href="${SITE}" style="color:${NAVY}">www.peakmedicalwholesale.com</a>
        </p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-family:Arial,sans-serif">
        Peak Medical Wholesale · ${FROM_ADDR} · ${PHONE}
      </div>
    </div>
  </div>`;

const EMAIL_TEXT = `Dear Valued Customer,

We want to share an important update that may affect your shipments going forward.

Effective at the end of this month, most major courier companies are expected to discontinue the Delivered Duty Paid (DDP) shipping option for U.S.-bound deliveries. Until now, we have prepaid all duties and customs clearance on your shipments in advance. With this policy change, carriers may no longer allow us to continue that process in the same way.

What this means for you
Our logistics team is already putting solutions in place to keep your delivery experience as seamless as possible. Our priority remains to handle all applicable duties and taxes on your behalf so you don't have to.

However, due to these changes, there may be rare cases where the courier asks you to pay duties, taxes, or local charges before a shipment can be released or delivered.

Our commitment to you
We are managing the back-end logistics so that you have zero out-of-pocket costs or, at most, a minimal amount.

Full reimbursement: If you are required to pay any upfront delivery fees or duties to release your shipment, we will fully reimburse you. Simply forward the receipt to our team and we will process your reimbursement promptly.

We value your trust and are committed to minimizing any disruption to your deliveries. If you have any questions about this transition, please don't hesitate to reach out.

We look forward to continuing to work with you, and thank you for your loyalty as a valued client.

Regards,
Peak Medical Wholesale
${FROM_ADDR}
${PHONE}
${SITE}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms}ms`)), ms))]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")); } catch { return { sent: {}, failed: {} }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 1)); }

async function fetchAllAuthUsers(client) {
  const all = [];
  let page = 1;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...(data.users ?? []));
    if (!data.nextPage) break;
    page++;
  }
  return all;
}

function classify(users) {
  const targets = [];
  const skipped = []; // { email, reason }
  const seen = new Set();
  for (const u of users) {
    const email = (u.email ?? "").toLowerCase().trim();
    if (!email) { skipped.push({ email: `(no email, id ${u.id})`, reason: "no email address" }); continue; }
    if (seen.has(email)) { skipped.push({ email, reason: "duplicate" }); continue; }
    seen.add(email);
    if (email.includes("test")) { skipped.push({ email, reason: "test account" }); continue; }
    if (EXCLUDE.has(email)) { skipped.push({ email, reason: "excluded (owner/test)" }); continue; }
    if (email === FROM_ADDR) { skipped.push({ email, reason: "sender mailbox itself" }); continue; }
    if (!EMAIL_RE.test(email) || email.endsWith(".invalid")) { skipped.push({ email, reason: "invalid address" }); continue; }
    targets.push(email);
  }
  targets.sort();
  return { targets, skipped };
}

function printReport(progress, targets, skipped) {
  const sentN = Object.keys(progress.sent).length;
  const failedEntries = Object.entries(progress.failed).filter(([e]) => !progress.sent[e]);
  const remaining = targets.filter((e) => !progress.sent[e] && !progress.failed[e]).length;
  console.log(`\n===== DDP NOTICE PROGRESS =====`);
  console.log(`Targets: ${targets.length} | sent: ${sentN} | failed: ${failedEntries.length} | not yet attempted: ${remaining} | skipped: ${skipped.length}`);
  if (failedEntries.length) {
    const byReason = {};
    for (const [email, f] of failedEntries) (byReason[f.error] ??= []).push(email);
    console.log(`\nFailures by reason:`);
    for (const [reason, emails] of Object.entries(byReason)) {
      console.log(`  [${emails.length}] ${reason}`);
      for (const e of emails.slice(0, 10)) console.log(`      ${e}`);
      if (emails.length > 10) console.log(`      …and ${emails.length - 10} more`);
    }
  }
  const skipByReason = {};
  for (const s of skipped) (skipByReason[s.reason] ??= []).push(s.email);
  console.log(`\nSkipped by reason:`);
  for (const [reason, emails] of Object.entries(skipByReason)) console.log(`  [${emails.length}] ${reason}: ${emails.join(", ")}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing Supabase env vars in .env.local"); process.exit(1); }
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    console.error("Missing SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  console.log("Loading users…");
  const users = await fetchAllAuthUsers(admin);
  const dbEmails = new Set(users.map((u) => (u.email ?? "").toLowerCase().trim()).filter(Boolean));
  let source = users;
  if (LIST) {
    const lines = fs.readFileSync(LIST, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    source = lines.map((email, i) => ({ id: `list-${i + 1}`, email }));
    console.log(`Recipient list: ${LIST} (${lines.length} non-blank lines)`);
  }
  const { targets: allTargets, skipped } = classify(source);
  const progress = loadProgress();

  console.log(`Users in database: ${users.length}`);
  if (LIST) {
    const inDb = allTargets.filter((e) => dbEmails.has(e)).length;
    console.log(`List targets found in database: ${inDb} | not in database: ${allTargets.length - inDb} (will still be emailed — the list is the source of truth)`);
  }
  console.log(`Targets: ${allTargets.length}   Skipped: ${skipped.length}`);

  if (REPORT) { printReport(progress, allTargets, skipped); return; }

  let targets;
  if (ONLY) targets = [ONLY]; // explicit test send, even to an excluded/test address
  else targets = allTargets.filter((e) => !progress.sent[e]).slice(0, LIMIT);

  if (!SEND && !ONLY) {
    for (const s of skipped) console.log(`  SKIP (${s.reason}): ${s.email}`);
    const already = allTargets.length - targets.length;
    console.log(`\nWould email ${targets.length} address(es)${already ? ` (${already} already sent in a previous run)` : ""}.`);
    console.log(`  first 5: ${targets.slice(0, 5).join(", ")}`);
    console.log("\nListing only. Re-run with --send (or --only=email@x.com) to actually email.");
    return;
  }

  // --- SMTP transport ---
  const { default: nodemailer } = await import("nodemailer");
  const { default: MailComposer } = await import("nodemailer/lib/mail-composer/index.js");
  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpPort = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
  });
  console.log(`\nTransport: SMTP (${smtpHost}:${smtpPort})`);

  // --- IMAP connection for the Sent-folder copies ---
  const { ImapFlow } = await import("imapflow");
  const imapHost = process.env.IMAP_HOST?.trim() || smtpHost;
  const imapPort = Number(process.env.IMAP_PORT ?? 993);
  const imapAuth = { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS };
  let imap = null;
  let sentPath = null;
  async function connectImap() {
    imap = new ImapFlow({ host: imapHost, port: imapPort, secure: true, auth: imapAuth, logger: false });
    await withTimeout(imap.connect(), 20000, "IMAP connect");
    const boxes = await imap.list();
    const sentBox = boxes.find((b) => b.specialUse === "\\Sent") ?? boxes.find((b) => /(^|[./])sent/i.test(b.path));
    sentPath = sentBox?.path ?? null;
    return boxes;
  }
  try {
    const boxes = await connectImap();
    if (sentPath) console.log(`IMAP: connected (${imapHost}:${imapPort}), Sent folder = "${sentPath}"`);
    else console.warn(`IMAP: connected but no Sent folder found — mailboxes: ${boxes.map((b) => b.path).join(", ")}`);
  } catch (e) {
    console.warn(`IMAP: could not connect (${e.message}) — emails will still send, but no Sent copies.`);
  }

  let sent = 0, failed = 0, appendFailed = 0;
  const started = Date.now();
  for (const to of targets) {
    try {
      const composer = new MailComposer({
        from: `"${FROM_NAME}" <${FROM_ADDR}>`,
        to,
        subject: SUBJECT,
        html: EMAIL_HTML,
        text: EMAIL_TEXT,
      });
      const raw = await composer.compile().build();
      await withTimeout(transporter.sendMail({ envelope: { from: FROM_ADDR, to: [to] }, raw }), 45000, "SMTP send");
      sent++;
      progress.sent[to] = new Date().toISOString();
      delete progress.failed[to];
      let tag = "SENT";
      if (sentPath) {
        try {
          await withTimeout(imap.append(sentPath, raw, ["\\Seen"], new Date()), 20000, "IMAP append");
        } catch (e) {
          appendFailed++;
          tag = `SENT (Sent-copy failed: ${e.message})`;
          // try to re-establish IMAP for the next message
          try { await imap.logout(); } catch { /* ignore */ }
          try { await connectImap(); } catch { sentPath = null; }
        }
      }
      if (!ONLY && sent % 25 === 0) {
        const mins = ((Date.now() - started) / 60000).toFixed(1);
        console.log(`  …${sent}/${targets.length} sent (${mins} min)`);
      } else if (ONLY) console.log(`  ${tag}: ${to}`);
    } catch (e) {
      failed++;
      progress.failed[to] = { error: e.message.replace(/\s+/g, " ").slice(0, 200), at: new Date().toISOString() };
      console.error(`  FAIL: ${to} — ${e.message}`);
    }
    if (!ONLY) saveProgress(progress);
    await sleep(DELAY);
  }

  try { await imap?.logout(); } catch { /* already closed */ }

  console.log(`\nDone. sent=${sent} failed=${failed} skipped=${skipped.length} sent-copy-failures=${appendFailed}`);
  if (!ONLY) printReport(progress, allTargets, skipped);
}

main().catch((e) => { console.error(e); process.exit(1); });
