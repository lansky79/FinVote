const express = require('express')
const jwt = require('jsonwebtoken')
const User = global.User || require('../models/User')
const Vote = global.Vote || require('../models/Vote')
const UserVote = global.UserVote || require('../models/UserVote')

const router = express.Router()

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret')
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

// 奖励合约存储
const rewardContracts = new Map()
const userContracts = new Map()

// 初始化示例合约
function initSampleContracts() {
  const sampleContracts = [
    {
      id: 'reward_contract_001',
      voteId: 'test_vote_123',
      voteTitle: '平安银行明日走势预测',
      rewardType: 'accuracy',
      rewardTypeText: '按准确率奖励',
      baseReward: 10,
      bonusMultiplier: 2,
      description: '预测正确获得20积分，参与获得10积分',
      status: 'deployed',
      statusText: '运行中',
      createdBy: 'user_001',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      deployedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      executedCount: 3,
      totalRewards: 180
    }
  ]

  sampleContracts.forEach(contract => {
    rewardContracts.set(contract.id, contract)
    
    if (!userContracts.has(contract.createdBy)) {
      userContracts.set(contract.createdBy, [])
    }
    userContracts.get(contract.createdBy).push(contract.id)
  })
}

// 初始化示例数据
initSampleContracts()

// 获取奖励合约列表
router.get('/list', authenticate, async (req, res) => {
  try {
    const { type = 'active' } = req.query
    const userId = req.user._id

    // 获取用户的合约
    const userContractIds = userContracts.get(userId) || []
    let contractList = userContractIds.map(id => rewardContracts.get(id)).filter(Boolean)

    if (type === 'history') {
      contractList = contractList.filter(c => c.status === 'completed')
    } else {
      contractList = contractList.filter(c => c.status !== 'completed')
    }

    // 格式化返回数据
    const formattedContracts = contractList.map(contract => ({
      id: contract.id,
      voteId: contract.voteId,
      voteTitle: contract.voteTitle,
      rewardType: contract.rewardType,
      rewardTypeText: contract.rewardTypeText,
      baseReward: contract.baseReward,
      bonusMultiplier: contract.bonusMultiplier,
      description: contract.description,
      status: contract.status,
      statusText: contract.statusText,
      executedCount: contract.executedCount || 0,
      totalRewards: contract.totalRewards || 0,
      createTimeText: formatTime(contract.createdAt)
    }))

    res.json({
      success: true,
      data: formattedContracts
    })

  } catch (error) {
    console.error('获取奖励合约列表错误:', error)
    res.json({
      success: false,
      message: '获取合约列表失败'
    })
  }
})

// 创建奖励合约
router.post('/create', authenticate, async (req, res) => {
  try {
    const { voteId, rewardType, baseReward, bonusMultiplier, description } = req.body
    const userId = req.user._id

    if (!voteId || !rewardType || !baseReward) {
      return res.json({
        success: false,
        message: '请填写完整信息'
      })
    }

    // 验证投票是否存在
    const vote = await Vote.findById(voteId)
    if (!vote) {
      return res.json({
        success: false,
        message: '投票不存在'
      })
    }

    if (vote.status !== 'active') {
      return res.json({
        success: false,
        message: '只能为进行中的投票创建合约'
      })
    }

    const contractId = 'reward_contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    
    const newContract = {
      id: contractId,
      voteId,
      voteTitle: vote.title,
      rewardType,
      rewardTypeText: rewardType === 'accuracy' ? '按准确率奖励' : '参与奖励',
      baseReward: parseInt(baseReward),
      bonusMultiplier: parseFloat(bonusMultiplier) || 1,
      description: description || '',
      status: 'draft',
      statusText: '草稿',
      createdBy: userId,
      createdAt: new Date(),
      executedCount: 0,
      totalRewards: 0
    }

    rewardContracts.set(contractId, newContract)

    // 添加到用户合约列表
    if (!userContracts.has(userId)) {
      userContracts.set(userId, [])
    }
    userContracts.get(userId).push(contractId)

    res.json({
      success: true,
      data: {
        contractId,
        message: '奖励合约创建成功'
      }
    })

  } catch (error) {
    console.error('创建奖励合约错误:', error)
    res.json({
      success: false,
      message: '创建合约失败'
    })
  }
})

