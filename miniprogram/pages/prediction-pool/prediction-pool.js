// pages/prediction-pool/prediction-pool.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    pools: [],
    loading: true,
    activeTab: 'active', // active: 进行中, my: 我的资金池
    showCreateModal: false,
    createForm: {
      title: '',
      stockCode: '',
      stockName: '',
      targetPrice: '',
      endTime: '',
      minStake: 10,
      maxStake: 100
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadPools()
  },

  onShow() {
    this.loadPools()
  },

  // 加载用户信息
  loadUserInfo() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
    this.loadPools()
  },

  // 加载资金池列表
  loadPools() {
    wx.request({
      url: `${app.globalData.serverUrl}/prediction-pool/list`,
      header: app.globalData.token ? {
        'Authorization': `Bearer ${app.globalData.token}`
      } : {},
      data: {
        type: this.data.activeTab
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            pools: res.data.data,
            loading: false
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 显示创建弹窗
  showCreatePool() {
    this.setData({
      showCreateModal: true
    })
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({
      showCreateModal: false,
      createForm: {
        title: '',
        stockCode: '',
        stockName: '',
        targetPrice: '',
        endTime: '',
        minStake: 10,
        maxStake: 100
      }
    })
  },

  // 表单输入
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`createForm.${field}`]: value
    })
  },

  // 创建资金池
  createPool() {
    const form = this.data.createForm
    
    if (!form.title || !form.stockCode || !form.targetPrice || !form.endTime) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '创建中...' })

    wx.request({
      url: `${app.globalData.serverUrl}/prediction-pool/create`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: form,
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          })
          this.hideCreateModal()
          this.loadPools()
        } else {
          wx.showToast({
            title: res.data.message || '创建失败',
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

  // 加入资金池
  joinPool(e) {
    const poolId = e.currentTarget.dataset.id
    const pool = this.data.pools.find(p => p.id === poolId)
    
    wx.showModal({
      title: '加入预测池',
      content: `选择您的预测方向和投入积分\n\n股票: ${pool.stockName}\n目标价: ${pool.targetPrice}`,
      showCancel: true,
      confirmText: '选择预测',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/pool-join/pool-join?id=${poolId}`
          })
        }
      }
    })
  },

  // 查看资金池详情
  viewPool(e) {
    const poolId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/pool-detail/pool-detail?id=${poolId}`
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
        return `${days}天${hours % 24}小时后结束`
      }
      return `${hours}小时${minutes}分钟后结束`
    } else {
      return '已结束'
    }
  }
})