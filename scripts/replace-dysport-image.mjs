import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const peakRoot = path.join(__dirname, '..')
dotenv.config({ path: path.join(peakRoot, '.env.local') })

const PRODUCT_ID = '4b6bffb0-11bb-4a11-8dd5-c67bc8e4dc26' // DYSPORT® 300u (English)
const IMAGE_PATH = process.argv[2]

async function main() {
  if (!IMAGE_PATH || !fs.existsSync(IMAGE_PATH)) {
    console.error('Provide a valid image path as the first argument.')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )

  const storagePath = `${PRODUCT_ID}/dysport-300u-english.png`
  const body = fs.readFileSync(IMAGE_PATH)

  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, body, { contentType: 'image/png', upsert: true })
  if (upErr) throw upErr

  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(storagePath)
  const bustedUrl = `${publicUrl}?v=${Date.now()}`

  // Remove existing hero images, set this as sort_order 0
  await supabase.from('product_images').delete().eq('product_id', PRODUCT_ID).eq('sort_order', 0)
  const { error: insErr } = await supabase.from('product_images').insert({
    product_id: PRODUCT_ID,
    url: bustedUrl,
    sort_order: 0,
  })
  if (insErr) throw insErr

  console.log('✓ Replaced hero image for DYSPORT® 300u')
  console.log('  ', bustedUrl)
}

main().catch(e => { console.error(e); process.exit(1) })
