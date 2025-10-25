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

// 获取商品列表
router.get('/products', async (req, res) => {
  try {
    // 模拟商品数据
    const products = [
      {
        id: 1,
        name: '10元话费',
        description: '中国移动/联通/电信通用话费',
        points: 1000,
        stock: 100,
        image: '/images/products/phone-credit.png',
        category: 'virtual'
      },
      {
        id: 2,
        name: '星巴克咖啡券',
        description: '星巴克中杯咖啡兑换券',
        points: 3000,
        stock: 50,
        image: '/images/products/starbucks.png',
        category: 'voucher'
      },
      {
        id: 3,
        name: '京东购物卡50元',
        description: '京东商城购物卡，全场通用',
        points: 5000,
        stock: 30,
        image: '/images/products/jd-card.png',
        category: 'card'
      },
      {
        id: 4,
        name: '爱奇艺VIP月卡',
        description: '爱奇艺黄金VIP会员1个月',
        points: 1500,
        stock: 200,
        image: '/images/products/iqiyi-vip.png',
        category: 'virtual'
      },
      {
        id: 5,
        name: '小米手环',
        description: '小米手环7 智能运动手环',
        points: 15000,
        stock: 10,
        image: '/images/products/mi-band.png',
        category: 'physical'
      }
    ]

    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取商品列表失败'
    })
  }
})

// 兑换商品
router.post('/exchange', authenticate, async (req, res) => {
  try {
    const { productId } = req.body
    
    if (!productId) {
      return res.json({
        success: false,
        message: '请选择要兑换的商品'
      })
    }

    // 模拟商品信息（实际项目中应该从数据库获取）
    const products = {
      1: { name: '10元话费', points: 1000, stock: 100 },
      2: { name: '星巴克咖啡券', points: 3000, stock: 50 },
      3: { name: '京东购物卡50元', points: 5000, stock: 30 },
      4: { name: '爱奇艺VIP月卡', points: 1500, stock: 200 },
      5: { name: '小米手环', points: 15000, stock: 10 }
    }

    const product = products[productId]
    
    if (!product) {
      return res.json({
        success: false,
        message: '商品不存在'
      })
    }

    if (product.stock <= 0) {
      return res.json({
        success: false,
        message: '商品库存不足'
      })
    }

    if (req.user.points < product.points) {
      return res.json({
        success: false,
        message: '积分不足'
      })
    }

    // 扣除用户积分
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: -product.points }
    })

    // 这里应该创建兑换记录，发送兑换码等
    // 为了简化，我们只返回成功信息

    res.json({
      success: true,
      message: '兑换成功',
      data: {
        productName: product.name,
        pointsUsed: product.points,
        exchangeCode: `EX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      }
    })

  } catch (error) {
    console.error('兑换商品错误:', error)
    res.json({
      success: false,
      message: '兑换失败'
    })
  }
})

// 获取兑换记录
router.get('/exchange-history', authenticate, async (req, res) => {
  try {
    // 模拟兑换记录（实际项目中应该从数据库获取）
    const exchangeHistory = [
      {
        id: 1,
        productName: '10元话费',
        pointsUsed: 1000,
        exchangeCode: 'EX1234567890AB',
        status: 'completed',
        exchangeTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        productName: '爱奇艺VIP月卡',
        pointsUsed: 1500,
        exchangeCode: 'EX0987654321CD',
        status: 'processing',
        exchangeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]

    res.json({
      success: true,
      data: exchangeHistory
    })
  } catch (error) {
    res.json({
      success: false,
      message: '获取兑换记录失败'
    })
  }
})

module.exports = router