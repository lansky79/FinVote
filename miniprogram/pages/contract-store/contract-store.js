// pages/contract-store/contract-store.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    userContracts: [], // 用户已购买的合约
    categories: [
      {
        id: 'reward',
        name: '奖励类合约',
        icon: '🎁',
        contracts: [
          {
            id: 'basic_reward',
            name: '基础奖励合约',
            price: 0,
            originalPrice: 0,
            description: '固定积分奖励分发，新手必备',
            features: ['固定奖励', '参与奖励', '简单配置'],
            isFree: true,
            isPurchased: true,
            category: 'reward'
          },
          {
            id: 'smart_reward',
            name: '智能奖励合约',
            price: 99,
            originalPrice: 129,
            description: '按准确率动态奖励，激励用户提升预测能力',
            features: ['准确率计算', '动态倍数', '连胜奖励', '个性化规则'],
            popular: true,
            isPurchased: false,
            category: 'reward'
          }
        ]
      },
      {
        id: 'pool',
        name: '资金池合约',
        icon: '💰',
        contracts: [
          {
            id: 'prediction_pool',
            name: '预测资金池合约',
            price: 199,
            originalPrice: 249,
            description: '多人资金池预测，胜者瓜分奖池',
            features: ['资金池管理', '自动分配', '风险控制', '透明结算'],
            isPurchased: false,
            category: 'pool'
          }
        ]
      },
      {
        id: 'advanced',
        name: '高级合约',
        icon: '⚡',
        contracts: [
          {
            id: 'time_lock',
            name: '时间锁定合约',
            price: 149,
            originalPrice: 179,
            description: '定时执行奖励，适合长期激励',
            features: ['延迟发放', '分期释放', '时间触发', '复合计算'],
            isPurchased: false,
            category: 'advanced'
          },
          {
            id: 'social_reward',
            name: '社交奖励合约',
            price: 179,
            originalPrice: 199,
            description: '基于社交关系的奖励机制',
            features: ['推荐奖励', '团队奖励', '社群激励', '影响力计算'],
            isPurchased: false,
            category: 'advanced'
          }
        ]
      }
    ],
    activeCategory: 'reward',
    showPurchaseModal: false,
    selectedContract: null
  },

  onLoad() {
    this.loadUserInfo()
    this.loadUserContracts()
  },

  // 加载用户信息
  loadUserInfo() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  // 加载用户已购买的合约
  loadUserContracts() {
    // 模拟用户已购买的合约
    const userContracts = ['basic_reward'] // 基础合约免费
    
    // 更新合约购买状态
    const categories = this.data.categories.map(category => ({
      ...category,
      contracts: category.contracts.map(contract => ({
        ...contract,
        isPurchased: userContracts.includes(contract.id)
      }))
    }))

    this.setData({
      categories,
      userContracts
    })
  },

  // 切换分类
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      activeCategory: categoryId
    })
  },

  // 查看合约详情
  viewContract(e) {
    const contractId = e.currentTarget.dataset.id
    const contract = this.findContractById(contractId)
    
    if (contract.isPurchased) {
      // 已购买，跳转到合约管理
      wx.navigateTo({
        url: `/pages/contract-manage/contract-manage?type=${contractId}`
      })
    } else {
      // 未购买，显示购买弹窗
      this.setData({
        selectedContract: contract,
        showPurchaseModal: true
      })
    }
  },

  // 购买合约
  purchaseContract() {
    const contract = this.data.selectedContract
    
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (contract.price === 0) {
      // 免费合约直接激活
      this.activateContract(contract)
    } else {
      // 付费合约，调用支付
      this.showPayment(contract)
    }
  },

  // 显示支付界面
  showPayment(contract) {
    wx.showModal({
      title: '确认购买',
      content: `购买 ${contract.name}\n价格: ¥${contract.price}\n\n购买后可永久使用该合约类型`,
      confirmText: '立即支付',
      success: (res) => {
        if (res.confirm) {
          // 模拟支付成功
          this.simulatePayment(contract)
        }
      }
    })
  },

  // 模拟支付流程
  simulatePayment(contract) {
    wx.showLoading({ title: '支付中...' })
    
    // 模拟支付延迟
    setTimeout(() => {
      wx.hideLoading()
      
      // 模拟支付成功
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      })
      
      // 激活合约
      this.activateContract(contract)
    }, 2000)
  },

  // 激活合约
  activateContract(contract) {
    // 更新用户已购买合约列表
    const userContracts = [...this.data.userContracts, contract.id]
    
    // 更新界面状态
    const categories = this.data.categories.map(category => ({
      ...category,
      contracts: category.contracts.map(c => ({
        ...c,
        isPurchased: c.id === contract.id ? true : c.isPurchased
      }))
    }))

    this.setData({
      userContracts,
      categories,
      showPurchaseModal: false,
      selectedContract: null
    })

    wx.showToast({
      title: '合约已激活',
      icon: 'success'
    })
  },

  // 关闭购买弹窗
  closePurchaseModal() {
    this.setData({
      showPurchaseModal: false,
      selectedContract: null
    })
  },

  // 查看套餐优惠
  viewPackages() {
    wx.navigateTo({
      url: '/pages/contract-packages/contract-packages'
    })
  },

  // 根据ID查找合约
  findContractById(contractId) {
    for (let category of this.data.categories) {
      for (let contract of category.contracts) {
        if (contract.id === contractId) {
          return contract
        }
      }
    }
    return null
  }
})