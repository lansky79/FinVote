const mongoose = require('mongoose')

const voteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  stockCode: {
    type: String,
    required: true
  },
  stockName: {
    type: String,
    required: true
  },
  voteType: {
    type: String,
    enum: ['stock', 'index'], // stock: 个股, index: 指数
    default: 'stock'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  settlementTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'ended', 'settled'],
    default: 'pending'
  },
  basePrice: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  actualResult: {
    type: String,
    enum: ['up', 'down', 'flat'],
    default: null
  },
  pointsReward: {
    type: Number,
    default: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: {
    type: Number,
    default: 0
  },
  upVotes: {
    type: Number,
    default: 0
  },
  downVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 索引
voteSchema.index({ status: 1, endTime: 1 })
voteSchema.index({ stockCode: 1 })
voteSchema.index({ createdBy: 1 })

module.exports = mongoose.model('Vote', voteSchema)