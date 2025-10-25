// pages/blockchain-demo/blockchain-demo.js
const app = getApp()

Page({
  data: {
    // 网络状态
    networkConnected: false,
    clusterInfo: {
      clusterId: 'tbaas-demo-cluster',
      channelName: 'mychannel'
    },
    
    // 演示投票数据
    demoVote: {
      stockCode: '000001',
      predictionIndex: 0,
      basePrice: '12.50'
    },
    predictionOptions: ['看涨 (UP)', '看跌 (DOWN)'],
    
    // 演示积分数据
    demoReward: {
      typeIndex: 0,
      points: 10
    },
    rewardTypes: [
      { name: '预测正确奖励', value: 'correct_prediction' },
      { name: '参与奖励', value: 'participation' },
      { name: '每日签到', value: 'daily_checkin' },
      { name: '创建投票', value: 'create_vote' }
    ],
    
    // 用户积分
    userPoints: 0,
    
    // 交易状态
    submittingVote: false,
    submittingReward: false,
    currentTransaction: null,
    
    // 区块链历史
    chainHistory: [],
    
    // 弹窗状态
    showTxDetail: false,
    selectedTx: null
  },

  onLoad() {
    this.initDemo()
  },

  onShow() {
    this.loadUserPoints()
    this.loadChainHistory()
  },

  // 初始化演示
  initDemo() {
    // 模拟网络连接
    setTimeout(() => {
      this.setData({
        networkConnected: true
      })
      wx.showToast({
        title: '已连接到区块链网络',
        icon: 'success'
      })
    }, 1000)
    
    this.loadUserPoints()
    this.loadChainHistory()
  },

  // 加载用户积分
  loadUserPoints() {
    if (app.globalData.userInfo) {
      this.setData({
        userPoints: app.globalData.userInfo.points || 0
      })
    }
  },

  // 刷新网络状态
  refreshNetwork() {
    this.setData({
      networkConnected: false
    })
    
    wx.showLoading({ title: '连接中...' })
    
    setTimeout(() => {
      this.setData({
        networkConnected: true
      })
      wx.hideLoading()
      wx.showToast({
        title: '网络连接成功',
        icon: 'success'
      })
    }, 2000)
  },

  // 更新投票数据
  updateVoteData(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`demoVote.${field}`]: value
    })
  },

  // 更新预测方向
  updatePrediction(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      'demoVote.predictionIndex': index
    })
  },

  // 更新积分奖励数据
  updateRewardData(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`demoReward.${field}`]: value
    })
  },

  // 更新奖励类型
  updateRewardType(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      'demoReward.typeIndex': index
    })
  },

  // 提交投票到区块链
  async submitVoteToChain() {
    if (!this.data.networkConnected) {
      wx.showToast({
        title: '区块链网络未连接',
        icon: 'none'
      })
      return
    }

    const { demoVote, predictionOptions } = this.data
    
    if (!demoVote.stockCode || !demoVote.basePrice) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ submittingVote: true })

    try {
      // 构建投票数据
      const voteData = {
        voteId: `demo_vote_${Date.now()}`,
        userId: app.globalData.userInfo?.id || 'demo_user',
        stockCode: demoVote.stockCode,
        prediction: demoVote.predictionIndex === 0 ? 'up' : 'down',
        basePrice: parseFloat(demoVote.basePrice),
        timestamp: Date.now()
      }

      // 显示交易处理状态
      this.showTransactionProgress('投票数据上链', voteData)

      // 调用后端API提交到区块链
      const response = await this.callBlockchainAPI('/blockchain/vote-proof', voteData)

      if (response.success) {
        // 更新交易状态为成功
        this.updateTransactionStatus(response.txId, 'confirmed', response.dataHash)
        
        // 添加到历史记录
        this.addToChainHistory({
          txId: response.txId,
          type: 'vote',
          typeText: '投票存证',
          description: `${demoVote.stockCode} - ${predictionOptions[demoVote.predictionIndex]}`,
          status: 'confirmed',
          statusText: '已确认',
          dataHash: response.dataHash,
          submitTime: new Date().toLocaleString(),
          timeText: '刚刚'
        })

        wx.showToast({
          title: '投票已上链存证',
          icon: 'success'
        })
      } else {
        throw new Error(response.message || '上链失败')
      }

    } catch (error) {
      console.error('投票上链失败:', error)
      this.setData({ currentTransaction: null })
      wx.showToast({
        title: error.message || '上链失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submittingVote: false })
    }
  },

  // 提交积分奖励到区块链
  async submitRewardToChain() {
    if (!this.data.networkConnected) {
      wx.showToast({
        title: '区块链网络未连接',
        icon: 'none'
      })
      return
    }

    const { demoReward, rewardTypes, userPoints } = this.data
    
    if (!demoReward.points || demoReward.points <= 0) {
      wx.showToast({
        title: '请输入有效积分数量',
        icon: 'none'
      })
      return
    }

    this.setData({ submittingReward: true })

    try {
      // 构建积分数据
      const pointsData = {
        userId: app.globalData.userInfo?.id || 'demo_user',
        voteId: `demo_vote_${Date.now()}`,
        rewardType: rewardTypes[demoReward.typeIndex].value,
        pointsEarned: parseInt(demoReward.points),
        previousBalance: userPoints,
        newBalance: userPoints + parseInt(demoReward.points),
        timestamp: Date.now()
      }

      // 显示交易处理状态
      this.showTransactionProgress('积分变动上链', pointsData)

      // 调用后端API提交到区块链
      const response = await this.callBlockchainAPI('/blockchain/points-proof', pointsData)

      if (response.success) {
        // 更新交易状态为成功
        this.updateTransactionStatus(response.txId, 'confirmed', response.dataHash)
        
        // 更新本地积分
        const newPoints = userPoints + parseInt(demoReward.points)
        this.setData({ userPoints: newPoints })
        
        // 更新全局用户信息
        if (app.globalData.userInfo) {
          app.globalData.userInfo.points = newPoints
        }

        // 添加到历史记录
        this.addToChainHistory({
          txId: response.txId,
          type: 'reward',
          typeText: '积分存证',
          description: `${rewardTypes[demoReward.typeIndex].name} +${demoReward.points}积分`,
          status: 'confirmed',
          statusText: '已确认',
          dataHash: response.dataHash,
          submitTime: new Date().toLocaleString(),
          timeText: '刚刚'
        })

        wx.showToast({
          title: '积分变动已上链存证',
          icon: 'success'
        })
      } else {
        throw new Error(response.message || '上链失败')
      }

    } catch (error) {
      console.error('积分上链失败:', error)
      this.setData({ currentTransaction: null })
      wx.showToast({
        title: error.message || '上链失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submittingReward: false })
    }
  },

  // 显示交易处理进度
  showTransactionProgress(type, data) {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const dataHash = this.generateMockHash(data)
    
    this.setData({
      currentTransaction: {
        type: type,
        txId: txId,
        dataHash: dataHash,
        submitTime: new Date().toLocaleString(),
        progress: 0,
        estimatedTime: '3-8秒'
      }
    })

    // 模拟进度更新
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20 + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(progressInterval)
      }
      
      this.setData({
        'currentTransaction.progress': Math.min(progress, 100)
      })
    }, 500)
  },

  // 更新交易状态
  updateTransactionStatus(txId, status, dataHash) {
    setTimeout(() => {
      this.setData({
        currentTransaction: null
      })
    }, 2000)
  },

  // 生成模拟哈希
  generateMockHash(data) {
    const str = JSON.stringify(data) + Date.now()
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0').substr(0, 64)
  },

  // 调用区块链API (模拟)
  async callBlockchainAPI(endpoint, data) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    // 模拟成功响应
    return {
      success: true,
      txId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      dataHash: this.generateMockHash(data),
      message: '交易已提交到区块链'
    }
  },

  // 添加到区块链历史
  addToChainHistory(record) {
    const history = this.data.chainHistory
    history.unshift({
      ...record,
      txIdShort: record.txId.substr(0, 10) + '...' + record.txId.substr(-6)
    })
    
    // 只保留最近20条记录
    if (history.length > 20) {
      history.splice(20)
    }
    
    this.setData({
      chainHistory: history
    })
  },

  // 加载区块链历史
  loadChainHistory() {
    // 这里可以从本地存储或服务器加载历史记录
    // 暂时使用模拟数据
    const mockHistory = [
      {
        txId: 'tx_1640995200_abc123def',
        txIdShort: 'tx_1640995...3def',
        type: 'vote',
        typeText: '投票存证',
        description: '000001 - 看涨 (UP)',
        status: 'confirmed',
        statusText: '已确认',
        dataHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
        submitTime: '2024-01-01 14:30:25',
        timeText: '2小时前'
      }
    ]
    
    this.setData({
      chainHistory: mockHistory
    })
  },

  // 显示交易详情
  showTransactionDetail(e) {
    const tx = e.currentTarget.dataset.tx
    this.setData({
      selectedTx: {
        ...tx,
        dataPreview: JSON.stringify({
          type: tx.type,
          description: tx.description,
          timestamp: tx.submitTime
        }, null, 2)
      },
      showTxDetail: true
    })
  },

  // 隐藏交易详情
  hideTxDetail() {
    this.setData({
      showTxDetail: false,
      selectedTx: null
    })
  },

  // 阻止弹窗关闭
  preventClose() {
    // 空函数，阻止事件冒泡
  },

  // 复制交易ID
  copyTxId() {
    if (this.data.selectedTx) {
      wx.setClipboardData({
        data: this.data.selectedTx.txId,
        success: () => {
          wx.showToast({
            title: '交易ID已复制',
            icon: 'success'
          })
        }
      })
    }
  },

  // 验证交易数据
  verifyTxData() {
    wx.showLoading({ title: '验证中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '数据验证结果',
        content: '✅ 数据完整性验证通过\n✅ 区块链存证有效\n✅ 数据未被篡改',
        showCancel: false,
        confirmText: '确定'
      })
    }, 2000)
  },

  // 打开区块链浏览器
  openExplorer() {
    wx.showModal({
      title: '区块链浏览器',
      content: '在真实项目中，这里会跳转到腾讯云TBaaS的区块链浏览器，可以查看完整的区块链数据。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 验证数据完整性
  verifyData() {
    wx.showLoading({ title: '验证中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '数据完整性验证',
        content: '所有区块链存证数据验证通过：\n\n✅ 投票记录完整\n✅ 积分变动记录完整\n✅ 数据哈希匹配\n✅ 时间戳有效',
        showCancel: false,
        confirmText: '确定'
      })
    }, 3000)
  }
})