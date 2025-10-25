const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// 检查是否使用模拟数据
const useMockData = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/stock-vote'

if (useMockData) {
  // 使用模拟数据，替换模型
  const { MockUser, MockVote, MockUserVote } = require('./middleware/mockData')
  
  // 全局替换模型
  global.User = MockUser
  global.Vote = MockVote  
  global.UserVote = MockUserVote
  
  console.log('📝 使用模拟数据模式')
}

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 连接数据库 (可选，失败不影响服务运行)
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/stock-vote') {
  // 只有配置了真实数据库才连接
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB 连接成功')
  })

  mongoose.connection.on('error', (err) => {
    console.warn('⚠️  MongoDB 连接失败，使用模拟数据:', err.message)
  })
} else {
  console.log('📝 使用模拟数据模式 (无需MongoDB)')
}

// 路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/user', require('./routes/user'))
app.use('/api/vote', require('./routes/vote'))
app.use('/api/stock', require('./routes/stock'))
app.use('/api/shop', require('./routes/shop'))
app.use('/api/blockchain', require('./routes/blockchain'))

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 启动定时任务
require('./jobs/voteSettlement')

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})