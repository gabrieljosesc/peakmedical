import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { updateOrderAction } from '@/app/actions/admin'
import { formatPrice } from '@/lib/utils'
import type { ShippingAddress } from '@/types'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}

function statusLabel(s: string) {
  return { pending_csr: 'Pending review', confirmed: 'Confirmed', shipped: 'Shipped', cancelled: 'Cancelled' }[s] ?? s
}
function statusColor(s: string) {
  return {
    pending_csr: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600'
}

function formatAddress(a: ShippingAddress | null): string {
  if (!a) return '—'
  return [
    a.company,
    `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
    a.address_line1,
    a.address_line2,
    [a.city, a.state, a.zip].filter(Boolean).join(', '),
    a.country,
    a.phone,
  ].filter(Boolean).join('\n')
}

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const svc = createAdminClient()

  const { data: order } = await svc
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()
  if (!order) notFound()

  // Look up customer's license info from their profile (if registered)
  let license: { license_number?: string; license_expiry?: string; profession?: string } | null = null
  if (order.user_id) {
    const { data: prof } = await svc
      .from('profiles')
      .select('license_number, license_expiry, profession')
      .eq('id', order.user_id)
      .single()
    license = prof
  }

  const items = Array.isArray(order.order_items) ? order.order_items : []
  const shipping = order.shipping_address as ShippingAddress | null

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-[#1a3a5c] hover:underline">← Orders</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.reference_number ?? ''}</h1>
          <p className="mt-0.5 text-xs text-gray-400 font-mono">{order.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
          {statusLabel(order.status)}
        </span>
      </div>

      {sp.saved && <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">Order updated.</p>}
      {sp.error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{decodeURIComponent(sp.error)}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Customer */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</h2>
          <p className="mt-2 font-semibold text-gray-900">{order.full_name || '—'}</p>
          <p className="text-sm text-gray-600">{order.email}</p>
          {order.phone && <p className="text-sm text-gray-600">{order.phone}</p>}
          <p className="mt-1 text-xs text-gray-400">Placed: {new Date(order.created_at).toLocaleString()}</p>
          {!order.user_id && <p className="mt-1 text-xs text-amber-600">Guest order (no account)</p>}
        </section>

        {/* License */}
        <section className="rounded-xl border border-[#1a3a5c]/20 bg-blue-50/50 p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#1a3a5c]">Medical License</h2>
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="text-gray-500">Profession:</span> <span className="text-gray-900">{license?.profession ?? '—'}</span></p>
            <p><span className="text-gray-500">License #:</span> <span className="font-mono text-gray-900">{license?.license_number ?? '—'}</span></p>
            <p><span className="text-gray-500">Expiry:</span> <span className="text-gray-900">{license?.license_expiry ? String(license.license_expiry).slice(0, 10) : '—'}</span></p>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shipping Address</h2>
          <address className="mt-2 not-italic text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {formatAddress(shipping)}
          </address>
        </section>
      </div>

      {/* Notes */}
      {order.customer_notes && (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Notes</h2>
          <p className="mt-2 text-sm text-gray-700">{order.customer_notes}</p>
        </section>
      )}

      {/* Items */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</h2>
        <ul className="mt-3 space-y-2">
          {items.map((it: { id: string; title: string; quantity: number; unit_price: number }) => (
            <li key={it.id} className="flex justify-between text-sm">
              <span className="text-gray-800">{it.title} <span className="text-gray-400">× {it.quantity}</span></span>
              <span className="font-medium text-gray-900">{formatPrice(Number(it.unit_price) * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(Number(order.subtotal))}</span>
        </div>
      </section>

      {/* Update form */}
      <form action={updateOrderAction} className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Update Order</h2>
        <input type="hidden" name="id" value={order.id} />
        <div>
          <label className="text-xs font-medium text-gray-600">Status</label>
          <select name="status" defaultValue={order.status} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]">
            <option value="pending_csr">Pending review</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Admin notes (internal — not visible to customer)</label>
          <textarea name="admin_notes" rows={3} defaultValue={order.admin_notes ?? ''} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]" />
        </div>
        <button type="submit" className="rounded-md bg-[#1a3a5c] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#152f4a]">
          Update Order
        </button>
      </form>
    </div>
  )
}
