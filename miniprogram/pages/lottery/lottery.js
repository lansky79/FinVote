// pages/lottery/lottery.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    userPoints: 0,
    isSpinning: false,
    spinAngle: 0,
    result: null,
    showResult: false,
    costPoints: 50, // 抽奖消耗积分
    prizes: [
      { id: 1, name: '10积分', points: 10, color: '#ff6b6b', probability: 30 },
      { id: 2, name: '20积分', points: 20, color: '#4ecdc4', probability: 25 },
      { id: 3, name: '50积分', points: 50, color: '#45b7d1', probability: 20 },
      { id: 4, name: '100积分', points: 100, color: '#f9ca24', probability: 15 },
      { id: 5, name: '200积分', points: 200, color: '#f0932b', probability: 8 },
      { id: 6, name: '500积分', points: 500, color: '#eb4d4b', probability: 2 }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      return
    }

    this.setData({
      userInfo: app.globalData.userInfo,
      userPoints: app.globalData.userInfo.points || 0
    })
  },

  // 开始抽奖
  startSpin() {
    if (this.data.isSpinning) return

    if (this.data.userPoints < this.data.costPoints) {
      wx.showToast({
        title: `积分不足，需要${this.data.costPoints}积分`,
        icon: 'none'
      })
      return
    }

    // 先扣除积分
    this.deductPoints()
  },

  // 扣除积分
  deductPoints() {
    wx.request({
      url: `${app.globalData.serverUrl}/lottery/spin`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        costPoints: this.data.costPoints
      },
      success: (res) => {
        if (res.data.success) {
          const result = res.data.data
          this.performSpin(result.prize)
          
          // 更新本地用户积分
          app.globalData.userInfo.points = result.newPoints
          this.setData({
            userPoints: result.newPoints
          })
        } else {
          wx.showToast({
            title: res.data.message || '抽奖失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 执行转盘动画
  performSpin(prize) {
    this.setData({
      isSpinning: true,
      showResult: false
    })

    // 计算目标角度
    const prizeIndex = this.data.prizes.findIndex(p => p.id === prize.id)
    const sectorAngle = 360 / this.data.prizes.length
    const targetAngle = 360 - (prizeIndex * sectorAngle + sectorAngle / 2)
    
    // 添加多圈旋转 + 随机偏移
    const finalAngle = this.data.spinAngle + 1800 + targetAngle + (Math.random() - 0.5) * 20

    this.setData({
      spinAngle: finalAngle
    })

    // 动画结束后显示结果
    setTimeout(() => {
      this.setData({
        isSpinning: false,
        result: prize,
        showResult: true
      })
    }, 3000)
  },

  // 关闭结果弹窗
  closeResult() {
    this.setData({
      showResult: false,
      result: null
    })
  },

  // 查看抽奖记录
  viewHistory() {
    wx.navigateTo({
      url: '/pages/lottery-history/lottery-history'
    })
  }
})