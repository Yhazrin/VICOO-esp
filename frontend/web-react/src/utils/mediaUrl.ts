/**
 * 将 API 返回的相对静态路径（如 /static/uploads/...）转为浏览器可请求的地址。
 * 开发环境 Vite 对 /static 做代理；生产环境一般为同源或网关转发。
 * 中文等非 ASCII 文件名需 encodeURI，否则部分浏览器/nginx 会 404。
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return encodeURI(path);
}
