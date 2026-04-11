import { useSearchParams } from 'react-router-dom';
import Campaigns from '@/pages/Campaigns';
import Stories from '@/pages/Stories';
import Traceability from '@/pages/Traceability';
import Donate from '@/pages/Donate';
import ImpactShop from '@/pages/ImpactShop';

type ImpactTab = 'campaigns' | 'stories' | 'traceability' | 'donate' | 'shop';

const VALID_TABS: ImpactTab[] = ['campaigns', 'stories', 'traceability', 'donate', 'shop'];

export default function Impact() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') as ImpactTab;
  const activeTab = VALID_TABS.includes(tab) ? tab : 'campaigns';

  switch (activeTab) {
    case 'stories': return <Stories />;
    case 'traceability': return <Traceability />;
    case 'donate': return <Donate />;
    case 'shop': return <ImpactShop />;
    case 'campaigns':
    default: return <Campaigns />;
  }
}
