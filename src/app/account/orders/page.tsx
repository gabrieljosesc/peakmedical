import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAccountUser } from '@/lib/supabase/auth'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending_csr: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function OrdersPage() {
  const user = await getAccountUser()
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-700 mb-1">No orders yet</h2>
          <p className="text-sm text-gray-400 mb-5">Your order history will appear here.</p>
          <Link href="/shop" className={cn(buttonVariants(), 'bg-[#1a3a5c] hover:bg-[#152f4a]')}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders as Order[]).map(order => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-medium text-[#1a3a5c]">{order.reference_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-gray-800">{formatPrice(order.subtotal)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
