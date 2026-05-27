'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart()
  const imageUrl = product.images?.[0]?.url ?? null
  const showPrice = product.base_price > 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addToCart(product, 1)
    toast.success(`${product.title} added to cart`)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-[#1a3a5c] transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              {showPrice ? (
                <span className="text-base font-bold text-gray-800">{formatPrice(product.base_price)}</span>
              ) : (
                <span className="text-sm text-gray-400 italic">Contact for price</span>
              )}
            </div>
            {showPrice && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="bg-[#1a3a5c] hover:bg-[#152f4a] text-white text-xs px-2.5 h-8"
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
