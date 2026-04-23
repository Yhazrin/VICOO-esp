/** `id` maps to `aiAssistant.suggestions.<id>.{label,prompt}` in locale files */
export interface AIAssistantSuggestion {
  id: string;
  context: string;
}

export const getAIAssistantMetadata = (impactMode: boolean, route: string) => ({
  impactMode,
  route,
  surface: impactMode ? 'impact' : 'uniqlo',
});

export const getAIAssistantSuggestions = (impactMode: boolean, route: string): AIAssistantSuggestion[] => {
  const isProductPage = /\/products?\//.test(route);
  const isImpactSurface = impactMode || route.includes('/impact');

  if (isImpactSurface) {
    return [
      { id: 'impactRecommend', context: 'shop' },
      { id: 'impactTraceFlow', context: 'sustainability' },
      { id: 'impactDonationRatio', context: 'sustainability' },
      { id: 'impactCampaignProgress', context: 'donation' },
    ];
  }

  if (isProductPage) {
    return [
      { id: 'productMaterials', context: 'shop' },
      { id: 'productSizing', context: 'shop' },
      { id: 'productTraceability', context: 'sustainability' },
      { id: 'productAfterSales', context: 'logistics' },
    ];
  }

  return [
    { id: 'generalFindProduct', context: 'shop' },
    { id: 'generalLogistics', context: 'logistics' },
    { id: 'generalReturns', context: 'logistics' },
    { id: 'generalWelfareIntro', context: 'sustainability' },
  ];
};
