const express = require('express')
const jwt = require('jsonwebtoken')
const User = global.User || require('../models/User')
const BlockchainService = require('../services/blockchainService')

const router = express.Router()
const blockchainService = new BlockchainService()

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.json({
        success: false,
        message: '未授权'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    res.json({
      success: false,
      message: '认证失败'
    })
  }
}

// 获取用户钱包信息
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString()
    
    // 获取区块链地址
    const address = blockchainService.getUserAddress(userId)
    
    // 模拟代币余额 (实际项目中应该从区块链查询)
    const balance = req.user.points || 0
    
    // 获取网络状态
    const networkStatus = await blockchainService.getNetworkStatus()
    
    res.json({
      success: true,
      data: {
        address: address,
        balance: balance,
        symbol: 'SVT',
        name: 'Stock Vote Token',
        decimals: 0,
        networkStatus: networkStatus,
        walletInfo: {
          totalValue: balance * 0.1, // 假设1 SVT = 0.1 USD
          currency: 'USD'
        }
      }
    })
  } catch (error) {
    console.error('获取钱包信息错误:', error)
    res.json({
      success: false,
      message: '获取钱包信息失败'
    })
  }
})

// 获取交易历史
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const { page = 1, limit = 20 } = req.query
    
    // 生成一些模拟交易数据 (首次访问时)
    if (page == 1) {
      blockchainService.generateMockTransactions(userId, 15)
    }
    
    // 获取用户交易历史
    const transactions = await blockchainService.getUserTransactions(userId, parseInt(limit))
    
    // 格式化交易数据
    const formattedTxs = transactions.map(tx => ({
      hash: tx.hash,
      type: tx.type,
      typeText: getTransactionTypeText(tx.type),
      amount: tx.amount,
      amountText: formatAmount(tx.amount, tx.type),
      status: tx.status,
      statusText: getStatusText(tx.status),
      timestamp: tx.timestamp,
      timeText: formatTimeAgo(tx.timestamp),
      blockNumber: tx.blockNumber,
      confirmations: tx.confirmations,
      reason: tx.reason,
      gasUsed: tx.gasUsed,
      from: tx.from,
      to: tx.to,
      isIncoming: tx.to === blockchainService.getUserAddress(userId)
    }))
    
    res.json({
      success: true,
      data: {
        transactions: formattedTxs,
        pagination: {
          current: parseInt(page),
          hasMore: formattedTxs.length >= parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('获取交易历史错误:', error)
    res.json({
      success: false,
      message: '获取交易历史失败'
    })
  }
})

// 投票数据上链存证
router.post('/vote-proof', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const voteData = req.body
    
    // 验证投票数据
    if (!voteData.voteId || !voteData.stockCode || !voteData.prediction) {
      return res.json({
        success: false,
        message: '投票数据不完整'
      })
    }
    
    // 调用区块链服务存储投票证明
    const result = await blockchainService.storeVoteProof({
      ...voteData,
      userId: userId
    })
    
    if (result.success) {
      res.json({
        success: true,
        txId: result.txId,
        dataHash: result.dataHash,
        message: result.message
      })
    } else {
      res.json({
        success: false,
        message: result.message || '投票存证失败'
      })
    }
  } catch (error) {
    console.error('投票存证错误:', error)
    res.json({
      success: false,
      message: '投票存证失败'
    })
  }
})

// 积分变动上链存证
router.post('/points-proof', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const pointsData = req.body
    
    // 验证积分数据
    if (!pointsData.pointsEarned || !pointsData.rewardType) {
      return res.json({
        success: false,
        message: '积分数据不完整'
      })
    }
    
    // 调用区块链服务存储积分证明
    const result = await blockchainService.storePointsProof({
      ...pointsData,
      userId: userId
    })
    
    if (result.success) {
      res.json({
        success: true,
        txId: result.txId,
        dataHash: result.dataHash,
        message: result.message
      })
    } else {
      res.json({
        success: false,
        message: result.message || '积分存证失败'
      })
    }
    
  } catch (error) {
    console.error('积分存证错误:', error)
    res.json({
      success: false,
      message: '积分存证失败'
    })
  }
})

