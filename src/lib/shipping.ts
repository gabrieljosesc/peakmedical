export const FREE_SHIPPING_THRESHOLD = 800
export const FLAT_SHIPPING_RATE = 50

/**
 * Shipping rules (mirrors MedicaPlanet):
 * - the customer's first order ships free,
 * - later orders ship free at or above the threshold (after discounts),
 * - otherwise a flat rate applies.
 */
export function computeShipping(subtotalAfterDiscount: number, isFirstOrder = false): number {
  if (subtotalAfterDiscount <= 0) return 0
  if (isFirstOrder) return 0
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
}
