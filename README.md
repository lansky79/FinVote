# 微信小程序股票投票系统

## 项目概述
一个支持自定义投票主题的股票/大盘涨跌预测小程序，用户可以通过投票获得积分并兑换奖品。让股票投资变得更有趣，通过社区预测的方式增加用户参与度。

## 功能特性
- 🎯 **自定义投票主题** - 支持股票代码、大盘指数的涨跌预测
- 📊 **实时数据展示** - 股票价格和投票统计实时更新
- 🏆 **积分排行榜** - 根据预测准确率和积分进行排名
- 🎁 **积分商城** - 积分兑换话费、购物卡、实物奖品
- ⏰ **灵活时间设置** - 自定义投票截止时间和结算时间
- 👥 **社区互动** - 查看其他用户的预测和成绩
- 📱 **移动优先** - 专为微信小程序优化的用户体验

## 技术栈
- **前端**: 微信小程序原生开发
- **后端**: Node.js + Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + 微信登录
- **定时任务**: node-cron
- **股票数据**: 模拟数据（可扩展真实API）

## 开发进度
- [x] 项目架构搭建
- [x] 用户登录系统
- [x] 投票主题管理
- [x] 股票数据接入（模拟）
- [x] 积分系统
- [x] 排行榜功能
- [x] 积分商城
- [x] 个人中心
- [x] 投票结算机制
- [ ] 真实股票数据API
- [ ] 消息推送
- [ ] 管理后台

## 快速开始

### 环境要求
- Node.js 16.0+
- MongoDB 4.4+
- 微信开发者工具

### 安装部署
```bash
# 1. 克隆项目
git clone <repository-url>
cd stock-vote-miniprogram

# 2. 安装后端依赖
cd server
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和微信小程序信息

# 4. 初始化数据库
cd ../database
node init.js

# 5. 启动后端服务
cd ../server
npm run dev

# 6. 配置小程序
# 用微信开发者工具打开 miniprogram 目录
# 修改 app.js 中的 serverUrl 为你的后端地址
```

详细部署指南请查看 [SETUP.md](SETUP.md)

## 项目结构
```
stock-vote-miniprogram/
├── miniprogram/              # 小程序前端
│   ├── pages/               # 页面文件
│   │   ├── index/          # 首页
│   │   ├── vote/           # 投票列表
│   │   ├── create-vote/    # 创建投票
│   │   ├── ranking/        # 排行榜
│   │   ├── profile/        # 个人中心
│   │   └── shop/           # 积分商城
│   ├── app.js              # 小程序入口
│   ├── app.json            # 小程序配置
│   └── app.wxss            # 全局样式
├── server/                  # 后端服务
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── Vote.js         # 投票模型
│   │   └── UserVote.js     # 用户投票记录
│   ├── routes/             # API路由
│   │   ├── auth.js         # 认证相关
│   │   ├── user.js         # 用户相关
│   │   ├── vote.js         # 投票相关
│   │   ├── stock.js        # 股票数据
│   │   └── shop.js         # 商城相关
│   ├── jobs/               # 定时任务
│   │   └── voteSettlement.js # 投票结算
│   └── app.js              # 服务器入口
├── database/               # 数据库脚本
│   └── init.js             # 初始化脚本
├── scripts/                # 启动脚本
│   ├── start.bat           # Windows启动脚本
│   └── init-db.bat         # 数据库初始化脚本
└── docs/                   # 文档
```

## 核心功能

### 投票系统
- 创建自定义投票主题
- 设置投票截止时间和结算时间
- 支持个股和指数预测
- 实时投票统计和可视化

### 积分系统
- 预测正确获得积分奖励
- 积分排行榜实时更新
- 多维度统计（总投票数、正确率等）

### 商城系统
- 虚拟商品（话费、VIP会员）
- 实物商品（电子产品）
- 优惠券和购物卡
- 兑换记录管理

## API 文档

### 认证接口
- `POST /api/auth/login` - 微信登录
- `POST /api/auth/update-profile` - 更新用户信息

### 用户接口
- `GET /api/user/info` - 获取用户信息
- `GET /api/user/stats` - 获取用户统计
- `GET /api/user/ranking` - 获取排行榜
- `GET /api/user/vote-history` - 获取投票历史

### 投票接口
- `GET /api/vote/list` - 获取投票列表
- `GET /api/vote/hot` - 获取热门投票
- `GET /api/vote/:id` - 获取投票详情
- `POST /api/vote/create` - 创建投票
- `POST /api/vote/:id/vote` - 参与投票

### 股票接口
- `GET /api/stock/search` - 搜索股票信息
- `GET /api/stock/price/:code` - 获取实时价格
- `GET /api/stock/history/:code` - 获取历史价格

### 商城接口
- `GET /api/shop/products` - 获取商品列表
- `POST /api/shop/exchange` - 兑换商品
- `GET /api/shop/exchange-history` - 获取兑换记录

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系我们

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 邮箱: developer@stockvote.com

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！