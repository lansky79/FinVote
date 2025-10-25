// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    recentVotes: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  // 加载页面数据
  loadData() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    
    if (app.globalData.userInfo) {
      this.loadRecentVotes()
    }
  },

  // 加载最近投票记录
  loadRecentVotes() {
    wx.request({
      url: `${app.globalData.serverUrl}/user/vote-history`,
      data: {
        page: 1,
        limit: 3
      },
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          const recentVotes = res.data.data.votes.map(vote => ({
            ...vote,
            voteTimeText: this.formatTime(vote.voteTime)
          }))
          
          this.setData({
            recentVotes: recentVotes
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) {
      return `${days}天前`
    } else if (hours > 0) {
      return `${hours}小时前`
    } else if (minutes > 0) {
      return `${minutes}分钟前`
    } else {
      return '刚刚'
    }
  },

  // 处理登录
  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    
    app.wxLogin().then((data) => {
      wx.hideLoading()
      this.setData({
        userInfo: data.userInfo
      })
      this.loadRecentVotes()
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

  // 编辑个人资料
  editProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const { userInfo } = res
        
        // 更新用户信息到服务器
        wx.request({
          url: `${app.globalData.serverUrl}/auth/update-profile`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${app.globalData.token}`
          },
          data: {
            userInfo: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            }
          },
          success: (response) => {
            if (response.data.success) {
              // 更新本地用户信息
              app.globalData.userInfo.nickName = userInfo.nickName
              app.globalData.userInfo.avatarUrl = userInfo.avatarUrl
              
              this.setData({
                'userInfo.nickName': userInfo.nickName,
                'userInfo.avatarUrl': userInfo.avatarUrl
              })
              
              wx.showToast({
                title: '更新成功',
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: '更新失败',
                icon: 'none'
              })
            }
          }
        })
      },
      fail: () => {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到投票记录
  goToVoteHistory() {
    wx.navigateTo({
      url: '/pages/vote-history/vote-history'
    })
  },

  // 跳转到积分商城
  goToShop() {
    wx.navigateTo({
      url: '/pages/shop/shop'
    })
  },

  // 跳转到兑换记录
  goToExchangeHistory() {
    wx.navigateTo({
      url: '/pages/exchange-history/exchange-history'
    })
  },

  // 显示关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '股票投票小程序 v1.0\n\n一个有趣的股票预测社区，通过投票预测股票涨跌，获得积分奖励。\n\n让投资变得更有趣！',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 显示意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有任何问题或建议，请联系我们：\n\n邮箱：feedback@stockvote.com\n微信：stockvote2024',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})