// 模拟转账
router.post('/transfer', authenticate, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString()
    const { toUserId, amount, memo = '' } = req.body
    
    if (!toUserId || !amount || amount <= 0) {
      return res.json({
        success: false,
        message: '参数错误'
      })
    }
    
    // 检查余额
    if (req.user.points < amount) {
      return res.json({
        success: false,
        message: '余额不足'
      })
    }
    
    // 调用区块链服务转账
    const result = await blockchainService.transferToken(fromUserId, toUserId, amount, memo)
    
    if (result.success) {
      // 更新数据库余额
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { points: -amount }
      })
      
      // 如果接收方存在，增加其余额
      await User.findByIdAndUpdate(toUserId, {
        $inc: { points: amount }
      })
      
      res.json({
        success: true,
        data: {
          txHash: result.txHash,
          amount: amount,
          memo: memo,
          message: result.message,
          estimatedConfirmTime: result.estimatedConfirmTime
        }
      })
    } else {
      res.json({
        success: false,
        message: '转账失败'
      })
    }
  } catch (error) {
    console.error('转账错误:', error)
    res.json({
      success: false,
      message: '转账失败'
    })
  }
})

// 查询交易状态
router.get('/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params
    
    const transaction = await blockchainService.getTransactionStatus(hash)
    
    if (transaction) {
      res.json({
        success: true,
        data: {
          hash: transaction.hash,
          status: transaction.status,
          statusText: getStatusText(transaction.status),
          blockNumber: transaction.blockNumber,
          blockHash: transaction.blockHash,
          confirmations: transaction.confirmations || 0,
          timestamp: transaction.timestamp,
          gasUsed: transaction.gasUsed,
          type: transaction.type,
          amount: transaction.amount
        }
      })
    } else {
      res.json({
        success: false,
        message: '交易不存在'
      })
    }
  } catch (error) {
    console.error('查询交易状态错误:', error)
    res.json({
      success: false,
      message: '查询交易状态失败'
    })
  }
})

// 获取区块链网络状态
router.get('/network', async (req, res) => {
  try {
    const networkStatus = await blockchainService.getNetworkStatus()
    
    res.json({
      success: true,
      data: {
        ...networkStatus,
        statusText: networkStatus.isConnected ? '已连接' : '连接中',
        networkName: 'TBaaS 主网',
        chainId: 1001,
        explorer: 'https://explorer.tbaas.tencent.com'
      }
    })
  } catch (error) {
    console.error('获取网络状态错误:', error)
    res.json({
      success: false,
      message: '获取网络状态失败'
    })
  }
})

// 模拟智能合约调用
router.post('/contract/call', authenticate, async (req, res) => {
  try {
    const { contract, method, args = [] } = req.body
    
    const result = await blockchainService.callContract(contract, method, args)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('智能合约调用错误:', error)
    res.json({
      success: false,
      message: '智能合约调用失败'
    })
  }
})

// 辅助函数
function getTransactionTypeText(type) {
  const typeMap = {
    'MINT': '代币铸造',
    'TRANSFER': '转账',
    'VOTE_SUBMIT': '投票上链',
    'CONTRACT_CALL': '合约调用'
  }
  return typeMap[type] || type
}

function getStatusText(status) {
  const statusMap = {
    'pending': '待确认',
    'confirmed': '已确认',
    'failed': '失败'
  }
  return statusMap[status] || status
}

function formatAmount(amount, type) {
  if (type === 'VOTE_SUBMIT' || amount === 0) {
    return '-'
  }
  return `${amount > 0 ? '+' : ''}${amount} SVT`
}

function formatTimeAgo(timestamp) {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now.getTime() - time.getTime()
  
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
}

module.exports = router