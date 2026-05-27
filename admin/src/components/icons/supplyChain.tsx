import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Sprout,
  Cog,
  Factory,
  BadgeCheck,
  Truck,
  Package,
  Link2,
  MapPin,
  Leaf,
  Globe,
  ImagePlus,
} from 'lucide-react';
import type { SupplyChainRecord } from '../../types';

/** Match sidebar: 16px, stroke 1.5 */
export const ICON_STROKE = 1.5;

export const SUPPLY_CHAIN_STAGE_ICONS: Record<SupplyChainRecord['stage'], LucideIcon> = {
  material_sourcing: Sprout,
  processing: Cog,
  manufacturing: Factory,
  quality_check: BadgeCheck,
  shipping: Truck,
};

export function SupplyChainStageIcon({
  stage,
  size = 14,
  className,
  style,
}: {
  stage: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = SUPPLY_CHAIN_STAGE_ICONS[stage as SupplyChainRecord['stage']] ?? Package;
  return (
    <Icon
      size={size}
      strokeWidth={ICON_STROKE}
      aria-hidden
      className={className}
      style={{ flexShrink: 0, ...style }}
    />
  );
}

export { Package, Link2, MapPin, Leaf, Globe, ImagePlus };
