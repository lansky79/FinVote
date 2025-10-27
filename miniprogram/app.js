// app.js
App({
    globalData: {
        userInfo: null,
        token: null,
        serverUrl: 'http://172.28.16.1:3000/api'  // 修改为本机IP，支持手机预览
    },

    onLaunch() {
        // 检查登录状态
        this.checkLoginStatus()
    },

    // 检查登录状态
    checkLoginStatus() {
        const token = wx.getStorageSync('token')
        if (token) {
            this.globalData.token = token
            this.getUserInfo()
        }
    },

    // 获取用户信息
    getUserInfo() {
        wx.request({
            url: `${this.globalData.serverUrl}/user/info`,
            header: {
                'Authorization': `Bearer ${this.globalData.token}`
            },
            success: (res) => {
                if (res.data.success) {
                    this.globalData.userInfo = res.data.data
                }
            }
        })
    },

    // 微信登录
    wxLogin() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    if (res.code) {
                        wx.request({
                            url: `${this.globalData.serverUrl}/auth/login`,
                            method: 'POST',
                            data: {
                                code: res.code
                            },
                            success: (response) => {
                                if (response.data.success) {
                                    this.globalData.token = response.data.data.token
                                    this.globalData.userInfo = response.data.data.userInfo
                                    wx.setStorageSync('token', response.data.data.token)
                                    resolve(response.data.data)
                                } else {
                                    reject(response.data.message)
                                }
                            },
                            fail: reject
                        })
                    } else {
                        reject('获取登录凭证失败')
                    }
                },
                fail: reject
            })
        })
    }
})