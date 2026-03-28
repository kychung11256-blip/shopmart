/**
 * Price utility functions
 * Database stores prices in cents (e.g., 490 = $4.90)
 * Frontend displays prices in dollars (e.g., $4.90)
 */

/**
 * Convert cents to dollars
 * @param cents Price in cents (e.g., 490)
 * @returns Price in dollars (e.g., 4.90)
 */
export function centsToDollars(cents: number): number {
  return Math.round((cents / 100) * 100) / 100;
}

/**
 * Convert dollars to cents
 * @param dollars Price in dollars (e.g., 4.90)
 * @returns Price in cents (e.g., 490)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format price for display
 * @param cents Price in cents
 * @returns Formatted price string (e.g., "$4.90")
 */
export function formatPrice(cents: number): string {
  return `$${centsToDollars(cents).toFixed(2)}`;
}

/**
 * Convert product from database format to API format
 */
export function convertProductToAPI(product: any) {
  return {
    ...product,
    price: centsToDollars(product.price),
    originalPrice: product.originalPrice ? centsToDollars(product.originalPrice) : undefined,
  };
}

/**
 * Convert multiple products to API format
 */
export function convertProductsToAPI(products: any[]) {
  return products.map(convertProductToAPI);
}
