const cron = require('node-cron')
const axios = require('axios')

// 检查是否使用模拟数据
const useMockData = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/stock-vote'

if (useMockData) {
  console.log('📝 定时任务使用模拟模式 (跳过MongoDB操作)')
  
  // 模拟定时任务，每5分钟执行一次（降低频率）
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ 模拟投票结算检查 (无实际操作)')
  })
} else {
  // 真实模式才加载模型和执行任务
  const Vote = require('../models/Vote')
  const UserVote = require('../models/UserVote')
  const User = require('../models/User')
  
  // 每分钟检查一次需要结算的投票
  cron.schedule('* * * * *', async () => {
    try {
      await checkVoteSettlement()
    } catch (error) {
      console.error('投票结算任务错误:', error)
    }
  })
}

// 检查投票结算 (仅在真实模式下执行)
async function checkVoteSettlement() {
  if (useMockData) {
    console.log('📝 模拟投票结算检查 - 跳过数据库操作')
    return
  }
  
  const Vote = require('../models/Vote')
  const now = new Date()
  
  try {
    // 查找需要结算的投票
    const votesToSettle = await Vote.find({
      status: 'ended',
      settlementTime: { $lte: now }
    })

    for (const vote of votesToSettle) {
      await settleVote(vote)
    }

    // 更新已结束但未标记为ended的投票
    await Vote.updateMany(
      {
        status: 'active',
        endTime: { $lte: now }
      },
      {
        status: 'ended'
      }
    )
  } catch (error) {
    console.error('投票结算检查失败:', error.message)
  }
}

// 结算单个投票 (仅在真实模式下执行)
async function settleVote(vote) {
  if (useMockData) {
    console.log(`📝 模拟结算投票: ${vote.title}`)
    return
  }
  
  const Vote = require('../models/Vote')
  const UserVote = require('../models/UserVote')
  const User = require('../models/User')
  
  try {
    console.log(`开始结算投票: ${vote.title} (${vote._id})`)

    // 获取结算时的股票价格
    const finalPrice = await getStockPrice(vote.stockCode, vote.settlementTime)
    
    if (!finalPrice) {
      console.error(`无法获取股票 ${vote.stockCode} 的结算价格`)
      return
    }

    // 确定实际结果
    let actualResult = 'flat'
    if (finalPrice > vote.basePrice) {
      actualResult = 'up'
    } else if (finalPrice < vote.basePrice) {
      actualResult = 'down'
    }

    // 更新投票状态
    await Vote.findByIdAndUpdate(vote._id, {
      status: 'settled',
      finalPrice: finalPrice,
      actualResult: actualResult
    })

    // 获取所有参与该投票的用户
    const userVotes = await UserVote.find({ voteId: vote._id })

    // 结算每个用户的投票
    for (const userVote of userVotes) {
      const isCorrect = userVote.prediction === actualResult
      let pointsEarned = 0

      if (isCorrect) {
        pointsEarned = vote.pointsReward
        
        // 更新用户积分和正确投票数
        await User.findByIdAndUpdate(userVote.userId, {
          $inc: { 
            points: pointsEarned,
            correctVotes: 1
          }
        })
      }

      // 更新用户投票记录
      await UserVote.findByIdAndUpdate(userVote._id, {
        isCorrect: isCorrect,
        pointsEarned: pointsEarned
      })
    }

    // 更新用户排名
    await User.updateRankings()

    console.log(`投票结算完成: ${vote.title}, 实际结果: ${actualResult}`)

  } catch (error) {
    console.error(`结算投票 ${vote._id} 时出错:`, error)
  }
}

// 获取股票价格
async function getStockPrice(stockCode, date) {
  try {
    // 这里应该调用真实的股票API
    // 为了演示，我们使用模拟数据
    const mockPrices = {
      '000001': 12.48,
      '000002': 18.35,
      '600000': 8.88,
      '600036': 35.10,
      '000001.SH': 3145.60,
      '399001.SZ': 10265.40
    }

    return mockPrices[stockCode] || null
  } catch (error) {
    console.error('获取股票价格错误:', error)
    return null
  }
}

// 手动结算投票（用于测试）
async function manualSettleVote(voteId) {
  const vote = await Vote.findById(voteId)
  if (vote) {
    await settleVote(vote)
  }
}

module.exports = {
  checkVoteSettlement,
  settleVote,
  manualSettleVote
}