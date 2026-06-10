import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuthUser } from '@/lib/supabase/auth'
import { Order, OrderItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const statusColors: Record<string, string> = {
  pending_csr: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuthUser('/account/orders')
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const addr = order.shipping_address as Order['shipping_address']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
          <p className="text-sm font-mono text-[#1a3a5c] mt-1">{order.reference_number}</p>
        </div>
        <Link href="/account/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          ← Orders
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Items */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {(order.items as OrderItem[]).map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gray-100" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="font-semibold text-sm text-gray-800 flex-shrink-0">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Shipping Address</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {addr.first_name} {addr.last_name}<br />
              {addr.company && <>{addr.company}<br /></>}
              {addr.address_line1}<br />
              {addr.address_line2 && <>{addr.address_line2}<br /></>}
              {addr.city}, {addr.state} {addr.zip}<br />
              {addr.country}<br />
              {addr.phone}
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Order Status</h2>
            <span className={`inline-block text-sm font-medium px-3 py-1.5 rounded-full capitalize ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <p className="text-xs text-gray-500">
              Placed {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            {order.notes && (
              <div className="pt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Your Notes</p>
                <p className="text-xs text-gray-500">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
