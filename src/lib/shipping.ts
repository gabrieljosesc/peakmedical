export const FREE_SHIPPING_THRESHOLD = 800
export const FLAT_SHIPPING_RATE = 25

/** Flat-rate shipping, free at or above the threshold (after discounts). */
export function computeShipping(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
}
