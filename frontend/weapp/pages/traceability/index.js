var app = getApp()
var request = require('../../utils/request')

var MOCK_PRODUCTS = [
  { id: 1, title: '森林呼吸帆布包' },
  { id: 2, title: '自然系列T恤' },
  { id: 3, title: '彩虹系列丝巾' },
  { id: 4, title: '童画手账本' },
  { id: 5, title: '海洋守护者背包' }
]

var MOCK_SUPPLY_CHAIN = {
  1: [
    { stage: '原料采购', icon: '1', description: '有机棉采购自新疆阿克苏生态农场，采用GOTS全球有机纺织品标准认证的种植方式', location: '新疆·阿克苏', date: '2025-11-15', cert: 'GOTS有机认证', cert_no: 'GOTS-2025-XJ-0012' },
    { stage: '纺织加工', icon: '2', description: '使用节水工艺织造帆布面料，相比传统工艺节水60%，使用环保植物染料进行印染', location: '江苏·南通', date: '2025-12-03', cert: 'OEKO-TEX认证', cert_no: 'OTX-2025-NT-0347' },
    { stage: '成品制造', icon: '3', description: '在BSCI认证的公平贸易工厂中手工缝制，工人享有合理薪酬与良好工作环境', location: '广东·东莞', date: '2026-01-10', cert: 'BSCI认证', cert_no: 'BSCI-2026-DG-0089' },
    { stage: '质量检测', icon: '4', description: '通过SGS第三方检测，涵盖重金属含量、甲醛、色牢度等28项安全指标', location: '上海', date: '2026-01-20', cert: 'SGS检测报告', cert_no: 'SGS-2026-SH-0156' },
    { stage: '物流配送', icon: '5', description: '使用100%可降解包装材料，与绿色物流合作伙伴协作，碳排放减少40%', location: '全国配送', date: '2026-02-01', cert: '绿色物流认证', cert_no: 'GL-2026-0023' }
  ],
  2: [
    { stage: '原料采购', icon: '1', description: '有机棉原料采购，GOTS认证', location: '新疆', date: '2025-10-20', cert: 'GOTS有机认证', cert_no: 'GOTS-2025-XJ-0015' },
    { stage: '纺织加工', icon: '2', description: '精梳棉纺织，环保染色', location: '山东·济南', date: '2025-11-15', cert: 'OEKO-TEX认证', cert_no: 'OTX-2025-JN-0412' },
    { stage: '成品制造', icon: '3', description: '数码印花技术，减少水资源浪费', location: '广东·深圳', date: '2025-12-20', cert: 'BSCI认证', cert_no: 'BSCI-2025-SZ-0234' },
    { stage: '质量检测', icon: '4', description: '全面质量检测通过', location: '上海', date: '2026-01-05', cert: 'SGS检测报告', cert_no: 'SGS-2026-SH-0089' },
    { stage: '物流配送', icon: '5', description: '环保包装，碳中和物流', location: '全国配送', date: '2026-01-18', cert: '绿色物流认证', cert_no: 'GL-2026-0011' }
  ]
}

// Default chain for products not in mock
var DEFAULT_CHAIN = [
  { stage: '原料采购', icon: '1', description: '可持续来源原材料，经过环保认证', location: '国内', date: '2025-10-01', cert: '环保认证', cert_no: 'ENV-2025-001' },
  { stage: '加工制造', icon: '2', description: '采用负责任的生产工艺，减少环境影响', location: '国内', date: '2025-11-01', cert: '质量认证', cert_no: 'QC-2025-001' },
  { stage: '质量检测', icon: '3', description: '通过严格的质量把控和安全检测', location: '上海', date: '2025-12-01', cert: 'SGS检测', cert_no: 'SGS-2025-001' },
  { stage: '物流配送', icon: '4', description: '使用环保包装材料进行配送', location: '全国配送', date: '2026-01-01', cert: '绿色物流', cert_no: 'GL-2026-001' }
]

Page({
  data: {
    products: MOCK_PRODUCTS,
    selectedProductId: 0,
    supplyChain: [],
    loading: false,
    searched: false
  },
  onLoad: function () {
    // Show product list initially
  },
  onProductSelect: function (e) {
    var id = e.currentTarget.dataset.id
    this.setData({ selectedProductId: id, searched: true })
    this.loadSupplyChain(id)
  },
  loadSupplyChain: function (productId) {
    var that = this
    that.setData({ loading: true })

    setTimeout(function () {
      var chain = MOCK_SUPPLY_CHAIN[productId] || DEFAULT_CHAIN
      that.setData({
        supplyChain: chain,
        loading: false
      })
    }, 400)

    // Real API (uncomment when ready):
    // request.get('/supply-chain/' + productId).then(function(data) {
    //   that.setData({ supplyChain: data.records || [], loading: false })
    // }).catch(function() {
    //   that.setData({ supplyChain: MOCK_SUPPLY_CHAIN[productId] || DEFAULT_CHAIN, loading: false })
    // })
  },
  onReset: function () {
    this.setData({ selectedProductId: 0, supplyChain: [], searched: false })
  }
})
