import { memo } from 'react';
import uniqloLogo from '@/assets/uniqlo-logo.svg';

/**
 * UNIQLO logo — official SVG.
 */
function UniqloLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={uniqloLogo}
      alt="UNIQLO"
      className={className}
      style={{ height: '1.6em', width: 'auto', display: 'block' }}
    />
  );
}

export default memo(UniqloLogo);
