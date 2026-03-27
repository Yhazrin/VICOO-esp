var app = getApp()
var request = require('../../utils/request')

var MOCK_CAMPAIGNS = {
  1: {
    id: 1,
    name: '绿色地球 · 环保时装秀',
    description: '用创意重新定义时尚，孩子们用废旧材料设计环保服装，让每一件作品都讲述可持续发展的故事。',
    cover_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    status: 'active',
    start_date: '2026-02-01',
    end_date: '2026-04-30',
    artwork_goal: 200,
    artwork_count: 156,
    participant_count: 89,
    total_votes: 3420,
    related_artworks: [
      { id: 1, title: '森林的呼吸', child_display_name: '小星星', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', like_count: 128 },
      { id: 7, title: '地球妈妈', child_display_name: '小果冻', image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', like_count: 201 },
      { id: 3, title: '星空下的梦', child_display_name: '小月光', image_url: 'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=400', like_count: 215 },
      { id: 5, title: '彩虹桥', child_display_name: '小雨滴', image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400', like_count: 163 }
    ]
  },
  2: {
    id: 2,
    name: '童心绘梦 · 春日画展',
    description: '春天来了，孩子们用画笔描绘心中最美的春天，每一幅作品都是对自然的热爱。',
    cover_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    status: 'active',
    start_date: '2026-03-01',
    end_date: '2026-05-31',
    artwork_goal: 150,
    artwork_count: 67,
    participant_count: 45,
    total_votes: 1280,
    related_artworks: [
      { id: 4, title: '春天的花园', child_display_name: '小清风', image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400', like_count: 87 },
      { id: 8, title: '未来的城市', child_display_name: '小云朵', image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400', like_count: 145 }
    ]
  },
  3: {
    id: 3,
    name: '海洋守护者',
    description: '孩子们用画笔描绘美丽的海洋，呼吁大家保护海洋生态，让蓝色星球更加美好。',
    cover_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    status: 'active',
    start_date: '2026-01-15',
    end_date: '2026-06-30',
    artwork_goal: 300,
    artwork_count: 203,
    participant_count: 134,
    total_votes: 5670,
    related_artworks: [
      { id: 2, title: '海洋的眼泪', child_display_name: '小彩虹', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400', like_count: 96 },
      { id: 6, title: '旧衣新裳', child_display_name: '小布丁', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', like_count: 74 }
    ]
  }
}

Page({
  data: {
    campaign: null,
    loading: true,
    progressPercent: 0
  },
  onLoad: function (options) {
    var id = options.id ? parseInt(options.id) : 1
    this.loadCampaign(id)
  },
  loadCampaign: function (id) {
    var that = this
    that.setData({ loading: true })

    setTimeout(function () {
      var campaign = MOCK_CAMPAIGNS[id] || MOCK_CAMPAIGNS[1]
      var progressPercent = Math.min(100, Math.round(campaign.artwork_count / campaign.artwork_goal * 100))
      that.setData({
        campaign: campaign,
        loading: false,
        progressPercent: progressPercent
      })
      wx.setNavigationBarTitle({ title: campaign.name })
    }, 300)

    // Real API (uncomment when ready):
    // request.get('/campaigns/' + id).then(function(data) {
    //   var c = data
    //   var pct = Math.min(100, Math.round(c.artwork_count / c.artwork_goal * 100))
    //   that.setData({ campaign: c, loading: false, progressPercent: pct })
    // }).catch(function() {
    //   var c = MOCK_CAMPAIGNS[id] || MOCK_CAMPAIGNS[1]
    //   that.setData({ campaign: c, loading: false, progressPercent: Math.round(c.artwork_count / c.artwork_goal * 100) })
    // })
  },
  onJoinTap: function () {
    wx.navigateTo({
      url: '/pages/upload/index?campaign_id=' + this.data.campaign.id
    })
  },
  onArtworkTap: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/artwork/detail?id=' + id })
  },
  onDonateTap: function () {
    wx.navigateTo({ url: '/pages/donate/index' })
  },
  onShareAppMessage: function () {
    var c = this.data.campaign
    return {
      title: c ? c.name : '童画公益活动',
      path: '/pages/campaign-detail/index?id=' + (c ? c.id : 1)
    }
  }
})
