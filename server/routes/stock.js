const express = require('express')
const axios = require('axios')

const router = express.Router()

// 搜索股票信息
router.get('/search', async (req, res) => {
  try {
    const { code, type = 'stock' } = req.query
    
    if (!code) {
      return res.json({
        success: false,
        message: '请提供股票代码'
      })
    }

    // 模拟股票数据（实际项目中应该调用真实的股票API）
    const mockStockData = {
      '000001': { name: '平安银行', price: 12.50, change: 0.15, changePercent: 1.22 },
      '000002': { name: '万科A', price: 18.30, change: -0.25, changePercent: -1.35 },
      '600000': { name: '浦发银行', price: 8.90, change: 0.08, changePercent: 0.91 },
      '600036': { name: '招商银行', price: 35.20, change: 0.50, changePercent: 1.44 },
      '000001.SH': { name: '上证指数', price: 3150.25, change: 15.30, changePercent: 0.49 },
      '399001.SZ': { name: '深证成指', price: 10250.80, change: -25.60, changePercent: -0.25 }
    }

    const stockData = mockStockData[code.toUpperCase()]
    
    if (!stockData) {
      return res.json({
        success: false,
        message: '未找到该股票信息'
      })
    }

    res.json({
      success: true,
      data: {
        code: code.toUpperCase(),
        name: stockData.name,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        type: type
      }
    })

  } catch (error) {
    console.error('搜索股票错误:', error)
    res.json({
      success: false,
      message: '搜索失败'
    })
  }
})

// 获取股票实时价格
router.get('/price/:code', async (req, res) => {
  try {
    const { code } = req.params
    
    // 模拟获取实时价格
    const mockPriceData = {
      '000001': 12.55,
      '000002': 18.25,
      '600000': 8.95,
      '600036': 35.30,
      '000001.SH': 3155.80,
      '399001.SZ': 10240.20
    }

    const price = mockPriceData[code.toUpperCase()]
    
    if (price === undefined) {
      return res.json({
        success: false,
        message: '未找到价格信息'
      })
    }

    res.json({
      success: true,
      data: {
        code: code.toUpperCase(),
        price: price,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取价格错误:', error)
    res.json({
      success: false,
      message: '获取价格失败'
    })
  }
})

// 获取股票历史价格（用于结算）
router.get('/history/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { date } = req.query
    
    if (!date) {
      return res.json({
        success: false,
        message: '请提供查询日期'
      })
    }

    // 模拟历史价格数据
    const mockHistoryData = {
      '000001': 12.48,
      '000002': 18.35,
      '600000': 8.88,
      '600036': 35.10,
      '000001.SH': 3145.60,
      '399001.SZ': 10265.40
    }

    const price = mockHistoryData[code.toUpperCase()]
    
    if (price === undefined) {
      return res.json({
        success: false,
        message: '未找到历史价格信息'
      })
    }

    res.json({
      success: true,
      data: {
        code: code.toUpperCase(),
        price: price,
        date: date
      }
    })

  } catch (error) {
    console.error('获取历史价格错误:', error)
    res.json({
      success: false,
      message: '获取历史价格失败'
    })
  }
})

module.exports = router