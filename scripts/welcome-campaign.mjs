/**
 * Welcome / set-your-password campaign for migrated customers.
 *
 * - Targets migrated users who haven't been emailed yet.
 * - Order: NEWEST registrations first (by original WordPress user id, since all
 *   Supabase created_at values are the migration day).
 * - Marks each user (user_metadata.pw_reset_sent_at) after a successful send,
 *   so re-runs never double-email and the campaign resumes cleanly day to day.
 * - Paced: one email every --delay ms, up to --limit per run.
 *
 * Usage:
 *   node scripts/welcome-campaign.mjs --dry                 # preview next batch
 *   node scripts/welcome-campaign.mjs --limit=300 --delay=120000   # send 300, 2 min apart
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), quiet: true })

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] })
)
const LIMIT = parseInt(args.limit ?? '300')
const DELAY = parseInt(args.delay ?? '120000') // 2 min between sends
const DRY = Boolean(args.dry)
const SITE = (typeof args.site === 'string' && args.site) || 'https://www.peakmedicalwholesale.com'
const REDIRECT = `${SITE}/auth/confirm?type=recovery&next=/auth/update-password`

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchAllAuthUsers(sb) {
  const all = []; let page = 1
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    all.push(...(data.users ?? []))
    if (!data.nextPage) break; page++
  }
  return all
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

  const all = await fetchAllAuthUsers(admin)
  const migrated = all.filter(u => u.user_metadata?.migrated === true && u.email)
  const alreadySent = migrated.filter(u => u.user_metadata?.pw_reset_sent_at)
  const pending = migrated
    .filter(u => !u.user_metadata?.pw_reset_sent_at)
    .sort((a, b) => Number(b.user_metadata.wp_user_id || 0) - Number(a.user_metadata.wp_user_id || 0)) // newest first

  const batch = pending.slice(0, LIMIT)
  console.log(`Migrated customers: ${migrated.length}`)
  console.log(`  already emailed:   ${alreadySent.length}`)
  console.log(`  still pending:     ${pending.length}`)
  console.log(`This run: ${batch.length} (newest first) | delay ${Math.round(DELAY / 1000)}s${DRY ? ' | DRY RUN' : ''}`)
  if (batch.length) {
    const wp = batch.map(u => Number(u.user_metadata.wp_user_id))
    console.log(`  WP id range this batch: ${wp[0]} (newest) → ${wp[wp.length - 1]}`)
    console.log(`  first 3: ${batch.slice(0, 3).map(u => u.email).join(', ')}`)
  }
  if (DRY || !batch.length) { console.log('\n(no emails sent)'); return }

  let sent = 0, failed = 0
  for (const user of batch) {
    let { error } = await anon.auth.resetPasswordForEmail(user.email, { redirectTo: REDIRECT })
    if (error && (error.status === 429 || /rate limit/i.test(error.message))) {
      console.warn(`  rate-limited on ${user.email} — waiting 60s`); await sleep(60000)
      ;({ error } = await anon.auth.resetPasswordForEmail(user.email, { redirectTo: REDIRECT }))
    }
    if (error) { console.error(`  FAIL ${user.email}: ${error.message}`); failed++ }
    else {
      // mark sent (merge, preserving migrated/wp_user_id/full_name)
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, pw_reset_sent_at: new Date().toISOString() },
      })
      sent++
      if (sent % 20 === 0) console.log(`  …sent ${sent}/${batch.length}`)
    }
    await sleep(DELAY)
  }

  const remaining = pending.length - sent
  console.log(`\nDone. sent=${sent}, failed=${failed}. Remaining after this run: ${remaining}`)
}
main().catch(e => { console.error(e); process.exit(1) })
