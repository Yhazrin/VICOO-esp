var app = getApp()
var request = require('../../utils/request')

var MOCK_ARTWORKS = [
  { id: 1, title: '森林的呼吸', child_display_name: '小星星', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', like_count: 128, campaign_name: '绿色地球', status: 'approved' },
  { id: 2, title: '海洋的眼泪', child_display_name: '小彩虹', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400', like_count: 96, campaign_name: '海洋守护者', status: 'approved' },
  { id: 3, title: '星空下的梦', child_display_name: '小月光', image_url: 'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=400', like_count: 215, campaign_name: '星空梦想家', status: 'approved' },
  { id: 4, title: '春天的花园', child_display_name: '小清风', image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400', like_count: 87, campaign_name: '春日画展', status: 'approved' },
  { id: 5, title: '彩虹桥', child_display_name: '小雨滴', image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400', like_count: 163, campaign_name: '童心绘梦', status: 'approved' },
  { id: 6, title: '旧衣新裳', child_display_name: '小布丁', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', like_count: 74, campaign_name: '旧衣新生', status: 'approved' },
  { id: 7, title: '地球妈妈', child_display_name: '小果冻', image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', like_count: 201, campaign_name: '绿色地球', status: 'approved' },
  { id: 8, title: '未来的城市', child_display_name: '小云朵', image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400', like_count: 145, campaign_name: '梦想与未来', status: 'approved' }
]

Page({
  data: {
    artworks: [],
    loading: true,
    page: 1,
    hasMore: true
  },
  onLoad: function () {
    this.loadData()
  },
  onPullDownRefresh: function () {
    this.setData({ page: 1, hasMore: true })
    this.loadData()
  },
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },
  loadData: function () {
    var that = this
    that.setData({ loading: true })

    setTimeout(function () {
      that.setData({
        artworks: MOCK_ARTWORKS,
        loading: false,
        hasMore: false
      })
      wx.stopPullDownRefresh()
    }, 400)
  },
  loadMore: function () {
    var that = this
    that.setData({ loading: true })
    var nextPage = that.data.page + 1

    setTimeout(function () {
      that.setData({
        page: nextPage,
        loading: false,
        hasMore: false
      })
    }, 300)
  },
  onArtworkTap: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/artwork/detail?id=' + id })
  },
  onLikeTap: function (e) {
    var id = e.currentTarget.dataset.id
    var artworks = this.data.artworks
    for (var i = 0; i < artworks.length; i++) {
      if (artworks[i].id === id) {
        artworks[i].like_count += 1
        break
      }
    }
    this.setData({ artworks: artworks })
    wx.showToast({ title: '已点赞', icon: 'success' })
  }
})
