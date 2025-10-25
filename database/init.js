const mongoose = require('mongoose')
require('dotenv').config({ path: '../server/.env' })

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-vote', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const User = require('../server/models/User')
const Vote = require('../server/models/Vote')
const UserVote = require('../server/models/UserVote')

async function initDatabase() {
  try {
    console.log('开始初始化数据库...')

    // 清空现有数据（仅用于开发环境）
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({})
      await Vote.deleteMany({})
      await UserVote.deleteMany({})
      console.log('已清空现有数据')
    }

    // 创建测试用户
    const testUsers = [
      {
        openid: 'test_user_1',
        nickName: '股神小王',
        avatarUrl: 'https://via.placeholder.com/100',
        points: 1500,
        totalVotes: 20,
        correctVotes: 12
      },
      {
        openid: 'test_user_2',
        nickName: '投资达人',
        avatarUrl: 'https://via.placeholder.com/100',
        points: 2300,
        totalVotes: 25,
        correctVotes: 18
      },
      {
        openid: 'test_user_3',
        nickName: '财富自由',
        avatarUrl: 'https://via.placeholder.com/100',
        points: 800,
        totalVotes: 15,
        correctVotes: 8
      }
    ]

    const createdUsers = await User.insertMany(testUsers)
    console.log(`创建了 ${createdUsers.length} 个测试用户`)

    // 创建测试投票
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const testVotes = [
      {
        title: '平安银行明日走势预测',
        description: '基于近期财报和市场环境，预测平安银行明日收盘价走势',
        stockCode: '000001',
        stockName: '平安银行',
        voteType: 'stock',
        startTime: now,
        endTime: tomorrow,
        settlementTime: dayAfterTomorrow,
        status: 'active',
        basePrice: 12.50,
        pointsReward: 10,
        createdBy: createdUsers[0]._id,
        participants: 15,
        upVotes: 9,
        downVotes: 6
      },
      {
        title: '上证指数本周表现',
        description: '预测上证指数本周五收盘点位相比今日的涨跌情况',
        stockCode: '000001.SH',
        stockName: '上证指数',
        voteType: 'index',
        startTime: now,
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        settlementTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: 'active',
        basePrice: 3150.25,
        pointsReward: 15,
        createdBy: createdUsers[1]._id,
        participants: 23,
        upVotes: 14,
        downVotes: 9
      },
      {
        title: '招商银行短期走势',
        description: '根据银行板块整体表现，预测招商银行未来3天走势',
        stockCode: '600036',
        stockName: '招商银行',
        voteType: 'stock',
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 60 * 60 * 1000),
        settlementTime: new Date(now.getTime() + 60 * 60 * 1000),
        status: 'ended',
        basePrice: 35.20,
        pointsReward: 10,
        createdBy: createdUsers[2]._id,
        participants: 8,
        upVotes: 5,
        downVotes: 3
      }
    ]

    const createdVotes = await Vote.insertMany(testVotes)
    console.log(`创建了 ${createdVotes.length} 个测试投票`)

    // 创建测试投票记录
    const testUserVotes = [
      {
        userId: createdUsers[0]._id,
        voteId: createdVotes[1]._id,
        prediction: 'up',
        voteTime: now
      },
      {
        userId: createdUsers[1]._id,
        voteId: createdVotes[0]._id,
        prediction: 'down',
        voteTime: now
      },
      {
        userId: createdUsers[2]._id,
        voteId: createdVotes[2]._id,
        prediction: 'up',
        isCorrect: true,
        pointsEarned: 10,
        voteTime: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }
    ]

    await UserVote.insertMany(testUserVotes)
    console.log(`创建了 ${testUserVotes.length} 个测试投票记录`)

    // 更新用户排名
    await User.updateRankings()
    console.log('已更新用户排名')

    console.log('数据库初始化完成！')
    process.exit(0)

  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

initDatabase()