'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function ProductDetail({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  const displayPrice = product.sale_price ?? product.price
  const hasDiscount = product.sale_price !== null && product.sale_price < product.price

  function handleAdd() {
    addToCart(product, qty)
    toast.success(`${qty}× ${product.name} added to cart`)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1a3a5c]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-[#1a3a5c]">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/shop/${product.category.slug}`} className="hover:text-[#1a3a5c]">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border mb-3">
            {product.images?.[activeImg] ? (
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                <ShoppingCart className="w-20 h-20" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                    activeImg === i ? 'border-[#1a3a5c]' : 'border-gray-200'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <Link
              href={`/shop?brand=${product.brand.slug}`}
              className="text-sm text-blue-600 hover:underline font-medium uppercase tracking-wide"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-4 leading-snug">{product.name}</h1>

          <div className="mb-4">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#e63946]">{formatPrice(displayPrice)}</span>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <Badge className="bg-[#e63946] hover:bg-[#e63946]">Sale</Badge>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">{formatPrice(displayPrice)}</span>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-600 mb-4 leading-relaxed">{product.short_description}</p>
          )}

          <Separator className="my-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button
              size="lg"
              onClick={handleAdd}
              className="flex-1 bg-[#1a3a5c] hover:bg-[#152f4a] gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
          </div>

          {product.sku && (
            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
          )}

          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <p>✓ Authentic products guaranteed</p>
            <p>✓ Free shipping on orders over $250</p>
            <p>✓ 24/7 customer support</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
          <div
            className="prose prose-gray max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  )
}
