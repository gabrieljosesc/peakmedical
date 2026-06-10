'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { formatPrice, generateReferenceNumber } from '@/lib/utils'
import { productUnitPrice } from '@/lib/price-tiers'
import { computeShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { notifyNewOrder } from '@/app/actions/orders'
import { validateCoupon, recordCouponUse } from '@/app/actions/coupons'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ShoppingCart, Tag, X } from 'lucide-react'

interface FormData {
  first_name: string
  last_name: string
  company: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
  country: string
  notes: string
}

const initial: FormData = {
  first_name: '', last_name: '', company: '', email: '', phone: '',
  address_line1: '', address_line2: '', city: '', state: '', zip: '',
  country: 'US', notes: '',
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)

  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const discount = coupon ? Math.min(coupon.discount, total) : 0
  const shipping = computeShipping(total - discount)
  const grandTotal = Math.max(0, total - discount) + shipping

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    try {
      const res = await validateCoupon(code, total)
      if (res.ok) {
        setCoupon({ code: res.code, discount: res.discount })
        setCouponInput('')
        toast.success(`Coupon ${res.code} applied — you save ${formatPrice(res.discount)}`)
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error('Could not validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <Link href="/shop" className={cn(buttonVariants(), 'bg-[#1a3a5c] hover:bg-[#152f4a]')}>
          Browse Products
        </Link>
      </div>
    )
  }

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const required: (keyof FormData)[] = ['first_name', 'last_name', 'email', 'phone', 'address_line1', 'city', 'state', 'zip']
    const missing = required.filter(f => !form[f].trim())
    if (missing.length) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ref = generateReferenceNumber()

    try {
      // Re-validate the coupon server-side at placement time (authoritative)
      let appliedCode: string | null = null
      let appliedDiscount = 0
      if (coupon) {
        const res = await validateCoupon(coupon.code, total)
        if (res.ok) {
          appliedCode = res.code
          appliedDiscount = Math.min(res.discount, total)
        } else {
          setCoupon(null)
          toast.error(`Coupon removed: ${res.error}`)
          setLoading(false)
          return
        }
      }
      const shippingAmount = computeShipping(total - appliedDiscount)
      const orderTotal = Math.max(0, total - appliedDiscount) + shippingAmount

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          reference_number: ref,
          status: 'pending_csr',
          subtotal: total,
          coupon_code: appliedCode,
          discount_amount: appliedDiscount,
          shipping_amount: shippingAmount,
          total: orderTotal,
          email: form.email,
          full_name: `${form.first_name} ${form.last_name}`,
          phone: form.phone || null,
          shipping_address: {
            first_name: form.first_name,
            last_name: form.last_name,
            company: form.company,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
            phone: form.phone,
          },
          customer_notes: form.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          title: item.product.title,
          quantity: item.quantity,
          unit_price: productUnitPrice(item.product, item.quantity),
        }))
      )

      // Fire order notifications (customer + admin); don't block on result
      void notifyNewOrder(order.id)
      if (appliedCode) void recordCouponUse(appliedCode)

      clearCart()
      router.push(`/order-confirmed?ref=${ref}`)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Contact & Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" value={form.first_name} onChange={set('first_name')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" value={form.last_name} onChange={set('last_name')} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="company">Company / Clinic Name</Label>
                  <Input id="company" value={form.company} onChange={set('company')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={set('email')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address_line1">Address *</Label>
                  <Input id="address_line1" value={form.address_line1} onChange={set('address_line1')} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address_line2">Apartment, suite, etc.</Label>
                  <Input id="address_line2" value={form.address_line2} onChange={set('address_line2')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={set('city')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="state">State / Province *</Label>
                  <Input id="state" value={form.state} onChange={set('state')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP / Postal Code *</Label>
                  <Input id="zip" value={form.zip} onChange={set('zip')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={set('country')} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={set('notes')}
                    rows={3}
                    placeholder="Any special instructions..."
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">How payment works:</p>
              <p>After placing your order, our team will contact you within 24 business hours to confirm payment and shipping arrangements. No payment is captured on this website.</p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-lg border p-5 sticky top-24">
              <h2 className="font-semibold text-gray-800 mb-4">Your Order</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600 line-clamp-2">{item.product.title} × {item.quantity}</span>
                    <span className="font-medium flex-shrink-0">
                      {formatPrice(productUnitPrice(item.product, item.quantity) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="mb-4" />

              {/* Coupon */}
              {coupon ? (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-green-800">
                    <Tag className="w-3.5 h-3.5" /> {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoupon(null)}
                    className="text-green-700 hover:text-green-900"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mb-4 flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="font-mono uppercase"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyCoupon()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={couponLoading || !couponInput.trim()}
                    onClick={applyCoupon}
                    className="flex-shrink-0"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </Button>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({coupon?.code})</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="font-medium text-green-700">Free</span> : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}
                  </p>
                )}
              </div>
              <Separator className="mb-3" />
              <div className="flex justify-between font-bold text-gray-900 mb-5">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full bg-[#1a3a5c] hover:bg-[#152f4a]"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
