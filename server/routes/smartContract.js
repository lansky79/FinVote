const express = require('express')
const jwt = require('jsonwebtoken')
const User = global.User || require('../models/User')

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

// 合约类型定义
const contractTypes = {
  'vote_reward': { name: '投票奖励合约', desc: '自动分发投票奖励' },
  'prediction_pool': { name: '预测资金池', desc: '多人预测资金池' },
  'auto_trade': { name: '自动交易合约', desc: '基于条件自动执行' },
  'dividend_split': { name: '收益分成合约', desc: '按比例分配收益' }
}

// 合约状态
const contractStatus = {
  'draft': '草稿',
  'deployed': '已部署',
  'executing': '执行中',
  'completed': '已完成',
  'failed': '执行失败'
}

// 模拟合约存储
const contracts = new Map()
const userContracts = new Map()

// 初始化一些示例合约
function initSampleContracts() {
  const sampleContracts = [
    {
      id: 'contract_001',
      name: '投票奖励自动分发',
      type: 'vote_reward',
      description: '当投票结束时，自动向预测正确的用户分发奖励积分',
      code: `
contract VoteReward {
  function distribute(voteId, winners) {
    for (winner in winners) {
      transferPoints(winner.userId, winner.reward);
    }
  }
}`,
      status: 'deployed',
      createdBy: 'user_001',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      deployedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      gasUsed: 21000,
      executions: 5
    },
    {
      id: 'contract_002',
      name: '预测资金池',
      type: 'prediction_pool',
      description: '多人参与的预测资金池，胜者瓜分奖池',
      code: `
contract PredictionPool {
  mapping(address => uint) public stakes;
  
  function joinPool(prediction, amount) {
    stakes[msg.sender] = amount;
  }
  
  function distribute(winners) {
    uint totalPool = getTotalPool();
    for (winner in winners) {
      transfer(winner, totalPool / winners.length);
    }
  }
}`,
      status: 'deployed',
      createdBy: 'user_002',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      deployedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      gasUsed: 45000,
      executions: 12
    }
  ]

  sampleContracts.forEach(contract => {
    contracts.set(contract.id, contract)
    
    // 添加到用户合约列表
    if (!userContracts.has(contract.createdBy)) {
      userContracts.set(contract.createdBy, [])
    }
    userContracts.get(contract.createdBy).push(contract.id)
  })
}

// 初始化示例数据
initSampleContracts()

// 获取合约列表
router.get('/list', authenticate, async (req, res) => {
  try {
    const { type = 'my' } = req.query
    const userId = req.user._id

    let contractList = []

    if (type === 'my') {
      // 获取用户的合约
      const userContractIds = userContracts.get(userId) || []
      contractList = userContractIds.map(id => contracts.get(id)).filter(Boolean)
    } else {
      // 获取市场上的合约（所有已部署的合约）
      contractList = Array.from(contracts.values()).filter(c => c.status === 'deployed')
    }

    // 格式化返回数据
    const formattedContracts = contractList.map(contract => ({
      id: contract.id,
      name: contract.name,
      type: contract.type,
      typeName: contractTypes[contract.type]?.name || '未知类型',
      description: contract.description,
      status: contract.status,
      statusText: contractStatus[contract.status] || '未知状态',
      gasUsed: contract.gasUsed,
      executions: contract.executions || 0,
      createTimeText: formatTime(contract.createdAt),
      deployTimeText: contract.deployedAt ? formatTime(contract.deployedAt) : null
    }))

    res.json({
      success: true,
      data: formattedContracts
    })

  } catch (error) {
    console.error('获取合约列表错误:', error)
    res.json({
      success: false,
      message: '获取合约列表失败'
    })
  }
})

// 获取合约详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contractId = req.params.id
    const contract = contracts.get(contractId)

    if (!contract) {
      return res.json({
        success: false,
        message: '合约不存在'
      })
    }

    // 获取创建者信息
    const creator = await User.findById(contract.createdBy)

    res.json({
      success: true,
      data: {
        id: contract.id,
        name: contract.name,
        type: contract.type,
        typeName: contractTypes[contract.type]?.name || '未知类型',
        description: contract.description,
        code: contract.code,
        status: contract.status,
        statusText: contractStatus[contract.status] || '未知状态',
        gasUsed: contract.gasUsed,
        executions: contract.executions || 0,
        createdAt: contract.createdAt,
        deployedAt: contract.deployedAt,
        creator: {
          id: creator?._id,
          nickName: creator?.nickName || '匿名用户'
        }
      }
    })

  } catch (error) {
    console.error('获取合约详情错误:', error)
    res.json({
      success: false,
      message: '获取合约详情失败'
    })
  }
})

