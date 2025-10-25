// pages/vote/vote.js
const app = getApp()

Page({
  data: {
    votes: [],
    statusOptions: [
      { name: '全部', value: 'all' },
      { name: '进行中', value: 'active' },
      { name: '已结束', value: 'ended' },
      { name: '已结算', value: 'settled' }
    ],
    statusIndex: 1, // 默认显示进行中的投票
    currentPage: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadVotes(true)
  },

  onShow() {
    // 每次显示页面时刷新第一页数据
    this.loadVotes(true)
  },

  onPullDownRefresh() {
    this.loadVotes(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 加载投票列表
  loadVotes(refresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const page = refresh ? 1 : this.data.currentPage
    const status = this.data.statusOptions[this.data.statusIndex].value

    wx.request({
      url: `${app.globalData.serverUrl}/vote/list`,
      data: {
        page: page,
        limit: 10,
        status: status
      },
      success: (res) => {
        if (res.data.success) {
          const newVotes = res.data.data.votes.map(vote => ({
            ...vote,
            timeText: this.formatTimeText(vote),
            upPercent: this.calculatePercent(vote.upVotes, vote.participants),
            downPercent: this.calculatePercent(vote.downVotes, vote.participants)
          }))

          this.setData({
            votes: refresh ? newVotes : [...this.data.votes, ...newVotes],
            currentPage: page,
            hasMore: res.data.data.pagination.current < res.data.data.pagination.total,
            loading: false
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 格式化时间文本
  formatTimeText(vote) {
    const now = new Date()
    const endTime = new Date(vote.endTime)
    const diff = endTime.getTime() - now.getTime()

    if (vote.status === 'active') {
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        if (hours > 24) {
          const days = Math.floor(hours / 24)
          return `${days}天后截止`
        } else if (hours > 0) {
          return `${hours}小时${minutes}分钟后截止`
        } else {
          return `${minutes}分钟后截止`
        }
      } else {
        return '即将截止'
      }
    } else if (vote.status === 'ended') {
      return '等待结算'
    } else {
      return '已结算'
    }
  },

  // 计算百分比
  calculatePercent(count, total) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  },

  // 状态筛选改变
  handleStatusChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      statusIndex: index,
      currentPage: 1,
      votes: [],
      hasMore: true
    })
    this.loadVotes(true)
  },

  // 加载更多
  loadMore() {
    this.setData({
      currentPage: this.data.currentPage + 1
    })
    this.loadVotes(false)
  },

  // 跳转到投票详情
  goToVoteDetail(e) {
    const voteId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/vote-detail/vote-detail?id=${voteId}`
    })
  },

  // 跳转到创建投票
  goToCreate() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/create-vote/create-vote'
    })
  }
})