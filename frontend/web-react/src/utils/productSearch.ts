import type { Product } from '@/types';

const TOKEN_ALIASES: Record<string, string[]> = {
  tshirt: ['tshirt', 'tee', 't恤', '短袖', '短袖t恤'],
  tee: ['tee', 'tshirt', 't恤', '短袖'],
  bag: ['bag', 'bags', '包', '袋', '背包', '帆布包', '托特', 'tote', 'backpack'],
  tote: ['tote', 'totebag', '帆布包', '托特', '包'],
  clothing: ['clothing', 'clothes', 'wear', '衣服', '衣物', '服装', '上衣'],
  apparel: ['apparel', 'clothing', '服装', '衣物'],
};

function normalizeInput(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\b(t[\s-]?shirt|tee[\s-]?shirt)\b/g, ' tshirt ')
    .replace(/\b(tote[\s-]?bag)\b/g, ' tote ')
    .replace(/\b(back[\s-]?pack)\b/g, ' backpack ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(raw: string): string[] {
  const normalized = normalizeInput(raw);
  if (!normalized) return [];
  return normalized.match(/[\u4e00-\u9fff]+|[a-z0-9]+/g) ?? [];
}

function normalizeForContains(raw: string): string {
  return normalizeInput(raw).replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}

function expandToken(token: string): string[] {
  const aliases = TOKEN_ALIASES[token];
  if (!aliases) return [token];
  return Array.from(new Set([token, ...aliases]));
}

export function matchesProductSearch(product: Product, query: string): boolean {
  const normalizedQuery = normalizeForContains(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeForContains(
    [
      product.name,
      product.nameEn ?? '',
      product.description,
      product.descriptionEn ?? '',
      product.category,
    ].join(' ')
  );

  if (haystack.includes(normalizedQuery)) return true;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return false;

  return queryTokens.every((token) =>
    expandToken(token).some((candidate) => {
      const normalizedCandidate = normalizeForContains(candidate);
      return normalizedCandidate.length > 0 && haystack.includes(normalizedCandidate);
    })
  );
}

