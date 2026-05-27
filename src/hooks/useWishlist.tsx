'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'

const LOCAL_WISHLIST_KEY = 'pmw_wishlist'

export function useWishlist(userId?: string) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (userId) {
      supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId)
        .then(({ data }) => {
          if (data) setWishlistIds(data.map(d => d.product_id))
        })
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_WISHLIST_KEY)
        setWishlistIds(stored ? JSON.parse(stored) : [])
      } catch {
        setWishlistIds([])
      }
    }
  }, [userId])

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  )

  const toggleWishlist = useCallback(async (product: Product) => {
    const alreadyIn = wishlistIds.includes(product.id)
    if (userId) {
      if (alreadyIn) {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', product.id)
        setWishlistIds(prev => prev.filter(id => id !== product.id))
      } else {
        await supabase
          .from('wishlist_items')
          .insert({ user_id: userId, product_id: product.id })
        setWishlistIds(prev => [...prev, product.id])
      }
    } else {
      const next = alreadyIn
        ? wishlistIds.filter(id => id !== product.id)
        : [...wishlistIds, product.id]
      setWishlistIds(next)
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(next))
    }
  }, [userId, wishlistIds, supabase])

  return { wishlistIds, isWishlisted, toggleWishlist }
}
