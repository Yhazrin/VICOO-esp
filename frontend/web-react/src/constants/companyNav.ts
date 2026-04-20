/**
 * UNIQLO / company portal top-level nav — shared by Header, Layout mountKey, MobileNav.
 */
export const COMPANY_NAV = [
  { key: 'home', path: '/' },
  { key: 'shop', path: '/shop' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' },
] as const;

/** Which company tab the pathname belongs to (ignore impact shell). */
export function matchCompanyNavKey(pathname: string): string | null {
  if (pathname === '/') return 'home';
  const rest = COMPANY_NAV.filter((n) => n.path !== '/');
  const hit = rest.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
  return hit?.key ?? null;
}
