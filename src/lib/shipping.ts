export const FREE_SHIPPING_THRESHOLD = 800
export const MID_SHIPPING_THRESHOLD = 500
export const MID_SHIPPING_RATE = 50
export const BASE_SHIPPING_RATE = 100

/** One-line rate card, shown wherever the customer is ordering. */
export const SHIPPING_RATES_TEXT =
  `Shipping: FREE on orders $${FREE_SHIPPING_THRESHOLD}+ · $${MID_SHIPPING_RATE} on orders $${MID_SHIPPING_THRESHOLD}+ · $${BASE_SHIPPING_RATE} on orders under $${MID_SHIPPING_THRESHOLD}.`

/**
 * Shipping rules:
 * - the customer's first order ships free,
 * - $800+ (after discounts) ships free,
 * - $500–$799.99 ships at $50,
 * - under $500 ships at $100.
 */
export function computeShipping(subtotalAfterDiscount: number, isFirstOrder = false): number {
  if (subtotalAfterDiscount <= 0) return 0
  if (isFirstOrder) return 0
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0
  if (subtotalAfterDiscount >= MID_SHIPPING_THRESHOLD) return MID_SHIPPING_RATE
  return BASE_SHIPPING_RATE
}
