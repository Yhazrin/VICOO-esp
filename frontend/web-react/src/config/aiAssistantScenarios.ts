export interface AIAssistantSuggestion {
  label: string;
  prompt: string;
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
      { label: '推荐公益商品', prompt: '请推荐几件适合儿童公益场景的商品，并说明推荐理由。', context: 'shop' },
      { label: '查询溯源', prompt: '请帮我解释这件商品的溯源流程和关键节点。', context: 'sustainability' },
      { label: '看捐赠比例', prompt: '这类商品的捐赠比例和公益影响如何？', context: 'sustainability' },
      { label: '活动进展', prompt: '这个公益项目目前进展怎么样，能带来什么影响？', context: 'donation' },
    ];
  }

  if (isProductPage) {
    return [
      { label: '问材质', prompt: '请告诉我这件商品的材质、适合季节和日常穿搭建议。', context: 'shop' },
      { label: '看尺码', prompt: '我该怎么选择这件商品的尺码？请给出简单建议。', context: 'shop' },
      { label: '查溯源', prompt: '请解释这件商品的溯源和供应链信息。', context: 'sustainability' },
      { label: '售后说明', prompt: '这件商品有哪些退换货或售后注意事项？', context: 'logistics' },
    ];
  }

  return [
    { label: '找商品', prompt: '请根据我的需求推荐合适的商品。', context: 'shop' },
    { label: '查物流', prompt: '如何查看我的订单物流状态？', context: 'logistics' },
    { label: '问售后', prompt: '请说明退换货和售后流程。', context: 'logistics' },
    { label: '公益了解', prompt: '请介绍一下平台的公益和可持续实践。', context: 'sustainability' },
  ];
};
