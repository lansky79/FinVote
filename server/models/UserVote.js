const mongoose = require('mongoose')

const userVoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  voteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vote',
    required: true
  },
  prediction: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  voteTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引，确保用户对同一投票只能投一次
userVoteSchema.index({ userId: 1, voteId: 1 }, { unique: true })
userVoteSchema.index({ voteId: 1 })
userVoteSchema.index({ userId: 1 })

module.exports = mongoose.model('UserVote', userVoteSchema)