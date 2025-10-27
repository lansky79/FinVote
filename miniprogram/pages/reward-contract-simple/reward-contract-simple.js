// pages/reward-contract-simple/reward-contract-simple.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    message: '智能合约已就绪',
    contracts: [
      {
        id: 1,
        name: '投票奖励自动分发',
        status: '运行中',
        description: '当投票结束时，自动向预测正确的用户分发奖励积分',
        executed: 5,
        totalRewards: 180
      },
      {
        id: 2,
        name: '参与奖励合约',
        status: '待部署',
        description: '为所有参与投票的用户提供基础参与奖励',
        executed: 0,
        totalRewards: 0
      }
    ],
    showCreateModal: false,
    newContract: {
      name: '',
      baseReward: 10,
      bonusReward: 20
    }
  },

  onLoad() {
    console.log('简化版奖励合约页面加载')
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  // 显示创建合约弹窗
  showCreateContract() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    this.setData({
      showCreateModal: true
    })
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({
      showCreateModal: false,
      newContract: {
        name: '',
        baseReward: 10,
        bonusReward: 20
      }
    })
  },

  // 表单输入
  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`newContract.${field}`]: value
    })
  },

  // 创建合约
  createContract() {
    const contract = this.data.newContract
    if (!contract.name) {
      wx.showToast({
        title: '请输入合约名称',
        icon: 'none'
      })
      return
    }

    const newContract = {
      id: Date.now(),
      name: contract.name,
      status: '已部署',
      description: `基础奖励${contract.baseReward}积分，预测正确额外获得${contract.bonusReward}积分`,
      executed: 0,
      totalRewards: 0
    }

    const contracts = [...this.data.contracts, newContract]
    this.setData({
      contracts: contracts
    })

    wx.showToast({
      title: '合约创建成功',
      icon: 'success'
    })

    this.hideCreateModal()
  },

  // 执行合约
  executeContract(e) {
    const contractId = e.currentTarget.dataset.id
    const contracts = this.data.contracts.map(contract => {
      if (contract.id == contractId) {
        return {
          ...contract,
          executed: contract.executed + 1,
          totalRewards: contract.totalRewards + 50,
          status: '运行中'
        }
      }
      return contract
    })

    this.setData({
      contracts: contracts
    })

    wx.showToast({
      title: '合约执行成功，已分发50积分',
      icon: 'success'
    })
  },

  // 查看合约详情
  viewContract(e) {
    const contractId = e.currentTarget.dataset.id
    const contract = this.data.contracts.find(c => c.id == contractId)
    
    wx.showModal({
      title: '合约详情',
      content: `合约名称: ${contract.name}\n状态: ${contract.status}\n执行次数: ${contract.executed}次\n累计奖励: ${contract.totalRewards}积分\n\n描述: ${contract.description}`,
      showCancel: false,
      confirmText: '确定'
    })
  },

  goBack() {
    wx.navigateBack()
  }
})