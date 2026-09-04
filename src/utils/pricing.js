// Shared price math for food discounts.
// Food docs store the ORIGINAL price + a discount percentage. The effective
// (final, charged) price is what cards, the cart, checkout and the order
// payload all use.

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const clampDiscount = (d) =>
  Math.min(100, Math.max(0, Number(d) || 0));

// Effective/final price after applying the discount percentage.
export const effectivePrice = (price, discount) =>
  round2((Number(price) || 0) * (1 - clampDiscount(discount) / 100));