// pages/shop/shop.js
const app = getApp()

Page({
  data: {
    userPoints: 0,
    products: [],
    filteredProducts: [],
    categories: [
      { name: '全部', value: 'all' },
      { name: '虚拟商品', value: 'virtual' },
      { name: '优惠券', value: 'voucher' },
      { name: '购物卡', value: 'card' },
      { name: '实物商品', value: 'physical' }
    ],
    categoryIndex: 0,
    showModal: false,
    selectedProduct: {}
  },

  onLoad() {
    this.loadUserPoints()
    this.loadProducts()
  },

  onShow() {
    this.loadUserPoints()
  },

  // 加载用户积分
  loadUserPoints() {
    if (app.globalData.userInfo) {
      this.setData({
        userPoints: app.globalData.userInfo.points || 0
      })
    }
  },

  // 加载商品列表
  loadProducts() {
    wx.request({
      url: `${app.globalData.serverUrl}/shop/products`,
      success: (res) => {
        if (res.data.success) {
          this.setData({
            products: res.data.data,
            filteredProducts: res.data.data
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 切换分类
  switchCategory(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const category = this.data.categories[index]
    
    let filteredProducts = this.data.products
    if (category.value !== 'all') {
      filteredProducts = this.data.products.filter(product => 
        product.category === category.value
      )
    }
    
    this.setData({
      categoryIndex: index,
      filteredProducts: filteredProducts
    })
  },

  // 显示商品详情
  showProductDetail(e) {
    const product = e.currentTarget.dataset.product
    this.setData({
      selectedProduct: product,
      showModal: true
    })
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false
    })
  },

  // 阻止弹窗关闭
  preventClose() {
    // 空函数，阻止事件冒泡
  },

  // 兑换商品
  exchangeProduct() {
    const { selectedProduct, userPoints } = this.data
    
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (selectedProduct.stock <= 0) {
      wx.showToast({
        title: '商品缺货',
        icon: 'none'
      })
      return
    }

    if (userPoints < selectedProduct.points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定要用 ${selectedProduct.points} 积分兑换 ${selectedProduct.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doExchange()
        }
      }
    })
  },

  // 执行兑换
  doExchange() {
    wx.showLoading({ title: '兑换中...' })
    
    wx.request({
      url: `${app.globalData.serverUrl}/shop/exchange`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: {
        productId: this.data.selectedProduct.id
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          // 更新用户积分
          const newPoints = this.data.userPoints - this.data.selectedProduct.points
          this.setData({
            userPoints: newPoints,
            showModal: false
          })
          
          // 更新全局用户信息
          if (app.globalData.userInfo) {
            app.globalData.userInfo.points = newPoints
          }

          wx.showModal({
            title: '兑换成功',
            content: `恭喜您成功兑换 ${res.data.data.productName}！\n\n兑换码：${res.data.data.exchangeCode}\n\n请截图保存兑换码，客服会尽快为您处理。`,
            showCancel: false,
            confirmText: '知道了'
          })
        } else {
          wx.showToast({
            title: res.data.message || '兑换失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  }
})