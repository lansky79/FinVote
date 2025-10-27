// pages/vote-detail/vote-detail.js
const app = getApp()

Page({
  data: {
    voteId: '',
    vote: null,
    loading: true,
    userVote: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        voteId: options.id
      })
      this.loadVoteDetail()
    }
  },

  // 加载投票详情
  loadVoteDetail() {
    console.log('开始加载投票详情，ID:', this.data.voteId)
    console.log('服务器地址:', app.globalData.serverUrl)
    wx.showLoading({ title: '加载中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/vote/${this.data.voteId}`,
      header: app.globalData.token ? {
        'Authorization': `Bearer ${app.globalData.token}`
      } : {},
      success: (res) => {
        console.log('投票详情接口响应:', res.data)
        wx.hideLoading()
        if (res.data.success) {
          const vote = res.data.data
          console.log('投票详情数据:', vote)
          this.setData({
            vote: {
              ...vote,
              endTime: this.formatTime(vote.endTime),
              settlementTime: this.formatTime(vote.settlementTime)
            },
            userVote: vote.userVote,
            loading: false
          })
        } else {
          console.log('投票详情加载失败:', res.data.message)
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      },
      fail: (error) => {
        console.log('投票详情请求失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  // 投票
  handleVote(e) {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (this.data.userVote) {
      wx.showToast({
        title: '您已经投过票了',
        icon: 'none'
      })
      return
    }

    if (this.data.vote.status !== 'active') {
      wx.showToast({
        title: '投票已结束',
        icon: 'none'
      })
      return
    }

    const prediction = e.currentTarget.dataset.prediction
    
    wx.showModal({
      title: '确认投票',
      content: `您选择：${prediction === 'up' ? '看涨' : '看跌'}`,
      success: (res) => {
        if (res.confirm) {
          this.submitVote(prediction)
        }
      }
    })
  },

  // 提交投票
  submitVote(prediction) {
    wx.showLoading({ title: '投票中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/vote/${this.data.voteId}/vote`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        prediction: prediction
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '投票成功',
            icon: 'success'
          })
          // 重新加载投票详情
          this.loadVoteDetail()
        } else {
          wx.showToast({
            title: res.data.message || '投票失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
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
      if (hours > 24) {
        const days = Math.floor(hours / 24)
        return `${days}天${hours % 24}小时后`
      }
      return `${hours}小时${minutes}分钟后`
    } else {
      return '已截止'
    }
  }
})