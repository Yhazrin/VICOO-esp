/**
 * 将 API 返回的相对静态路径（如 /static/uploads/...）转为浏览器可请求的地址。
 * 开发环境 Vite 对 /static 做代理；生产环境一般为同源或网关转发。
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}
