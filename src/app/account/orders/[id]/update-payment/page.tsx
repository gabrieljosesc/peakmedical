import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuthUser } from '@/lib/supabase/auth'
import { UpdatePaymentForm } from './update-payment-form'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function UpdateOrderPaymentPage({ params }: Props) {
  const { id } = await params
  const user = await requireAuthUser(`/account/orders/${id}/update-payment`)
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, reference_number, status, payment_card_snapshot')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!order) notFound()

  const ref = order.reference_number ?? order.id.slice(0, 8).toUpperCase()
  const snap = order.payment_card_snapshot as { brand?: string | null; last4?: string } | null

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-5">
      <div>
        <Link href={`/account/orders/${id}`} className="text-sm font-medium text-[#1a3a5c] hover:underline">
          ← Order {ref}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-800">Update payment</h1>
        <p className="mt-2 text-sm text-gray-600">
          There was a problem processing the card on order <span className="font-medium">{ref}</span>
          {snap?.last4 ? <> ({snap.brand ?? 'card'} ···· {snap.last4})</> : null}
          . Enter your new card details below and our team will re-process your order.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <UpdatePaymentForm orderId={order.id} />
      </div>

      <p className="text-xs text-gray-500">
        Your card details are encrypted and used only to process this order.
      </p>
    </div>
  )
}
