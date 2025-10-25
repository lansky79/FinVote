// 模拟数据中间件 - 当MongoDB不可用时使用
const mockUsers = new Map()
const mockVotes = new Map()
const mockUserVotes = new Map()

// 初始化一些测试数据
function initMockData() {
  // 模拟多个用户数据
  const testUsers = [
    {
      _id: 'test_user_123',
      openid: 'test_openid_123',
      nickName: '演示用户',
      avatarUrl: 'https://via.placeholder.com/100/1976d2/ffffff?text=Demo',
      points: 150,
      totalVotes: 8,
      correctVotes: 5,
      rank: 3,
      isActive: true
    },
    {
      _id: 'user_001',
      openid: 'openid_001',
      nickName: '股神小王',
      avatarUrl: 'https://via.placeholder.com/100/4caf50/ffffff?text=王',
      points: 280,
      totalVotes: 15,
      correctVotes: 12,
      rank: 1,
      isActive: true
    },
    {
      _id: 'user_002',
      openid: 'openid_002',
      nickName: '投资达人',
      avatarUrl: 'https://via.placeholder.com/100/ff9800/ffffff?text=达',
      points: 220,
      totalVotes: 12,
      correctVotes: 9,
      rank: 2,
      isActive: true
    },
    {
      _id: 'user_003',
      openid: 'openid_003',
      nickName: '财富自由',
      avatarUrl: 'https://via.placeholder.com/100/9c27b0/ffffff?text=财',
      points: 180,
      totalVotes: 10,
      correctVotes: 7,
      rank: 4,
      isActive: true
    },
    {
      _id: 'user_004',
      openid: 'openid_004',
      nickName: '价值投资',
      avatarUrl: 'https://via.placeholder.com/100/f44336/ffffff?text=价',
      points: 120,
      totalVotes: 8,
      correctVotes: 4,
      rank: 5,
      isActive: true
    }
  ]
  
  testUsers.forEach(user => {
    mockUsers.set(user._id, user)
  })

  // 模拟投票数据
  const testVotes = [
    {
      _id: 'test_vote_123',
      title: '平安银行明日走势预测',
      description: '基于近期财报预测平安银行明日收盘价走势',
      stockCode: '000001',
      stockName: '平安银行',
      voteType: 'stock',
      status: 'active',
      participants: 25,
      upVotes: 15,
      downVotes: 10,
      basePrice: 12.50,
      pointsReward: 10,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 46 * 60 * 60 * 1000),
      createdBy: 'user_001',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      _id: 'test_vote_124',
      title: '上证指数本周表现',
      description: '预测上证指数本周五收盘点位相比今日的涨跌情况',
      stockCode: '000001.SH',
      stockName: '上证指数',
      voteType: 'index',
      status: 'active',
      participants: 18,
      upVotes: 12,
      downVotes: 6,
      basePrice: 3150.25,
      pointsReward: 15,
      startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 44 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 68 * 60 * 60 * 1000),
      createdBy: 'user_002',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      _id: 'test_vote_125',
      title: '招商银行短期走势',
      description: '根据银行板块整体表现，预测招商银行未来3天走势',
      stockCode: '600036',
      stockName: '招商银行',
      voteType: 'stock',
      status: 'ended',
      participants: 12,
      upVotes: 8,
      downVotes: 4,
      basePrice: 35.20,
      finalPrice: 35.80,
      actualResult: 'up',
      pointsReward: 10,
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdBy: 'user_003',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  ]
  
  testVotes.forEach(vote => {
    mockVotes.set(vote._id, vote)
  })
}

// 模拟用户模型
class MockUser {
  static async findById(id) {
    return mockUsers.get(id) || null
  }

  static async findOne(query) {
    if (query.openid) {
      for (let user of mockUsers.values()) {
        if (user.openid === query.openid) {
          return user
        }
      }
    }
    return null
  }

  static async findByIdAndUpdate(id, update) {
    const user = mockUsers.get(id)
    if (user && update.$inc) {
      if (update.$inc.points) user.points += update.$inc.points
      if (update.$inc.totalVotes) user.totalVotes += update.$inc.totalVotes
      if (update.$inc.correctVotes) user.correctVotes += update.$inc.correctVotes
      mockUsers.set(id, user)
    }
    return user
  }

  static async find(query = {}) {
    const users = Array.from(mockUsers.values())
    if (query.isActive !== undefined) {
      return users.filter(u => u.isActive === query.isActive).sort((a, b) => a.rank - b.rank)
    }
    return users.sort((a, b) => a.rank - b.rank)
  }

  static async updateRankings() {
    // 模拟排名更新
    console.log('📊 模拟排名更新完成')
  }

  constructor(data) {
    this._id = 'user_' + Date.now()
    Object.assign(this, data)
  }

  async save() {
    mockUsers.set(this._id, this)
    return this
  }
}

// 模拟投票模型
class MockVote {
  static async find(query = {}) {
    let votes = Array.from(mockVotes.values())
    if (query.status) {
      if (query.status.$in) {
        votes = votes.filter(v => query.status.$in.includes(v.status))
      } else {
        votes = votes.filter(v => v.status === query.status)
      }
    }
    return votes.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
  }

  static async findById(id) {
    return mockVotes.get(id) || null
  }

  static async findByIdAndUpdate(id, update) {
    const vote = mockVotes.get(id)
    if (vote && update.$inc) {
      if (update.$inc.participants) vote.participants += update.$inc.participants
      if (update.$inc.upVotes) vote.upVotes += update.$inc.upVotes
      if (update.$inc.downVotes) vote.downVotes += update.$inc.downVotes
      mockVotes.set(id, vote)
    }
    return vote
  }

  constructor(data) {
    this._id = 'vote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    this.participants = 0
    this.upVotes = 0
    this.downVotes = 0
    this.status = 'active'
    this.createdAt = new Date()
    this.updatedAt = new Date()
    Object.assign(this, data)
  }

  async save() {
    mockVotes.set(this._id, this)
    return this
  }
}

// 模拟用户投票模型
class MockUserVote {
  static async find(query = {}) {
    let userVotes = Array.from(mockUserVotes.values())
    if (query.userId) {
      userVotes = userVotes.filter(uv => uv.userId === query.userId)
    }
    if (query.voteId) {
      userVotes = userVotes.filter(uv => uv.voteId === query.voteId)
    }
    return userVotes
  }

  static async findOne(query) {
    for (let userVote of mockUserVotes.values()) {
      if (query.userId && query.voteId) {
        if (userVote.userId === query.userId && userVote.voteId === query.voteId) {
          return userVote
        }
      }
    }
    return null
  }

  static async countDocuments(query = {}) {
    const userVotes = await this.find(query)
    return userVotes.length
  }

  constructor(data) {
    this._id = 'uservote_' + Date.now()
    this.voteTime = new Date()
    Object.assign(this, data)
  }

  async save() {
    mockUserVotes.set(this._id, this)
    return this
  }
}

// 初始化模拟数据
initMockData()

module.exports = {
  MockUser,
  MockVote,
  MockUserVote,
  initMockData
}