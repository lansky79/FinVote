const express = require('express')
const jwt = require('jsonwebtoken')
const Vote = global.Vote || require('../models/Vote')
const UserVote = global.UserVote || require('../models/UserVote')
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

// 获取热门投票
router.get('/hot', async (req, res) => {
  try {
    const votes = await Vote.find({
      status: { $in: ['active', 'ended'] }
    })

    // 按参与人数排序
    const sortedVotes = votes.sort((a, b) => b.participants - a.participants).slice(0, 10)

    // 获取创建者信息
    const votesWithCreator = await Promise.all(sortedVotes.map(async (vote) => {
      let creatorName = '匿名用户'
      
      if (vote.createdBy) {
        const creator = await User.findById(vote.createdBy)
        if (creator) {
          creatorName = creator.nickName
        }
      }

      return {
        id: vote._id,
        title: vote.title,
        stockCode: vote.stockCode,
        stockName: vote.stockName,
        status: vote.status,
        endTime: vote.endTime,
        participants: vote.participants,
        upVotes: vote.upVotes,
        downVotes: vote.downVotes,
        creator: creatorName
      }
    }))

    res.json({
      success: true,
      data: votesWithCreator
    })
  } catch (error) {
    console.error('获取热门投票错误:', error)
    res.json({
      success: false,
      message: '获取热门投票失败'
    })
  }
})

// 获取投票列表
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (status !== 'all') {
      query.status = status
    }

    const allVotes = await Vote.find(query)
    const total = allVotes.length

    // 分页处理
    const votes = allVotes.slice(skip, skip + parseInt(limit))

    // 获取创建者信息
    const votesWithCreator = await Promise.all(votes.map(async (vote) => {
      let creator = { nickName: '匿名用户', avatarUrl: '' }
      
      if (vote.createdBy) {
        const creatorUser = await User.findById(vote.createdBy)
        if (creatorUser) {
          creator = {
            nickName: creatorUser.nickName,
            avatarUrl: creatorUser.avatarUrl
          }
        }
      }

      return {
        id: vote._id,
        title: vote.title,
        description: vote.description,
        stockCode: vote.stockCode,
        stockName: vote.stockName,
        voteType: vote.voteType,
        status: vote.status,
        startTime: vote.startTime,
        endTime: vote.endTime,
        participants: vote.participants,
        upVotes: vote.upVotes,
        downVotes: vote.downVotes,
        pointsReward: vote.pointsReward,
        creator: creator
      }
    }))

    res.json({
      success: true,
      data: {
        votes: votesWithCreator,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: total
        }
      }
    })
  } catch (error) {
    console.error('获取投票列表错误:', error)
    res.json({
      success: false,
      message: '获取投票列表失败'
    })
  }
})

// 获取投票详情
router.get('/:id', async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id)
      .populate('createdBy', 'nickName avatarUrl')

    if (!vote) {
      return res.json({
        success: false,
        message: '投票不存在'
      })
    }

    // 如果用户已登录，检查是否已投票
    let userVote = null
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        userVote = await UserVote.findOne({
          userId: decoded.userId,
          voteId: vote._id
        })
      } catch (error) {
        // 忽略token验证错误
      }
    }

    res.json({
      success: true,
      data: {
        id: vote._id,
        title: vote.title,
        description: vote.description,
        stockCode: vote.stockCode,
        stockName: vote.stockName,
        voteType: vote.voteType,
        status: vote.status,
        startTime: vote.startTime,
        endTime: vote.endTime,
        settlementTime: vote.settlementTime,
        basePrice: vote.basePrice,
        finalPrice: vote.finalPrice,
        actualResult: vote.actualResult,
        participants: vote.participants,
        upVotes: vote.upVotes,
        downVotes: vote.downVotes,
        pointsReward: vote.pointsReward,
        creator: {
          nickName: vote.createdBy.nickName,
          avatarUrl: vote.createdBy.avatarUrl
        },
        userVote: userVote ? {
          prediction: userVote.prediction,
          isCorrect: userVote.isCorrect,
          pointsEarned: userVote.pointsEarned
        } : null
      }
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取投票详情失败'
    })
  }
})

// 创建投票
router.post('/create', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      stockCode,
      stockName,
      voteType,
      endTime,
      settlementTime,
      pointsReward
    } = req.body

    // 验证必填字段
    if (!title || !stockCode || !stockName || !endTime || !settlementTime) {
      return res.json({
        success: false,
        message: '请填写完整信息'
      })
    }

    // 验证时间
    const now = new Date()
    const voteEndTime = new Date(endTime)
    const voteSettlementTime = new Date(settlementTime)

    if (voteEndTime <= now) {
      return res.json({
        success: false,
        message: '投票截止时间必须晚于当前时间'
      })
    }

    if (voteSettlementTime <= voteEndTime) {
      return res.json({
        success: false,
        message: '结算时间必须晚于投票截止时间'
      })
    }

    const vote = new Vote({
      title,
      description: description || '',
      stockCode: stockCode.toUpperCase(),
      stockName,
      voteType: voteType || 'stock',
      startTime: now,
      endTime: voteEndTime,
      settlementTime: voteSettlementTime,
      pointsReward: pointsReward || 10,
      createdBy: req.user._id,
      status: 'active'
    })

    await vote.save()

    res.json({
      success: true,
      data: {
        id: vote._id,
        message: '投票创建成功'
      }
    })
  } catch (error) {
    console.error('创建投票错误:', error)
    res.json({
      success: false,
      message: '创建投票失败'
    })
  }
})

// 参与投票
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { prediction } = req.body
    const voteId = req.params.id

    if (!prediction || !['up', 'down'].includes(prediction)) {
      return res.json({
        success: false,
        message: '请选择有效的预测选项'
      })
    }

    // 检查投票是否存在且有效
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
        message: '投票已结束'
      })
    }

    if (new Date() > vote.endTime) {
      return res.json({
        success: false,
        message: '投票时间已截止'
      })
    }

    // 检查用户是否已投票
    const existingVote = await UserVote.findOne({
      userId: req.user._id,
      voteId: voteId
    })

    if (existingVote) {
      return res.json({
        success: false,
        message: '您已经投过票了'
      })
    }

    // 创建用户投票记录
    const userVote = new UserVote({
      userId: req.user._id,
      voteId: voteId,
      prediction: prediction
    })

    await userVote.save()

    // 更新投票统计
    const updateData = {
      $inc: { participants: 1 }
    }
    
    if (prediction === 'up') {
      updateData.$inc.upVotes = 1
    } else {
      updateData.$inc.downVotes = 1
    }

    await Vote.findByIdAndUpdate(voteId, updateData)

    // 更新用户投票总数
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalVotes: 1 }
    })

    res.json({
      success: true,
      message: '投票成功'
    })
  } catch (error) {
    console.error('投票错误:', error)
    res.json({
      success: false,
      message: '投票失败'
    })
  }
})

module.exports = router