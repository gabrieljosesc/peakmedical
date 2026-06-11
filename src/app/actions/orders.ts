'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendOrderReceivedEmail, sendAdminNewOrderEmail, type OrderEmailRow } from '@/lib/email/order-emails'
import { validateCoupon, recordCouponUse } from '@/app/actions/coupons'
import { computeShipping } from '@/lib/shipping'
import { meetsCheckoutMinimumUsd, MIN_CHECKOUT_SUBTOTAL_USD } from '@/lib/cart-minimum'
import { unitPriceForQuantity, parsePriceTiers } from '@/lib/price-tiers'
import { encryptCardCvv } from '@/lib/payment-card-crypto'
import { generateReferenceNumber } from '@/lib/utils'

export type PlaceOrderInput = {
  shipping: {
    recipientName: string; company: string; phone: string
    line1: string; line2: string; city: string; state: string; zip: string; country: string
  }
  items: { slug: string; quantity: number }[]
  cardId: string
  cvv: string
  couponCode?: string
  customerNotes?: string
  paymentNotes?: string
  policyAccepted?: boolean
}

export type PlaceOrderResult = { ok: true; reference: string } | { ok: false; message: string }

function cardExpired(m: number, y: number) {
  return new Date(y, m, 0, 23, 59, 59, 999) < new Date()
}

/**
 * Server-authoritative order placement: recomputes prices, validates the
 * coupon, computes shipping, snapshots the chosen saved card, and encrypts
 * the per-order CVV. No payment is charged — the team processes it manually.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please sign in to place an order.' }

  if (!input.items.length) return { ok: false, message: 'Your cart is empty.' }
  if (!input.cardId) return { ok: false, message: 'Select a saved card before placing the order.' }
  if (!/^\d{3,4}$/.test(input.cvv.trim())) return { ok: false, message: 'Enter the 3–4 digit CVV from your card.' }

  const svc = createAdminClient()

  // Profile (contact details for the order)
  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, email, company')
    .eq('id', user.id)
    .single()

  // Recompute item prices server-side (authoritative)
  const slugs = input.items.map(i => i.slug)
  const { data: products } = await svc
    .from('products')
    .select('id, slug, title, base_price, price_tiers, is_active')
    .in('slug', slugs)
  const bySlug = new Map((products ?? []).map(p => [p.slug, p]))

  const orderItems: { product_id: string; title: string; quantity: number; unit_price: number }[] = []
  let subtotal = 0
  for (const item of input.items) {
    const p = bySlug.get(item.slug)
    if (!p || !p.is_active) return { ok: false, message: `A product in your cart is unavailable: ${item.slug}` }
    const qty = Math.max(1, Math.floor(item.quantity))
    const unit = unitPriceForQuantity(parsePriceTiers(p.price_tiers), qty, Number(p.base_price))
    subtotal += unit * qty
    orderItems.push({ product_id: p.id, title: p.title, quantity: qty, unit_price: unit })
  }
  if (subtotal <= 0) return { ok: false, message: 'Order total must be greater than zero.' }
  if (!meetsCheckoutMinimumUsd(subtotal)) {
    return { ok: false, message: `Minimum order is $${MIN_CHECKOUT_SUBTOTAL_USD.toFixed(2)}. Add more items before checking out.` }
  }

  // Coupon (server-validated)
  let couponCode: string | null = null
  let discount = 0
  if (input.couponCode?.trim()) {
    const res = await validateCoupon(input.couponCode, subtotal)
    if (res.ok) { couponCode = res.code; discount = Math.min(res.discount, subtotal) }
  }

  const shippingAmount = computeShipping(subtotal - discount)
  const total = Math.max(0, subtotal - discount) + shippingAmount

  // Card snapshot + encrypted CVV
  const { data: card } = await svc
    .from('user_saved_cards')
    .select('id, brand, last4, exp_month, exp_year, name_on_card')
    .eq('id', input.cardId)
    .eq('user_id', user.id)
    .single()
  if (!card) return { ok: false, message: 'Saved card not found. Please add a card on file.' }
  if (cardExpired(card.exp_month, card.exp_year)) {
    return { ok: false, message: 'Your saved card is expired. Please update it.' }
  }

  let cvvEncrypted: string
  try {
    cvvEncrypted = encryptCardCvv(input.cvv.trim())
  } catch {
    return { ok: false, message: 'Payment processing is not configured. Contact support.' }
  }

  const s = input.shipping
  const reference = generateReferenceNumber()

  const { data: order, error } = await svc
    .from('orders')
    .insert({
      user_id: user.id,
      reference_number: reference,
      status: 'pending_csr',
      subtotal,
      coupon_code: couponCode,
      discount_amount: discount,
      shipping_amount: shippingAmount,
      total,
      email: profile?.email ?? user.email ?? '',
      full_name: profile?.full_name ?? s.recipientName,
      phone: s.phone || null,
      shipping_address: {
        first_name: s.recipientName, last_name: '', company: s.company,
        address_line1: s.line1, address_line2: s.line2,
        city: s.city, state: s.state, zip: s.zip, country: s.country, phone: s.phone,
      },
      customer_notes: input.customerNotes || null,
      payment_notes: input.paymentNotes || null,
      policy_acknowledged_at: input.policyAccepted ? new Date().toISOString() : null,
      payment_card_snapshot: {
        brand: card.brand, last4: card.last4,
        exp_month: card.exp_month, exp_year: card.exp_year,
        name_on_card: card.name_on_card, cvv_encrypted: cvvEncrypted,
      },
    })
    .select('id')
    .single()

  if (error || !order) return { ok: false, message: error?.message ?? 'Could not place order.' }

  await svc.from('order_items').insert(orderItems.map(it => ({ ...it, order_id: order.id })))

  if (couponCode) void recordCouponUse(couponCode)
  // Await so the SMTP send completes before the serverless function freezes.
  // notifyNewOrder never throws, so a mail failure can't break the order.
  await notifyNewOrder(order.id)

  return { ok: true, reference }
}

/**
 * Fire-and-forget notifications after an order is placed: emails the customer
 * an "order received" confirmation and alerts the admin of the new order.
 * Safe to call from the client checkout flow — never throws.
 */
export async function notifyNewOrder(orderId: string): Promise<void> {
  try {
    const svc = createAdminClient()
    const { data: order } = await svc
      .from('orders')
      .select('id, reference_number, email, full_name, status, subtotal, coupon_code, discount_amount, shipping_amount, total, order_items(title, quantity, unit_price)')
      .eq('id', orderId)
      .single()
    if (!order) return

    const row = order as unknown as OrderEmailRow
    await Promise.allSettled([
      sendOrderReceivedEmail(row),
      sendAdminNewOrderEmail(row),
    ])
  } catch (e) {
    console.error('[notifyNewOrder]', e)
  }
}
