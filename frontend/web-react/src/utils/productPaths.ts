/** Company (UNIQLO) storefront product detail */
export function companyProductPath(productId: number | string): string {
  return `/shop/${productId}`;
}

/** Impact / public-welfare storefront — keeps impact shell and globe trace UX */
export function impactProductPath(productId: number | string): string {
  return `/impact/shop/${productId}`;
}

export function productDetailPath(
  productId: number | string,
  product?: { isImpactProduct?: boolean | null }
): string {
  if (product?.isImpactProduct) return impactProductPath(productId);
  return companyProductPath(productId);
}
