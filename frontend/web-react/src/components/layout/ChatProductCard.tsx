import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '@/services/products';
import { resolveProductLocale } from '@/utils/productLocale';
import { impactProductPath, companyProductPath } from '@/utils/productPaths';
import type { Product } from '@/types';

// ── Product URL matching ──
const PRODUCT_PATH_RE = /^\/(?:impact\/)?shop\/(\d+)$/;

export function extractProductId(href: string): number | null {
  try {
    const url = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin);
    const match = url.pathname.match(PRODUCT_PATH_RE);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

// ── Module-level cache ──
const productCache = new Map<string, Product>();

async function fetchProductCached(id: number, locale?: string): Promise<Product> {
  const cacheKey = `${id}:${locale ?? ''}`;
  if (productCache.has(cacheKey)) return productCache.get(cacheKey)!;
  const product = await productsApi.getById(String(id), locale);
  productCache.set(cacheKey, product);
  return product;
}

// ── Component ──
interface ChatProductCardProps {
  productId: number;
  fallbackName: string;
}

export const ChatProductCard: React.FC<ChatProductCardProps> = React.memo(({ productId, fallbackName }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProductCached(productId, i18n.language)
      .then((p) => { if (!cancelled) setProduct(p); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, i18n.language]);

  const isImpact = product?.isImpactProduct ?? /\/impact\//.test(fallbackName);
  const detailPath = isImpact ? impactProductPath(productId) : companyProductPath(productId);
  const productName = product
    ? resolveProductLocale(product, i18n.language).name || fallbackName
    : fallbackName;

  const handleClick = () => navigate(detailPath);

  // ── Error state: fallback styled link ──
  if (error) {
    return (
      <a
        href={detailPath}
        onClick={(e) => { e.preventDefault(); handleClick(); }}
        className="inline-flex items-center gap-1 text-[12px] transition-colors"
        style={{ color: 'var(--color-rust)', textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        {fallbackName || `Product #${productId}`}
        <span style={{ fontSize: 10 }}>→</span>
      </a>
    );
  }

  // ── Loading state: shimmer skeleton ──
  if (loading || !product) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          width: '100%',
          height: 140,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <div className="absolute inset-0 flex items-end px-3.5 pb-3">
          <div>
            <div
              className="rounded"
              style={{
                width: 120, height: 14,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.06) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            <div
              className="rounded mt-1.5"
              style={{
                width: 60, height: 10,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.04) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Loaded state: glass card with product image ──
  const currency = product.currency === 'CNY' ? '¥' : '$';

  return (
    <div
      className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        width: '100%',
        height: 140,
        marginTop: 8,
        marginBottom: 8,
      }}
      onClick={handleClick}
    >
      {/* Product image */}
      {product.image_url && (
        <img
          src={product.image_url}
          alt={productName}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            filter: 'none',
          }}
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }}
      />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8">
        <p
          className="text-[13px] font-semibold leading-tight truncate"
          style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          {productName}
        </p>
        <div className="flex items-center justify-end mt-1">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {currency}{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});