// 创建合约
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, type, description, code } = req.body
    const userId = req.user._id

    if (!name || !type || !description) {
      return res.json({
        success: false,
        message: '请填写完整的合约信息'
      })
    }

    if (!contractTypes[type]) {
      return res.json({
        success: false,
        message: '不支持的合约类型'
      })
    }

    const contractId = 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    
    const newContract = {
      id: contractId,
      name,
      type,
      description,
      code: code || generateDefaultCode(type),
      status: 'draft',
      createdBy: userId,
      createdAt: new Date(),
      gasUsed: 0,
      executions: 0
    }

    contracts.set(contractId, newContract)

    // 添加到用户合约列表
    if (!userContracts.has(userId)) {
      userContracts.set(userId, [])
    }
    userContracts.get(userId).push(contractId)

    res.json({
      success: true,
      data: {
        contractId,
        message: '合约创建成功'
      }
    })

  } catch (error) {
    console.error('创建合约错误:', error)
    res.json({
      success: false,
      message: '创建合约失败'
    })
  }
})

// 部署合约
router.post('/deploy', authenticate, async (req, res) => {
  try {
    const { contractId } = req.body
    const userId = req.user._id

    const contract = contracts.get(contractId)
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

    // 模拟部署过程
    const gasUsed = Math.floor(Math.random() * 50000) + 20000
    
    contract.status = 'deployed'
    contract.deployedAt = new Date()
    contract.gasUsed = gasUsed

    contracts.set(contractId, contract)

    res.json({
      success: true,
      data: {
        gasUsed,
        message: '合约部署成功'
      }
    })

  } catch (error) {
    console.error('部署合约错误:', error)
    res.json({
      success: false,
      message: '部署合约失败'
    })
  }
})

// 执行合约
router.post('/execute', authenticate, async (req, res) => {
  try {
    const { contractId, params } = req.body

    const contract = contracts.get(contractId)
    if (!contract) {
      return res.json({
        success: false,
        message: '合约不存在'
      })
    }

    if (contract.status !== 'deployed') {
      return res.json({
        success: false,
        message: '合约未部署或不可执行'
      })
    }

    // 模拟合约执行
    const executionResult = await simulateContractExecution(contract, params)
    
    // 更新执行次数
    contract.executions = (contract.executions || 0) + 1
    contracts.set(contractId, contract)

    res.json({
      success: true,
      data: executionResult
    })

  } catch (error) {
    console.error('执行合约错误:', error)
    res.json({
      success: false,
      message: '执行合约失败'
    })
  }
})

// 生成默认合约代码
function generateDefaultCode(type) {
  const templates = {
    'vote_reward': `
contract VoteReward {
  function distribute(voteId, winners) {
    for (winner in winners) {
      transferPoints(winner.userId, winner.reward);
    }
  }
}`,
    'prediction_pool': `
contract PredictionPool {
  mapping(address => uint) public stakes;
  
  function joinPool(prediction, amount) {
    stakes[msg.sender] = amount;
  }
}`,
    'auto_trade': `
contract AutoTrade {
  function checkCondition(price, targetPrice) {
    if (price >= targetPrice) {
      executeTrade();
    }
  }
}`,
    'dividend_split': `
contract DividendSplit {
  function distribute(totalAmount, shareholders) {
    for (holder in shareholders) {
      transfer(holder.address, totalAmount * holder.ratio);
    }
  }
}`
  }

  return templates[type] || '// 请编写您的智能合约代码'
}

// 模拟合约执行
async function simulateContractExecution(contract, params) {
  // 模拟执行时间
  await new Promise(resolve => setTimeout(resolve, 1000))

  const results = {
    'vote_reward': {
      message: '奖励分发完成',
      details: '向3名用户分发了总计150积分',
      gasUsed: 15000
    },
    'prediction_pool': {
      message: '资金池操作完成',
      details: '处理了5笔交易，总金额500积分',
      gasUsed: 25000
    },
    'auto_trade': {
      message: '自动交易执行完成',
      details: '触发条件满足，执行了1笔交易',
      gasUsed: 30000
    },
    'dividend_split': {
      message: '收益分配完成',
      details: '按比例分配给4名股东',
      gasUsed: 20000
    }
  }

  return results[contract.type] || {
    message: '合约执行完成',
    details: '执行成功',
    gasUsed: 10000
  }
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

module.exports = router