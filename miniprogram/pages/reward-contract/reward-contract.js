// pages/reward-contract/reward-contract.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    contracts: [],
    loading: true,
    activeTab: 'active', // active: 活跃合约, history: 历史记录
    showCreateModal: false,
    availableVotes: [], // 可绑定的投票
    createForm: {
      voteId: '',
      rewardType: 'accuracy', // accuracy: 按准确率, participation: 参与奖励
      baseReward: 10,
      bonusMultiplier: 2,
      description: ''
    },
    selectedVoteTitle: '',
    correctReward: 20
  },

  onLoad() {
    console.log('奖励合约页面加载')
    this.loadUserInfo()
    this.loadContracts()
    this.loadAvailableVotes()
  },

  onShow() {
    this.loadContracts()
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
    if (!app.globalData.token) {
      console.log('用户未登录，显示空列表')
      this.setData({ 
        contracts: [],
        loading: false 
      })
      return
    }

    wx.request({
      url: `${app.globalData.serverUrl}/reward-contract/list`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: {
        type: this.data.activeTab
      },
      success: (res) => {
        console.log('合约列表响应:', res.data)
        if (res.data.success) {
          this.setData({
            contracts: res.data.data || [],
            loading: false
          })
        } else {
          this.setData({ 
            contracts: [],
            loading: false 
          })
        }
      },
      fail: (error) => {
        console.log('获取合约列表失败:', error)
        this.setData({ 
          contracts: [],
          loading: false 
        })
      }
    })
  },

  // 加载可用投票
  loadAvailableVotes() {
    wx.request({
      url: `${app.globalData.serverUrl}/vote/list`,
      header: app.globalData.token ? {
        'Authorization': `Bearer ${app.globalData.token}`
      } : {},
      data: {
        status: 'active',
        limit: 50
      },
      success: (res) => {
        console.log('可用投票响应:', res.data)
        if (res.data.success) {
          this.setData({
            availableVotes: res.data.data.votes || []
          })
        } else {
          // 如果获取失败，设置一些模拟数据
          this.setData({
            availableVotes: [
              { id: 'test_vote_123', title: '平安银行明日走势预测' },
              { id: 'test_vote_124', title: '上证指数本周表现' }
            ]
          })
        }
      },
      fail: (error) => {
        console.log('获取投票列表失败:', error)
        // 设置模拟数据
        this.setData({
          availableVotes: [
            { id: 'test_vote_123', title: '平安银行明日走势预测' },
            { id: 'test_vote_124', title: '上证指数本周表现' }
          ]
        })
      }
    })
  },

  // 显示创建弹窗
  showCreateContract() {
    this.setData({
      showCreateModal: true
    })
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({
      showCreateModal: false,
      createForm: {
        voteId: '',
        rewardType: 'accuracy',
        baseReward: 10,
        bonusMultiplier: 2,
        description: ''
      },
      selectedVoteTitle: ''
    })
  },

  // 表单输入
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`createForm.${field}`]: value
    })
    
    // 更新奖励预览
    if (field === 'baseReward' || field === 'bonusMultiplier') {
      this.updateRewardPreview()
    }
  },

  // 更新奖励预览
  updateRewardPreview() {
    const baseReward = parseInt(this.data.createForm.baseReward) || 10
    const bonusMultiplier = parseFloat(this.data.createForm.bonusMultiplier) || 2
    this.setData({
      correctReward: baseReward * bonusMultiplier
    })
  },

  // 选择投票
  onVoteChange(e) {
    const index = e.detail.value
    const selectedVote = this.data.availableVotes[index]
    if (selectedVote) {
      this.setData({
        'createForm.voteId': selectedVote.id,
        selectedVoteTitle: selectedVote.title
      })
    }
  },

  // 选择奖励类型
  onRewardTypeChange(e) {
    const types = ['accuracy', 'participation']
    const rewardType = types[e.detail.value]
    this.setData({
      'createForm.rewardType': rewardType
    })
    this.updateRewardPreview()
  },

  // 创建合约
  createContract() {
    const form = this.data.createForm
    
    if (!form.voteId || !form.baseReward) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '创建中...' })

    wx.request({
      url: `${app.globalData.serverUrl}/reward-contract/create`,
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
            title: '合约创建成功',
            icon: 'success'
          })
          this.hideCreateModal()
          this.loadContracts()
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

  // 部署合约
  deployContract(e) {
    const contractId = e.currentTarget.dataset.id
    wx.showModal({
      title: '部署合约',
      content: '部署后合约将自动执行，确定要部署吗？',
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
      url: `${app.globalData.serverUrl}/reward-contract/deploy`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: { contractId },
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

  // 查看合约详情
  viewContract(e) {
    const contractId = e.currentTarget.dataset.id
    const contract = this.data.contracts.find(c => c.id === contractId)
    
    if (contract) {
      wx.showModal({
        title: '合约详情',
        content: `合约名称: ${contract.voteTitle}\n奖励类型: ${contract.rewardTypeText}\n基础奖励: ${contract.baseReward}积分\n奖励倍数: ${contract.bonusMultiplier}x\n执行次数: ${contract.executedCount}次\n累计奖励: ${contract.totalRewards}积分`,
        showCancel: false,
        confirmText: '确定'
      })
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})