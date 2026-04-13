/**
 * Generates an inline SVG data-URI placeholder image.
 * Used across pages where real product/campaign images are not yet available.
 */
export function placeholderImage(
  label: string,
  options: { hue?: number; width?: number; height?: number; subtitle?: string } = {},
): string {
  const { hue = 30, width = 400, height = 400, subtitle } = options;
  const subtitleMarkup = subtitle
    ? `<text x="${width / 2}" y="${height / 2 + 30}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="hsl(${hue},15%,60%)">${subtitle}</text>`
    : '';
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect fill="hsl(${hue},25%,88%)" width="${width}" height="${height}"/>` +
      `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central" font-family="serif" font-size="20" fill="hsl(${hue},20%,45%)">${label}</text>` +
      subtitleMarkup +
      `</svg>`,
  )}`;
}
