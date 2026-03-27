var http = require('../../utils/request');

Page({
  data: {
    campaigns: [],
    loading: true,
    currentTab: 'all'
  },
  onLoad: function() { this.loadCampaigns(); },
  onPullDownRefresh: function() {
    this.loadCampaigns().then(function() { wx.stopPullDownRefresh(); });
  },
  loadCampaigns: function() {
    var self = this;
    self.setData({ loading: true });
    return http.get('/campaigns').then(function(res) {
      self.setData({ campaigns: res || [], loading: false });
    }).catch(function() {
      self.setData({ loading: false });
    });
  },
  onTabChange: function(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },
  onCampaignTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/vote/index?campaignId=' + id });
  },
  onShareAppMessage: function() {
    return { title: '\u7AE5\u753B\u516C\u76CA \u6D3B\u52A8', path: '/pages/campaigns/index' };
  }
});
