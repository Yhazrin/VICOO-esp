export function placeholderImage(
  label: string,
  options: { hue?: number; width?: number; height?: number; subtitle?: string } = {},
): string {
  const { hue = 30, width = 400, height = 400, subtitle } = options;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="hsl(${hue},25%,88%)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="18" fill="hsl(${hue},20%,40%)">${label}</text>
    ${subtitle ? `<text x="50%" y="62%" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="hsl(${hue},15%,55%)">${subtitle}</text>` : ''}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
