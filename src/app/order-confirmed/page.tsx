import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Received!</h1>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Thank you! Our team will contact you shortly to confirm payment and shipping.
        No payment was captured on this website.
      </p>
      {ref && (
        <div className="inline-block bg-gray-100 rounded-lg px-6 py-3 mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reference Number</p>
          <p className="text-xl font-bold text-[#1a3a5c] font-mono">{ref}</p>
        </div>
      )}
      <div className="text-sm text-gray-500 mb-8 bg-blue-50 rounded-lg p-4">
        <p>We&apos;ll reach out via <strong>+1-888-222-0373</strong> or email within <strong>24 business hours</strong>.</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/shop" className={cn(buttonVariants(), 'bg-[#1a3a5c] hover:bg-[#152f4a]')}>
          Continue Shopping
        </Link>
        <Link href="/account/orders" className={buttonVariants({ variant: 'outline' })}>
          View My Orders
        </Link>
      </div>
    </div>
  )
}
