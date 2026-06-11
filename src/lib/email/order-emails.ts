import 'server-only'

import { sendTransactionalEmail } from '@/lib/email/send'

const SITE_EMAIL = process.env.NOTIFICATION_EMAIL?.trim() || 'info@peakmedicalwholesale.com'
const SITE_PHONE = '+1-888-222-0373'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://peakmedicalwholesale.com'

export type OrderStatus = 'pending_csr' | 'confirmed' | 'shipped' | 'cancelled'

export type OrderEmailRow = {
  id: string
  reference_number?: string | null
  email: string
  full_name: string
  status: OrderStatus
  subtotal: number | string
  coupon_code?: string | null
  discount_amount?: number | string | null
  shipping_amount?: number | string | null
  total?: number | string | null
  order_items?: { title: string; quantity: number; unit_price: number | string }[] | null
}

function ref(o: OrderEmailRow) { return o.reference_number || o.id.slice(0, 8).toUpperCase() }
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function money(n: number | string) { return `$${Number(n).toFixed(2)}` }

function layout(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;"><tr><td align="center">
    <table width="100%" style="max-width:540px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr><td style="background:#1a3a5c;padding:18px 24px;color:#fff;font-size:18px;font-weight:700;">Peak Medical Wholesale</td></tr>
      <tr><td style="padding:24px;color:#18181b;font-size:15px;line-height:1.55;">${body}</td></tr>
      <tr><td style="padding:16px 24px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#71717a;line-height:1.5;">
        Questions? <a href="mailto:${SITE_EMAIL}" style="color:#1a3a5c;">${SITE_EMAIL}</a> · ${SITE_PHONE}<br>
        <a href="${SITE_URL}" style="color:#1a3a5c;">${SITE_URL}</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

function itemsTable(o: OrderEmailRow): string {
  const items = Array.isArray(o.order_items) ? o.order_items : []
  if (!items.length) return ''
  const rows = items.map(it =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">${escapeHtml(it.title)} × ${it.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;">${money(Number(it.unit_price) * it.quantity)}</td></tr>`
  ).join('')

  const discount = Number(o.discount_amount ?? 0)
  const shipping = Number(o.shipping_amount ?? 0)
  const grand = o.total != null ? Number(o.total) : Number(o.subtotal) - discount + shipping

  let summary = `<tr><td style="padding:8px 0 2px;">Subtotal</td><td style="padding:8px 0 2px;text-align:right;">${money(o.subtotal)}</td></tr>`
  if (discount > 0) {
    const label = o.coupon_code ? `Discount (${escapeHtml(o.coupon_code)})` : 'Discount'
    summary += `<tr><td style="padding:2px 0;color:#15803d;">${label}</td><td style="padding:2px 0;text-align:right;color:#15803d;">−${money(discount)}</td></tr>`
  }
  summary += `<tr><td style="padding:2px 0;">Shipping</td><td style="padding:2px 0;text-align:right;">${shipping > 0 ? money(shipping) : 'Free'}</td></tr>`
  summary += `<tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #e5e7eb;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #e5e7eb;">${money(grand)}</td></tr>`

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">${rows}${summary}</table>`
}

// ── Customer: order received ────────────────────────────────────────────────
export async function sendOrderReceivedEmail(o: OrderEmailRow): Promise<void> {
  const name = escapeHtml(o.full_name.trim() || 'there')
  const body = `<p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Thank you for your order! We&rsquo;ve received it and our team will contact you shortly to confirm payment and shipping. <strong>No payment was captured on the website.</strong></p>
    <p style="margin:0 0 4px;"><strong>Reference:</strong> ${escapeHtml(ref(o))}</p>
    ${itemsTable(o)}
    <p style="margin:12px 0 0;">You can view this order anytime in your account.</p>`
  await sendTransactionalEmail({
    to: o.email,
    subject: `Order received — ${ref(o)}`,
    html: layout(body),
    text: `Hi ${o.full_name}, we received your order ${ref(o)}. Our team will contact you to confirm payment and shipping. No payment was captured. Total: ${money(o.subtotal)}.`,
  })
}

// ── Admin: new order alert ──────────────────────────────────────────────────
export async function sendAdminNewOrderEmail(o: OrderEmailRow): Promise<void> {
  const body = `<p style="margin:0 0 12px;"><strong>New order received.</strong></p>
    <p style="margin:0 0 4px;"><strong>Reference:</strong> ${escapeHtml(ref(o))}</p>
    <p style="margin:0 0 4px;"><strong>Customer:</strong> ${escapeHtml(o.full_name)} (${escapeHtml(o.email)})</p>
    ${itemsTable(o)}
    <p style="margin:12px 0 0;"><a href="${SITE_URL}/admin/orders/${o.id}" style="color:#1a3a5c;">Open in admin →</a></p>`
  // ADMIN_NOTIFY_EMAILS: comma-separated extra inboxes (e.g. a Gmail copy)
  const extraEmails = (process.env.ADMIN_NOTIFY_EMAILS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  await sendTransactionalEmail({
    to: [SITE_EMAIL, ...extraEmails],
    subject: `New order ${ref(o)} — ${money(o.subtotal)}`,
    html: layout(body),
    text: `New order ${ref(o)} from ${o.full_name} (${o.email}). Total ${money(o.subtotal)}. ${SITE_URL}/admin/orders/${o.id}`,
  })
}

// ── Customer: status change ─────────────────────────────────────────────────
const STATUS_COPY: Record<OrderStatus, { subject: string; line: string } | null> = {
  pending_csr: null,
  confirmed: { subject: 'Your order is confirmed', line: 'Good news — your order has been <strong>confirmed</strong>. Our team will be in touch with payment and shipping details.' },
  shipped: { subject: 'Your order has shipped', line: 'Your order is on its way — it has been marked as <strong>shipped</strong>.' },
  cancelled: { subject: 'Your order was cancelled', line: 'Your order has been <strong>cancelled</strong>. If this is unexpected, please contact us.' },
}

export async function sendOrderStatusEmail(o: OrderEmailRow, status: OrderStatus): Promise<void> {
  const copy = STATUS_COPY[status]
  if (!copy) return
  const name = escapeHtml(o.full_name.trim() || 'there')
  const body = `<p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">${copy.line}</p>
    <p style="margin:0 0 4px;"><strong>Reference:</strong> ${escapeHtml(ref(o))}</p>
    ${itemsTable(o)}`
  await sendTransactionalEmail({
    to: o.email,
    subject: `${copy.subject} — ${ref(o)}`,
    html: layout(body),
  })
}
