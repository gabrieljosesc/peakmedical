'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import {
  getCart,
  addToCart as addToCartLib,
  removeFromCart as removeFromCartLib,
  updateCartQuantity as updateCartQuantityLib,
  clearCart as clearCartLib,
  getCartTotal,
  getCartCount,
} from '@/lib/cart'

interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(getCart())
  }, [])

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems(addToCartLib(product, quantity))
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems(removeFromCartLib(productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(updateCartQuantityLib(productId, quantity))
  }, [])

  const clearCart = useCallback(() => {
    clearCartLib()
    setItems([])
  }, [])

  return (
    <CartContext.Provider value={{
      items,
      count: getCartCount(items),
      total: getCartTotal(items),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
