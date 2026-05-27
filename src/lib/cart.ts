'use client'

import { CartItem, Product } from '@/types'

const CART_KEY = 'pmw_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(product: Product, quantity = 1): CartItem[] {
  const cart = getCart()
  const existing = cart.find(item => item.product_id === product.id)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({
      id: crypto.randomUUID(),
      product_id: product.id,
      quantity,
      product,
    })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter(item => item.product_id !== productId)
  saveCart(cart)
  return cart
}

export function updateCartQuantity(productId: string, quantity: number): CartItem[] {
  const cart = getCart()
  const item = cart.find(i => i.product_id === productId)
  if (item) {
    if (quantity <= 0) return removeFromCart(productId)
    item.quantity = quantity
  }
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    const price = item.product.sale_price ?? item.product.price
    return sum + price * item.quantity
  }, 0)
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
