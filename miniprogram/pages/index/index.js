// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    stats: {
      totalVotes: 0,
      correctVotes: 0,
      accuracy: '0%'
    },
    hotVotes: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadData()
  },

  // 加载页面数据
  loadData() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    
    if (app.globalData.userInfo) {
      this.loadUserStats()
    }
    this.loadHotVotes()
  },

  // 处理登录
  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    
    app.wxLogin().then((data) => {
      wx.hideLoading()
      this.setData({
        userInfo: data.userInfo
      })
      this.loadUserStats()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error || '登录失败',
        icon: 'none'
      })
    })
  },

  // 加载用户统计数据
  loadUserStats() {
    if (!app.globalData.token) {
      // 未登录时显示默认统计
      this.setData({
        stats: {
          totalVotes: 0,
          correctVotes: 0,
          accuracy: '0%'
        }
      })
      return
    }
    
    wx.request({
      url: `${app.globalData.serverUrl}/user/stats`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            stats: res.data.data
          })
        }
      },
      fail: () => {
        // 请求失败时显示默认数据
        this.setData({
          stats: {
            totalVotes: 0,
            correctVotes: 0,
            accuracy: '0%'
          }
        })
      }
    })
  },

  // 加载热门投票
  loadHotVotes() {
    wx.request({
      url: `${app.globalData.serverUrl}/vote/hot`,
      success: (res) => {
        if (res.data.success) {
          this.setData({
            hotVotes: res.data.data.map(vote => ({
              ...vote,
              endTime: this.formatTime(vote.endTime)
            }))
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}小时${minutes}分钟后截止`
    } else {
      return '已截止'
    }
  },

  // 跳转到投票页面
  goToVote() {
    wx.switchTab({
      url: '/pages/vote/vote'
    })
  },

  // 跳转到投票详情
  goToVoteDetail(e) {
    const voteId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/vote-detail/vote-detail?id=${voteId}`
    })
  },

  // 跳转到创建投票
  goToCreateVote() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/create-vote/create-vote'
    })
  },

  // 跳转到区块链演示
  goToBlockchainDemo() {
    wx.navigateTo({
      url: '/pages/blockchain-demo/blockchain-demo'
    })
  },

  // 跳转到积分商城
  goToShop() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/shop/shop'
    })
  }
})