import { type ReactNode } from 'react';

/**
 * No-op transition — actual page transitions are handled by HorizontalSlideTransition
 * in the Layout component. This component exists only to preserve the import interface.
 */
export default function SmoothTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
