const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const User = global.User || require('../models/User')

const router = express.Router()

// 微信登录 (支持模拟模式)
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.json({
        success: false,
        message: '缺少登录凭证'
      })
    }

    // 检查是否为模拟模式
    const useMockData = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/stock-vote'
    
    if (useMockData || process.env.WECHAT_APPID === 'test-appid') {
      // 模拟登录模式
      console.log('📝 使用模拟登录模式')
      
      const mockUser = {
        _id: 'test_user_123',
        openid: 'mock_openid_123',
        nickName: '演示用户',
        avatarUrl: 'https://via.placeholder.com/100/1976d2/ffffff?text=Demo',
        points: 150,
        totalVotes: 8,
        correctVotes: 5,
        rank: 3
      }
      
      // 生成模拟token
      const token = jwt.sign(
        { userId: mockUser._id, openid: mockUser.openid },
        process.env.JWT_SECRET || 'mock-secret',
        { expiresIn: '30d' }
      )

      return res.json({
        success: true,
        data: {
          token,
          userInfo: {
            id: mockUser._id,
            nickName: mockUser.nickName,
            avatarUrl: mockUser.avatarUrl,
            points: mockUser.points,
            totalVotes: mockUser.totalVotes,
            correctVotes: mockUser.correctVotes,
            accuracy: Math.round((mockUser.correctVotes / mockUser.totalVotes) * 100),
            rank: mockUser.rank
          }
        }
      })
    }

    // 真实微信登录模式
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const { openid, session_key } = wxResponse.data
    
    if (!openid) {
      return res.json({
        success: false,
        message: '微信登录失败'
      })
    }

    // 查找或创建用户
    let user = await User.findOne({ openid })
    
    if (!user) {
      user = new User({
        openid,
        nickName: `用户${Date.now()}`,
        avatarUrl: ''
      })
      await user.save()
    } else {
      user.lastLoginTime = new Date()
      await user.save()
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, openid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      data: {
        token,
        userInfo: {
          id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          points: user.points,
          rank: user.rank
        }
      }
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.json({
      success: false,
      message: '登录失败'
    })
  }
})

// 更新用户信息
router.post('/update-profile', async (req, res) => {
  try {
    const { userInfo } = req.body
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

    // 更新用户信息
    if (userInfo.nickName) user.nickName = userInfo.nickName
    if (userInfo.avatarUrl) user.avatarUrl = userInfo.avatarUrl
    
    await user.save()

    res.json({
      success: true,
      data: {
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    })

  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.json({
      success: false,
      message: '更新失败'
    })
  }
})

module.exports = router