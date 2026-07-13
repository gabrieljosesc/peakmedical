'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderPaymentAction } from '@/app/actions/order-payment'
import { formatExpiryMmYyInput } from '@/lib/card-validation'

const inputClass = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]'

export function UpdatePaymentForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [expiry, setExpiry] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const formData = new FormData(e.currentTarget)
    const res = await updateOrderPaymentAction(formData)
    if (res.ok) {
      router.push(`/account/orders/${orderId}?payment_updated=1`)
    } else {
      setStatus('error')
      setMessage(res.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />

      <div>
        <label htmlFor="card_number" className="text-xs font-medium text-gray-600">Card number</label>
        <input
          id="card_number"
          name="card_number"
          inputMode="numeric"
          autoComplete="cc-number"
          required
          placeholder="1234 5678 9012 3456"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="name_on_card" className="text-xs font-medium text-gray-600">Name on card</label>
        <input
          id="name_on_card"
          name="name_on_card"
          autoComplete="cc-name"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="expiry" className="text-xs font-medium text-gray-600">Expiry (MM/YY)</label>
          <input
            id="expiry"
            name="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            required
            placeholder="08/27"
            value={expiry}
            onChange={e => setExpiry(formatExpiryMmYyInput(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cvv" className="text-xs font-medium text-gray-600">CVV</label>
          <input
            id="cvv"
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            required
            maxLength={4}
            placeholder="123"
            className={inputClass}
          />
        </div>
      </div>

      {status === 'error' && message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-[#1a3a5c] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#152f4a] disabled:opacity-50"
      >
        {status === 'loading' ? 'Saving…' : 'Update payment details'}
      </button>
    </form>
  )
}
