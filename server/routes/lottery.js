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

// 奖品配置
const prizes = [
  { id: 1, name: '10积分', points: 10, probability: 30 },
  { id: 2, name: '20积分', points: 20, probability: 25 },
  { id: 3, name: '50积分', points: 50, probability: 20 },
  { id: 4, name: '100积分', points: 100, probability: 15 },
  { id: 5, name: '200积分', points: 200, probability: 8 },
  { id: 6, name: '500积分', points: 500, probability: 2 }
]

// 抽奖记录存储（模拟数据）
const lotteryHistory = new Map()

// 抽奖
router.post('/spin', authenticate, async (req, res) => {
  try {
    const { costPoints = 50 } = req.body
    const user = req.user

    // 检查积分是否足够
    if (user.points < costPoints) {
      return res.json({
        success: false,
        message: '积分不足'
      })
    }

    // 随机抽奖
    const prize = getRandomPrize()
    
    // 计算新积分
    const newPoints = user.points - costPoints + prize.points

    // 更新用户积分
    await User.findByIdAndUpdate(user._id, {
      points: newPoints
    })

    // 记录抽奖历史
    const historyRecord = {
      id: Date.now().toString(),
      userId: user._id,
      prizeName: prize.name,
      prizePoints: prize.points,
      costPoints: costPoints,
      netPoints: prize.points - costPoints,
      timestamp: new Date(),
      timeText: '刚刚'
    }

    // 存储到用户的抽奖记录中
    if (!lotteryHistory.has(user._id)) {
      lotteryHistory.set(user._id, [])
    }
    lotteryHistory.get(user._id).unshift(historyRecord)

    res.json({
      success: true,
      data: {
        prize: {
          id: prize.id,
          name: prize.name,
          points: prize.points
        },
        newPoints: newPoints,
        netPoints: prize.points - costPoints
      }
    })

  } catch (error) {
    console.error('抽奖错误:', error)
    res.json({
      success: false,
      message: '抽奖失败'
    })
  }
})

// 获取抽奖记录
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const userId = req.user._id

    const userHistory = lotteryHistory.get(userId) || []
    
    // 更新时间显示
    const now = new Date()
    const updatedHistory = userHistory.map(record => {
      const diff = now.getTime() - record.timestamp.getTime()
      let timeText = '刚刚'
      
      if (diff < 60000) {
        timeText = '刚刚'
      } else if (diff < 3600000) {
        timeText = `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) {
        timeText = `${Math.floor(diff / 3600000)}小时前`
      } else {
        const date = record.timestamp
        timeText = `${date.getMonth() + 1}月${date.getDate()}日`
      }

      return {
        ...record,
        timeText
      }
    })

    // 分页
    const start = (page - 1) * limit
    const end = start + parseInt(limit)
    const paginatedHistory = updatedHistory.slice(start, end)

    res.json({
      success: true,
      data: {
        records: paginatedHistory,
        total: userHistory.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })

  } catch (error) {
    console.error('获取抽奖记录错误:', error)
    res.json({
      success: false,
      message: '获取记录失败'
    })
  }
})

// 随机抽奖算法
function getRandomPrize() {
  const random = Math.random() * 100
  let currentProbability = 0

  for (const prize of prizes) {
    currentProbability += prize.probability
    if (random <= currentProbability) {
      return prize
    }
  }

  // 兜底返回最后一个奖品
  return prizes[prizes.length - 1]
}

module.exports = router