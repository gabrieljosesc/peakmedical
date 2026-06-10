'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendOrderStatusEmail, type OrderEmailRow, type OrderStatus } from '@/lib/email/order-emails'

// ── Admin guard ─────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')
  return { supabase, user }
}

export type AdminResult = { ok: true; message: string } | { ok: false; message: string }

// ── Products ────────────────────────────────────────────────────────────────
export async function updateProductAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id'))
  const title = String(formData.get('title'))
  const slug = String(formData.get('slug'))
  const description = String(formData.get('description') || '')
  const sku = String(formData.get('sku') || '')
  const base_price = Number(formData.get('base_price'))
  const category_id = String(formData.get('category_id') || '') || null
  const is_active = formData.get('is_active') === 'on'
  const is_featured = formData.get('is_featured') === 'on'
  const image_url = String(formData.get('image_url') || '').trim()

  const { error } = await supabase
    .from('products')
    .update({ title, slug, description, sku, base_price, category_id, is_active, is_featured })
    .eq('id', id)

  if (error) redirect(`/admin/products/${id}?error=${encodeURIComponent(error.message)}`)

  if (image_url) {
    const { data: imgs } = await supabase.from('product_images').select('id').eq('product_id', id).limit(1)
    if (imgs?.[0]) {
      await supabase.from('product_images').update({ url: image_url }).eq('id', imgs[0].id)
    } else {
      await supabase.from('product_images').insert({ product_id: id, url: image_url, sort_order: 0 })
    }
  }

  revalidatePath('/')
  revalidatePath('/admin/products')
  revalidatePath(`/product/${slug}`)
  redirect(`/admin/products/${id}?saved=1`)
}

export async function createProductAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const title = String(formData.get('title'))
  const slug = String(formData.get('slug'))
  const description = String(formData.get('description') || '')
  const sku = String(formData.get('sku') || '')
  const base_price = Number(formData.get('base_price'))
  const category_id = String(formData.get('category_id') || '') || null
  const is_active = formData.get('is_active') === 'on'
  const is_featured = formData.get('is_featured') === 'on'
  const image_url = String(formData.get('image_url') || '').trim()

  const { data, error } = await supabase
    .from('products')
    .insert({ title, slug, description, sku, base_price, price_tiers: [], category_id, is_active, is_featured })
    .select('id')
    .single()

  if (error) redirect(`/admin/products/new?error=${encodeURIComponent(error.message)}`)

  if (image_url && data) {
    await supabase.from('product_images').insert({ product_id: data.id, url: image_url, sort_order: 0 })
  }

  revalidatePath('/admin/products')
  redirect(`/admin/products/${data.id}?saved=1`)
}

// ── Orders ──────────────────────────────────────────────────────────────────
export async function updateOrderAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id'))
  const status = String(formData.get('status'))
  const admin_notes = String(formData.get('admin_notes') || '')

  // Detect status change to decide whether to email the customer
  const { data: before } = await supabase.from('orders').select('status').eq('id', id).single()
  const previousStatus = before?.status as OrderStatus | undefined

  const { error } = await supabase
    .from('orders')
    .update({ status, admin_notes })
    .eq('id', id)

  if (error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`)

  // Email the customer when the status actually changes
  if (previousStatus && previousStatus !== status) {
    const svc = createAdminClient()
    const { data: order } = await svc
      .from('orders')
      .select('id, reference_number, email, full_name, status, subtotal, order_items(title, quantity, unit_price)')
      .eq('id', id)
      .single()
    if (order) {
      void sendOrderStatusEmail(order as unknown as OrderEmailRow, status as OrderStatus)
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  redirect(`/admin/orders/${id}?saved=1`)
}

// ── Blog ────────────────────────────────────────────────────────────────────
export async function upsertBlogPostAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const slug = String(formData.get('slug'))
  const title = String(formData.get('title'))
  const excerpt = String(formData.get('excerpt') || '')
  const body = String(formData.get('body'))
  const is_published = formData.get('is_published') === 'on'
  const published_at = is_published ? new Date().toISOString() : null

  if (id) {
    const { error } = await supabase
      .from('blog_posts')
      .update({ slug, title, excerpt, body, is_published, published_at })
      .eq('id', id)
    if (error) redirect(`/admin/blog/${id}?error=${encodeURIComponent(error.message)}`)
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    redirect(`/admin/blog/${id}?saved=1`)
  } else {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ slug, title, excerpt, body, is_published, published_at })
      .select('id')
      .single()
    if (error) redirect(`/admin/blog/new?error=${encodeURIComponent(error.message)}`)
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    redirect(`/admin/blog/${data.id}?saved=1`)
  }
}

// ── Send password reset to any user ─────────────────────────────────────────
export async function sendPasswordResetAction(userId: string): Promise<AdminResult> {
  await requireAdmin()
  const svc = createAdminClient()

  const { data: authUser, error: getErr } = await svc.auth.admin.getUserById(userId)
  if (getErr || !authUser?.user?.email) {
    return { ok: false, message: getErr?.message ?? 'User not found.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password` },
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: `Password reset email sent to ${authUser.user.email}.` }
}
