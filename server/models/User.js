const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true
  },
  nickName: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  correctVotes: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 计算准确率
userSchema.virtual('accuracy').get(function() {
  if (this.totalVotes === 0) return 0
  return Math.round((this.correctVotes / this.totalVotes) * 100)
})

// 更新排名的静态方法
userSchema.statics.updateRankings = async function() {
  const users = await this.find({ isActive: true })
    .sort({ points: -1, correctVotes: -1, totalVotes: 1 })
  
  for (let i = 0; i < users.length; i++) {
    await this.findByIdAndUpdate(users[i]._id, { rank: i + 1 })
  }
}

module.exports = mongoose.model('User', userSchema)