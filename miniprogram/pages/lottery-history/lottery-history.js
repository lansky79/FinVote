// pages/lottery-history/lottery-history.js
const app = getApp()

Page({
  data: {
    history: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadHistory()
  },

  // 加载抽奖记录
  loadHistory() {
    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${app.globalData.serverUrl}/lottery/history`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: {
        page: this.data.page,
        limit: 20
      },
      success: (res) => {
        if (res.data.success) {
          const newHistory = res.data.data.records
          this.setData({
            history: this.data.page === 1 ? newHistory : [...this.data.history, ...newHistory],
            hasMore: newHistory.length === 20,
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      history: []
    })
    this.loadHistory()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadHistory()
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
})