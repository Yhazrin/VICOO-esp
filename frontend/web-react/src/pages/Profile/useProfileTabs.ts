import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export type TabKey =
  | 'overview'
  | 'orders'
  | 'donations'
  | 'clothing'
  | 'support'
  | 'addresses';

export const PROFILE_TABS: TabKey[] = [
  'overview',
  'orders',
  'donations',
  'clothing',
  'support',
  'addresses',
];

const VALID_TABS = new Set<string>(PROFILE_TABS);

function parseTab(raw: string | null): TabKey {
  if (raw && VALID_TABS.has(raw)) return raw as TabKey;
  return 'overview';
}

export function useProfileTabs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<TabKey>(() => parseTab(searchParams.get('tab')));

  useEffect(() => {
    setActiveTabState(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      setActiveTabState(tab);
      navigate({ pathname: '/profile', search: `?tab=${tab}` }, { replace: true });
    },
    [navigate],
  );

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tab: TabKey) => {
      const idx = PROFILE_TABS.indexOf(tab);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = PROFILE_TABS[(idx + 1) % PROFILE_TABS.length];
        setActiveTab(next);
        document.getElementById(`tab-${next}`)?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = PROFILE_TABS[(idx - 1 + PROFILE_TABS.length) % PROFILE_TABS.length];
        setActiveTab(prev);
        document.getElementById(`tab-${prev}`)?.focus();
      }
    },
    [setActiveTab],
  );

  return { activeTab, setActiveTab, handleTabKeyDown };
}
