'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderReceivedEmail, sendAdminNewOrderEmail, type OrderEmailRow } from '@/lib/email/order-emails'

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
      .select('id, reference_number, email, full_name, status, subtotal, order_items(title, quantity, unit_price)')
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
