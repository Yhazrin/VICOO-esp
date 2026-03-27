var http = require('../../utils/request');
var util = require('../../utils/util');

Page({
  data: {
    banners: [],
    stats: { artworkCount: 0, donationTotal: 0, participantCount: 0 },
    featuredArtworks: [],
    campaigns: [],
    loading: true
  },
  onLoad: function() {
    this.loadData();
  },
  onShow: function() {
    this.loadData();
  },
  onPullDownRefresh: function() {
    this.loadData().then(function() { wx.stopPullDownRefresh(); });
  },
  loadData: function() {
    var self = this;
    self.setData({ loading: true });
    return Promise.all([
      http.get('/home/banners'),
      http.get('/home/stats'),
      http.get('/artworks/featured', { limit: 4 }),
      http.get('/campaigns/active', { limit: 3 })
    ]).then(function(results) {
      self.setData({
        banners: results[0] || [],
        stats: results[1] || self.data.stats,
        featuredArtworks: results[2] || [],
        campaigns: results[3] || [],
        loading: false
      });
    }).catch(function() {
      self.setData({ loading: false });
    });
  },
  onArtworkTap: function(e) {
    wx.navigateTo({ url: '/pages/artwork/detail?id=' + e.detail.id });
  },
  onDonate: function() {
    wx.navigateTo({ url: '/pages/donate/index' });
  },
  onCampaignTap: function(e) {
    wx.navigateTo({ url: '/pages/vote/index?campaignId=' + e.currentTarget.dataset.id });
  },
  onShopTap: function() {
    wx.switchTab({ url: '/pages/shop/index' });
  },
  onShareAppMessage: function() {
    return { title: '\u7AE5\u753B\u516C\u76CA - \u53EF\u6301\u7EED\u65F6\u5C1A', path: '/pages/index/index' };
  }
});
