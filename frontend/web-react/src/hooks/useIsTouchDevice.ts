import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a touch device
 * Returns true for mobile phones, tablets, and devices with touch capability
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const checkTouchDevice = () => {
      const hasTouchCapability =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0;

      // Also consider devices with coarse pointer (touch-first devices)
      const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;

      setIsTouchDevice(hasTouchCapability || isCoarsePointer);
    };

    checkTouchDevice();

    // Re-check on resize (for responsive designs that might switch between touch/mouse)
    window.addEventListener('resize', checkTouchDevice);

    return () => {
      window.removeEventListener('resize', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
}
