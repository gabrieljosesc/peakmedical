/**
 * After running migrate-wordpress.mjs, send "Set your password" emails
 * to all migrated users so they can log in.
 *
 * Supabase sends a magic link / password-reset email via its built-in email system.
 *
 * Usage: node scripts/send-password-resets.mjs [--limit=100] [--offset=0]
 *
 * Use --limit and --offset to send in batches if needed (recommended for 3000+ users).
 * Example:
 *   node scripts/send-password-resets.mjs --limit=200 --offset=0
 *   node scripts/send-password-resets.mjs --limit=200 --offset=200
 *   ... etc
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peakmedicalwholesale.com";

// Parse CLI args
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? true];
    })
);
const LIMIT  = parseInt(args.limit  ?? "9999");
const OFFSET = parseInt(args.offset ?? "0");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllAuthUsers(supabase) {
  const all = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...(data.users ?? []));
    if (!data.nextPage) break;
    page++;
  }
  return all;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing env vars in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log("Fetching all Supabase auth users...");
  const allUsers = await fetchAllAuthUsers(supabase);

  // Only target migrated users (no password set = they have no last_sign_in_at)
  // AND only users with migrated: true in metadata
  const targets = allUsers
    .filter((u) => u.user_metadata?.migrated === true || u.last_sign_in_at == null)
    .filter((u) => u.email)
    .slice(OFFSET, OFFSET + LIMIT);

  console.log(`Total users: ${allUsers.length}`);
  console.log(`Targets for reset (offset=${OFFSET}, limit=${LIMIT}): ${targets.length}`);
  console.log(`Reset link redirect: ${SITE_URL}/auth/callback?next=/auth/update-password\n`);

  let sent = 0, failed = 0;

  for (const user of targets) {
    const { error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=/auth/update-password`,
      },
    });

    if (error) {
      console.error(`  FAIL: ${user.email} — ${error.message}`);
      failed++;
    } else {
      console.log(`  SENT: ${user.email}`);
      sent++;
    }

    // Supabase rate-limits email sends — stay well under 10/sec
    await sleep(200);
  }

  console.log(`
Reset emails: sent=${sent}, failed=${failed}
Done! Users can now click the email link to set their password
and access their order history.
`);
}

main().catch((e) => { console.error(e); process.exit(1); });
