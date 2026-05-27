'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Props {
  product: Product
  wishlisted?: boolean
  onWishlistToggle?: (product: Product) => void
}

export default function ProductCard({ product, wishlisted, onWishlistToggle }: Props) {
  const { addToCart } = useCart()
  const displayPrice = product.sale_price ?? product.price
  const hasDiscount = product.sale_price !== null && product.sale_price < product.price

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addToCart(product, 1)
    toast.success(`${product.name} added to cart`)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    onWishlistToggle?.(product)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-[#e63946] hover:bg-[#e63946]">Sale</Badge>
          )}
          {onWishlistToggle && (
            <button
              onClick={handleWishlist}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.brand.name}</p>
          )}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-[#1a3a5c] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              {hasDiscount ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-[#e63946]">{formatPrice(displayPrice)}</span>
                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <span className="text-base font-bold text-gray-800">{formatPrice(displayPrice)}</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-[#1a3a5c] hover:bg-[#152f4a] text-white text-xs px-2.5 h-8"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
