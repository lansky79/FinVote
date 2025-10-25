// pages/create-vote/create-vote.js
const app = getApp()

Page({
  data: {
    formData: {
      title: '',
      description: '',
      stockCode: '',
      endDate: '',
      endTime: '',
      settlementDate: '',
      settlementTime: ''
    },
    stockInfo: {},
    voteTypes: [
      { name: '个股', value: 'stock' },
      { name: '指数', value: 'index' }
    ],
    voteTypeIndex: 0,
    pointsOptions: [5, 10, 15, 20, 30, 50],
    pointsIndex: 1,
    today: '',
    canSubmit: false
  },

  onLoad() {
    this.initData()
  },

  initData() {
    const today = new Date()
    const todayStr = this.formatDate(today)
    
    // 设置默认的截止时间为明天
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = this.formatDate(tomorrow)
    
    // 设置默认的结算时间为后天
    const dayAfterTomorrow = new Date(today.getTime() + 48 * 60 * 60 * 1000)
    const dayAfterTomorrowStr = this.formatDate(dayAfterTomorrow)

    this.setData({
      today: todayStr,
      'formData.endDate': tomorrowStr,
      'formData.endTime': '15:00',
      'formData.settlementDate': dayAfterTomorrowStr,
      'formData.settlementTime': '15:00'
    })
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
    
    this.checkCanSubmit()
  },

  handleVoteTypeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      voteTypeIndex: index,
      stockInfo: {} // 清空股票信息
    })
  },

  handleDateChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
    
    this.checkCanSubmit()
  },

  handleTimeChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
    
    this.checkCanSubmit()
  },

  handlePointsChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      pointsIndex: index
    })
  },

  // 搜索股票信息
  searchStock() {
    const { stockCode } = this.data.formData
    if (!stockCode) {
      wx.showToast({
        title: '请输入股票代码',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '搜索中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/stock/search`,
      data: {
        code: stockCode.toUpperCase(),
        type: this.data.voteTypes[this.data.voteTypeIndex].value
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          this.setData({
            stockInfo: res.data.data
          })
          this.checkCanSubmit()
        } else {
          wx.showToast({
            title: res.data.message || '搜索失败',
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

  // 检查是否可以提交
  checkCanSubmit() {
    const { formData, stockInfo } = this.data
    const canSubmit = formData.title && 
                     formData.stockCode && 
                     stockInfo.name &&
                     formData.endDate && 
                     formData.endTime &&
                     formData.settlementDate && 
                     formData.settlementTime

    this.setData({ canSubmit })
  },

  // 提交表单
  handleSubmit(e) {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const { formData, stockInfo, voteTypes, voteTypeIndex, pointsOptions, pointsIndex } = this.data
    
    // 构建提交数据
    const submitData = {
      title: formData.title,
      description: formData.description,
      stockCode: formData.stockCode.toUpperCase(),
      stockName: stockInfo.name,
      voteType: voteTypes[voteTypeIndex].value,
      endTime: `${formData.endDate} ${formData.endTime}:00`,
      settlementTime: `${formData.settlementDate} ${formData.settlementTime}:00`,
      pointsReward: pointsOptions[pointsIndex]
    }

    wx.showLoading({ title: '创建中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/vote/create`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
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
  }
})