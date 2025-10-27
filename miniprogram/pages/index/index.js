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
          const stats = res.data.data
          this.setData({
            stats: {
              totalVotes: stats.totalVotes || 0,
              correctVotes: stats.correctVotes || 0,
              accuracy: stats.accuracy || '0%'
            }
          })
        } else {
          this.setDefaultStats()
        }
      },
      fail: () => {
        this.setDefaultStats()
      }
    })
  },

  // 设置默认统计数据
  setDefaultStats() {
    this.setData({
      stats: {
        totalVotes: 0,
        correctVotes: 0,
        accuracy: '0%'
      }
    })
  },

  // 加载热门投票
  loadHotVotes() {
    console.log('开始加载热门投票，服务器地址:', app.globalData.serverUrl)
    wx.request({
      url: `${app.globalData.serverUrl}/vote/hot`,
      header: app.globalData.token ? {
        'Authorization': `Bearer ${app.globalData.token}`
      } : {},
      success: (res) => {
        console.log('热门投票接口响应:', res.data)
        if (res.data.success) {
          const hotVotes = res.data.data.map(vote => ({
            ...vote,
            endTime: this.formatTime(vote.endTime),
            userVoted: vote.userVoted || false
          }))
          console.log('处理后的热门投票数据:', hotVotes)
          this.setData({
            hotVotes: hotVotes
          })
        } else {
          console.log('热门投票接口返回失败:', res.data.message)
        }
      },
      fail: (error) => {
        console.log('热门投票接口请求失败:', error)
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

  // 跳转到转盘抽奖
  goToLottery() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/lottery/lottery'
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
  },

  // 跳转到智能合约
  goToSmartContract() {
    wx.navigateTo({
      url: '/pages/reward-contract-simple/reward-contract-simple'
    })
  }
})