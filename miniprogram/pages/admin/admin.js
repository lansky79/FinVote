// pages/admin/admin.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isAdmin: false,
    activeTab: 'users', // users, votes, contracts, system
    stats: {
      totalUsers: 0,
      totalVotes: 0,
      totalContracts: 0,
      totalPoints: 0
    },
    users: [],
    votes: [],
    contracts: [],
    loading: true
  },

  onLoad() {
    this.checkAdminPermission()
  },

  // 检查管理员权限
  checkAdminPermission() {
    const userInfo = app.globalData.userInfo
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      return
    }

    // 检查是否为管理员（可以通过用户ID或特殊标识判断）
    const adminUsers = ['test_user_123', 'user_001'] // 管理员用户ID列表
    const isAdmin = adminUsers.includes(userInfo.id)

    if (!isAdmin) {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理员权限',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/index/index' })
        }
      })
      return
    }

    this.setData({
      userInfo,
      isAdmin: true
    })
    this.loadData()
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
    this.loadData()
  },

  // 加载数据
  loadData() {
    this.loadStats()
    
    switch (this.data.activeTab) {
      case 'users':
        this.loadUsers()
        break
      case 'votes':
        this.loadVotes()
        break
      case 'contracts':
        this.loadContracts()
        break
      case 'system':
        this.loadSystemInfo()
        break
    }
  },

  // 加载统计数据
  loadStats() {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/stats`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            stats: res.data.data
          })
        }
      }
    })
  },

  // 加载用户列表
  loadUsers() {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/users`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            users: res.data.data,
            loading: false
          })
        }
      }
    })
  },

  // 加载投票列表
  loadVotes() {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/votes`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            votes: res.data.data,
            loading: false
          })
        }
      }
    })
  },

  // 加载合约列表
  loadContracts() {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/contracts`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            contracts: res.data.data,
            loading: false
          })
        }
      }
    })
  },

  // 加载系统信息
  loadSystemInfo() {
    this.setData({
      loading: false
    })
  },

  // 禁用/启用用户
  toggleUser(e) {
    const userId = e.currentTarget.dataset.id
    const user = this.data.users.find(u => u.id === userId)
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${user.isActive ? '禁用' : '启用'}用户 ${user.nickName} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performToggleUser(userId, !user.isActive)
        }
      }
    })
  },

  // 执行用户状态切换
  performToggleUser(userId, isActive) {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/users/${userId}/toggle`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: { isActive },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '操作成功',
            icon: 'success'
          })
          this.loadUsers()
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 删除投票
  deleteVote(e) {
    const voteId = e.currentTarget.dataset.id
    const vote = this.data.votes.find(v => v.id === voteId)
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除投票 "${vote.title}" 吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          this.performDeleteVote(voteId)
        }
      }
    })
  },

  // 执行删除投票
  performDeleteVote(voteId) {
    wx.request({
      url: `${app.globalData.serverUrl}/admin/votes/${voteId}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          this.loadVotes()
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})