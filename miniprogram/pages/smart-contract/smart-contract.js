// pages/smart-contract/smart-contract.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    contracts: [],
    loading: true,
    activeTab: 'my', // my: 我的合约, market: 合约市场
    contractTypes: [
      { id: 'vote_reward', name: '投票奖励合约', desc: '自动分发投票奖励' },
      { id: 'prediction_pool', name: '预测资金池', desc: '多人预测资金池' },
      { id: 'auto_trade', name: '自动交易合约', desc: '基于条件自动执行' },
      { id: 'dividend_split', name: '收益分成合约', desc: '按比例分配收益' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.loadContracts()
  },

  onShow() {
    this.loadContracts()
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
    this.loadContracts()
  },

  // 加载合约列表
  loadContracts() {
    wx.request({
      url: `${app.globalData.serverUrl}/smart-contract/list`,
      header: app.globalData.token ? {
        'Authorization': `Bearer ${app.globalData.token}`
      } : {},
      data: {
        type: this.data.activeTab
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            contracts: res.data.data,
            loading: false
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 创建合约
  createContract() {
    wx.navigateTo({
      url: '/pages/contract-create/contract-create'
    })
  },

  // 查看合约详情
  viewContract(e) {
    const contractId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contract-detail/contract-detail?id=${contractId}`
    })
  },

  // 部署合约
  deployContract(e) {
    const contractId = e.currentTarget.dataset.id
    wx.showModal({
      title: '部署合约',
      content: '确定要部署这个智能合约吗？部署后将消耗一定的gas费用。',
      success: (res) => {
        if (res.confirm) {
          this.performDeploy(contractId)
        }
      }
    })
  },

  // 执行部署
  performDeploy(contractId) {
    wx.showLoading({ title: '部署中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/smart-contract/deploy`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        contractId: contractId
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '部署成功',
            icon: 'success'
          })
          this.loadContracts()
        } else {
          wx.showToast({
            title: res.data.message || '部署失败',
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

  // 执行合约
  executeContract(e) {
    const contractId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contract-execute/contract-execute?id=${contractId}`
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})