// 部署奖励合约
router.post('/deploy', authenticate, async (req, res) => {
  try {
    const { contractId } = req.body
    const userId = req.user._id

    const contract = rewardContracts.get(contractId)
    if (!contract) {
      return res.json({
        success: false,
        message: '合约不存在'
      })
    }

    if (contract.createdBy !== userId) {
      return res.json({
        success: false,
        message: '只能部署自己的合约'
      })
    }

    if (contract.status !== 'draft') {
      return res.json({
        success: false,
        message: '合约已经部署过了'
      })
    }

    // 部署合约
    contract.status = 'deployed'
    contract.statusText = '运行中'
    contract.deployedAt = new Date()

    rewardContracts.set(contractId, contract)

    // 注册投票结束监听器（模拟）
    registerVoteListener(contract)

    res.json({
      success: true,
      data: {
        message: '合约部署成功，将在投票结束时自动执行'
      }
    })

  } catch (error) {
    console.error('部署奖励合约错误:', error)
    res.json({
      success: false,
      message: '部署合约失败'
    })
  }
})

// 手动执行合约（用于测试）
router.post('/execute', authenticate, async (req, res) => {
  try {
    const { contractId } = req.body

    const contract = rewardContracts.get(contractId)
    if (!contract) {
      return res.json({
        success: false,
        message: '合约不存在'
      })
    }

    if (contract.status !== 'deployed') {
      return res.json({
        success: false,
        message: '合约未部署'
      })
    }

    // 执行奖励分发
    const result = await executeRewardDistribution(contract)

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('执行奖励合约错误:', error)
    res.json({
      success: false,
      message: '执行合约失败'
    })
  }
})

// 注册投票监听器（模拟）
function registerVoteListener(contract) {
  console.log(`📜 奖励合约已部署: ${contract.voteTitle}`)
  console.log(`   - 基础奖励: ${contract.baseReward}积分`)
  console.log(`   - 奖励倍数: ${contract.bonusMultiplier}x`)
  console.log(`   - 将在投票结束时自动执行`)
}

// 执行奖励分发
async function executeRewardDistribution(contract) {
  try {
    // 获取投票信息
    const vote = await Vote.findById(contract.voteId)
    if (!vote) {
      throw new Error('投票不存在')
    }

    // 获取所有参与者
    const userVotes = await UserVote.find({ voteId: contract.voteId })
    
    let totalRewards = 0
    let rewardedUsers = 0

    for (const userVote of userVotes) {
      let reward = 0

      if (contract.rewardType === 'accuracy') {
        // 按准确率奖励
        if (userVote.isCorrect) {
          reward = contract.baseReward * contract.bonusMultiplier
        } else {
          reward = contract.baseReward // 参与奖励
        }
      } else {
        // 参与奖励
        reward = contract.baseReward
      }

      if (reward > 0) {
        // 更新用户积分
        await User.findByIdAndUpdate(userVote.userId, {
          $inc: { points: reward }
        })

        totalRewards += reward
        rewardedUsers++
      }
    }

    // 更新合约执行记录
    contract.executedCount = (contract.executedCount || 0) + 1
    contract.totalRewards = (contract.totalRewards || 0) + totalRewards
    rewardContracts.set(contract.id, contract)

    return {
      message: '奖励分发完成',
      details: `向${rewardedUsers}名用户分发了总计${totalRewards}积分`,
      totalRewards,
      rewardedUsers
    }

  } catch (error) {
    console.error('执行奖励分发错误:', error)
    throw error
  }
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

module.exports = router