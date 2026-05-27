'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products to get started.</p>
        <Link href="/shop" className={cn(buttonVariants(), 'bg-[#1a3a5c] hover:bg-[#152f4a]')}>
          Browse Products
        </Link>
      </div>
    )
  }

  const freeShipping = total >= 250

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const imageUrl = item.product.images?.[0]?.url ?? null
            return (
              <div key={item.id} className="bg-white rounded-lg border p-4 flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={item.product.title} fill className="object-contain p-2" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.slug}`} className="font-medium text-gray-800 hover:text-[#1a3a5c] line-clamp-2 text-sm">
                    {item.product.title}
                  </Link>
                  {item.product.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.product.category.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">{formatPrice(item.product.base_price * item.quantity)}</span>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-5 sticky top-24">
            <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={freeShipping ? 'text-green-600 font-medium' : ''}>
                  {freeShipping ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>
            </div>
            {!freeShipping && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded p-2 mb-4">
                Add {formatPrice(250 - total)} more for free shipping!
              </p>
            )}
            <Separator className="mb-4" />
            <div className="flex justify-between font-bold text-gray-900 mb-5">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center bg-[#1a3a5c] hover:bg-[#152f4a]')}>
              Proceed to Checkout
            </Link>
            <Link href="/shop" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-center mt-2')}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
