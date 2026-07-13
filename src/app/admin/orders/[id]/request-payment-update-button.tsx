'use client'

import { useState } from 'react'
import { requestPaymentUpdateAction } from '@/app/actions/admin'

export function RequestPaymentUpdateButton({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleClick() {
    if (!confirm('Email the customer a link to update the payment card for this order?')) return
    setStatus('loading')
    const res = await requestPaymentUpdateAction(orderId)
    setStatus(res.ok ? 'ok' : 'error')
    setMessage(res.message)
  }

  if (status === 'ok') {
    return <p className="mt-3 text-xs font-medium text-green-700">✓ {message}</p>
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1a3a5c] hover:bg-amber-100 disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Request updated payment'}
      </button>
      {status === 'error' && message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null}
    </div>
  )
}
