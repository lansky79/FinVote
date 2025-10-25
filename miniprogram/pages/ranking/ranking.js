// pages/ranking/ranking.js
const app = getApp()

Page({
  data: {
    users: [],
    topUsers: [],
    userInfo: null,
    currentPage: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.loadRanking(true)
  },

  onShow() {
    // 更新用户信息
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  onPullDownRefresh() {
    this.loadRanking(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 加载排行榜数据
  loadRanking(refresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const page = refresh ? 1 : this.data.currentPage

    wx.request({
      url: `${app.globalData.serverUrl}/user/ranking`,
      data: {
        page: page,
        limit: 20
      },
      success: (res) => {
        if (res.data.success) {
          const newUsers = res.data.data.users
          
          this.setData({
            users: refresh ? newUsers : [...this.data.users, ...newUsers],
            topUsers: refresh ? newUsers.slice(0, 3) : this.data.topUsers,
            currentPage: page,
            hasMore: res.data.data.pagination.current < res.data.data.pagination.total,
            loading: false
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 加载更多
  loadMore() {
    this.setData({
      currentPage: this.data.currentPage + 1
    })
    this.loadRanking(false)
  },

  // 处理登录
  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    
    app.wxLogin().then((data) => {
      wx.hideLoading()
      this.setData({
        userInfo: data.userInfo
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      // 重新加载排行榜
      this.loadRanking(true)
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error || '登录失败',
        icon: 'none'
      })
    })
  }
})