# 股票投票小程序 - 部署指南

## 环境要求

### 后端环境
- Node.js 16.0+
- MongoDB 4.4+
- npm 或 yarn

### 前端环境
- 微信开发者工具
- 微信小程序账号

## 快速开始

### 1. 安装依赖

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install
```

### 2. 配置环境变量

复制 `server/.env` 文件并修改配置：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/stock-vote

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-here

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. 初始化数据库

```bash
# Windows
scripts\init-db.bat

# macOS/Linux
cd database && node init.js
```

### 5. 启动后端服务

```bash
# Windows
scripts\start.bat

# 或者手动启动
cd server
npm run dev
```

服务器将在 http://localhost:3000 启动

### 6. 配置小程序

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram` 目录
3. 修改 `miniprogram/app.js` 中的 `serverUrl`：
   ```javascript
   globalData: {
     serverUrl: 'http://localhost:3000/api'  // 改为你的服务器地址
   }
   ```
4. 在 `miniprogram/project.config.json` 中配置你的 `appid`

### 7. 测试运行

1. 在微信开发者工具中点击"编译"
2. 如果一切正常，你应该能看到小程序首页
3. 点击登录测试用户系统

## 功能模块

### ✅ 已完成功能
- 用户登录/注册系统
- 投票主题创建和管理
- 股票信息搜索（模拟数据）
- 投票参与功能
- 积分系统和排行榜
- 积分商城和兑换
- 个人中心和统计

### 🚧 待完善功能
- 真实股票数据接入
- 投票自动结算
- 消息推送
- 管理后台
- 数据统计分析

## 目录结构

```
stock-vote-miniprogram/
├── miniprogram/          # 小程序前端
│   ├── pages/           # 页面文件
│   ├── app.js           # 小程序入口
│   ├── app.json         # 小程序配置
│   └── app.wxss         # 全局样式
├── server/              # 后端服务
│   ├── models/          # 数据模型
│   ├── routes/          # API路由
│   ├── jobs/            # 定时任务
│   └── app.js           # 服务器入口
├── database/            # 数据库脚本
├── scripts/             # 启动脚本
└── docs/               # 文档
```

## API 接口

### 用户相关
- `POST /api/auth/login` - 微信登录
- `GET /api/user/info` - 获取用户信息
- `GET /api/user/stats` - 获取用户统计
- `GET /api/user/ranking` - 获取排行榜

### 投票相关
- `GET /api/vote/list` - 获取投票列表
- `GET /api/vote/hot` - 获取热门投票
- `POST /api/vote/create` - 创建投票
- `POST /api/vote/:id/vote` - 参与投票

### 股票相关
- `GET /api/stock/search` - 搜索股票
- `GET /api/stock/price/:code` - 获取股票价格

### 商城相关
- `GET /api/shop/products` - 获取商品列表
- `POST /api/shop/exchange` - 兑换商品

## 常见问题

### Q: 无法连接到服务器
A: 检查服务器是否启动，端口是否正确，防火墙设置

### Q: 微信登录失败
A: 检查 WECHAT_APPID 和 WECHAT_SECRET 是否正确配置

### Q: 数据库连接失败
A: 确保 MongoDB 服务正在运行，检查连接字符串

### Q: 股票数据不准确
A: 当前使用模拟数据，需要接入真实的股票API

## 生产部署

### 1. 服务器配置
- 推荐使用 PM2 管理进程
- 配置 Nginx 反向代理
- 使用 HTTPS 协议

### 2. 数据库配置
- 使用 MongoDB Atlas 或自建 MongoDB 集群
- 配置数据备份策略

### 3. 域名和SSL
- 小程序要求使用 HTTPS
- 配置合法域名

## 技术支持

如有问题，请查看：
1. 控制台错误信息
2. 服务器日志
3. MongoDB 日志

或联系开发团队获取支持。