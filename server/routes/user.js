const express = require('express')
const jwt = require('jsonwebtoken')
const User = global.User || require('../models/User')
const UserVote = global.UserVote || require('../models/UserVote')
const Vote = global.Vote || require('../models/Vote')

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

// 获取用户信息
router.get('/info', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        nickName: req.user.nickName,
        avatarUrl: req.user.avatarUrl,
        points: req.user.points,
        totalVotes: req.user.totalVotes,
        correctVotes: req.user.correctVotes,
        accuracy: req.user.accuracy,
        rank: req.user.rank
      }
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

// 获取用户统计数据
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user
    
    res.json({
      success: true,
      data: {
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes,
        accuracy: `${user.accuracy}%`,
        points: user.points,
        rank: user.rank
      }
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取统计数据失败'
    })
  }
})

// 获取用户投票历史
router.get('/vote-history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const userVotes = await UserVote.find({ userId: req.user._id })
      .populate('voteId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await UserVote.countDocuments({ userId: req.user._id })

    res.json({
      success: true,
      data: {
        votes: userVotes.map(uv => ({
          id: uv._id,
          vote: {
            id: uv.voteId._id,
            title: uv.voteId.title,
            stockCode: uv.voteId.stockCode,
            stockName: uv.voteId.stockName,
            status: uv.voteId.status,
            actualResult: uv.voteId.actualResult
          },
          prediction: uv.prediction,
          isCorrect: uv.isCorrect,
          pointsEarned: uv.pointsEarned,
          voteTime: uv.voteTime
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total
        }
      }
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取投票历史失败'
    })
  }
})

// 获取排行榜
router.get('/ranking', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (page - 1) * limit

    const users = await User.find({ isActive: true })
    const total = users.length

    // 分页处理
    const paginatedUsers = users.slice(skip, skip + parseInt(limit))

    res.json({
      success: true,
      data: {
        users: paginatedUsers.map(user => ({
          id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          points: user.points,
          totalVotes: user.totalVotes,
          correctVotes: user.correctVotes,
          accuracy: user.totalVotes > 0 ? Math.round((user.correctVotes / user.totalVotes) * 100) : 0,
          rank: user.rank
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: total
        }
      }
    })
  } catch (error) {
    console.error('获取排行榜错误:', error)
    res.json({
      success: false,
      message: '获取排行榜失败'
    })
  }
})

module.exports = router