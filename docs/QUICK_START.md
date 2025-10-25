# 快速启动指南

## 🚀 5分钟启动项目

### 前置要求
- Node.js 16.0+ (必需)
- MongoDB (可选，先用模拟数据)
- 微信开发者工具 (必需)

## 第一步：启动后端服务

### 1.1 安装Node.js依赖
```bash
# 进入服务器目录
cd server

# 安装依赖包
npm install
```

### 1.2 配置环境变量
```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件 (用记事本打开)
notepad .env
```

在 `.env` 文件中填入：
```bash
# 数据库配置 (暂时用模拟数据，可以随便填)
MONGODB_URI=mongodb://localhost:27017/stock-vote

# JWT密钥 (随便填一个)
JWT_SECRET=your-super-secret-key-12345

# 微信小程序配置 (暂时用测试值)
WECHAT_APPID=test-appid
WECHAT_SECRET=test-secret

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 1.3 启动后端服务
```bash
# 在 server 目录下运行
npm run dev

# 看到这个提示就成功了：
# 服务器运行在端口 3000
# MongoDB 连接成功 (如果有MongoDB)
```

## 第二步：启动小程序

### 2.1 下载微信开发者工具
1. 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 下载并安装微信开发者工具
3. 用微信扫码登录

### 2.2 导入小程序项目
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择项目目录：`你的项目路径/miniprogram`
4. AppID选择："测试号" (无需真实AppID)
5. 项目名称：`股票投票小程序`
6. 点击"导入"

### 2.3 配置服务器地址
在小程序中修改服务器地址：
```javascript
// 打开 miniprogram/app.js
// 找到这一行，确认地址正确：
globalData: {
  serverUrl: 'http://localhost:3000/api'  // 确保端口是3000
}
```

### 2.4 配置开发者工具
1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view..."
3. 勾选"启用调试"

## 第三步：测试运行

### 3.1 启动顺序
```bash
# 1. 先启动后端 (在 server 目录)
npm run dev

# 2. 再启动小程序 (微信开发者工具点击"编译")
```

### 3.2 测试功能
1. 在小程序中点击"微信登录" (会用测试数据)
2. 点击"🔗 区块链演示" 按钮
3. 尝试"投票数据上链"功能
4. 查看"区块链存证记录"

## 第四步：验证成功

### 4.1 后端验证
浏览器访问：http://localhost:3000/api/user/ranking
看到JSON数据就说明后端正常

### 4.2 小程序验证
- ✅ 首页能正常显示
- ✅ 能点击登录 (显示测试用户信息)
- ✅ 区块链演示页面能打开
- ✅ 能模拟投票上链操作

## 常见问题解决

### 问题1：npm install 失败
```bash
# 解决方案：使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题2：端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 杀死进程 (PID是上面查到的进程号)
taskkill /PID 进程号 /F

# 或者修改端口
# 在 server/.env 中改为 PORT=3001
```

### 问题3：小程序无法连接后端
1. 确认后端已启动 (控制台显示"服务器运行在端口 3000")
2. 确认小程序中的 serverUrl 地址正确
3. 确认开发者工具已勾选"不校验合法域名"

### 问题4：MongoDB连接失败
```bash
# 暂时忽略，项目会使用模拟数据
# 后端日志显示 "MongoDB 连接错误" 是正常的
# 不影响功能演示
```

## 高级配置 (可选)

### 安装MongoDB (如需真实数据库)
```bash
# Windows用户
1. 下载MongoDB Community Server
2. 安装并启动服务
3. 重启后端服务

# 或者使用在线MongoDB
# 注册 MongoDB Atlas 免费账号
# 获取连接字符串替换 MONGODB_URI
```

### 配置真实微信小程序
```bash
# 1. 注册微信小程序账号
# 2. 获取 AppID 和 AppSecret
# 3. 修改 .env 文件中的配置
# 4. 在开发者工具中输入真实AppID
```

## 🎯 启动成功标志

当你看到以下内容时，说明启动成功：

### 后端控制台显示：
```
服务器运行在端口 3000
MongoDB 连接成功 (或连接错误，不影响演示)
```

### 小程序显示：
- 首页正常加载
- 能看到"欢迎来到股票投票"
- 点击"区块链演示"能打开新页面
- 能看到"腾讯云TBaaS联盟链 已连接"

### 功能测试通过：
- ✅ 登录功能 (显示测试用户)
- ✅ 投票上链演示 (显示模拟交易ID)
- ✅ 积分存证演示 (显示处理进度)
- ✅ 区块链记录查看 (显示历史记录)

## 🚨 紧急救援

如果遇到任何问题，按以下顺序检查：

1. **检查Node.js版本**
   ```bash
   node --version  # 应该是 v16.0.0 或更高
   ```

2. **检查端口占用**
   ```bash
   netstat -ano | findstr :3000
   ```

3. **重启所有服务**
   ```bash
   # 关闭后端 (Ctrl+C)
   # 关闭小程序开发者工具
   # 重新按步骤启动
   ```

4. **查看错误日志**
   - 后端错误：看控制台输出
   - 小程序错误：看开发者工具控制台

## 🎉 启动成功后

恭喜！你现在有了一个完整的区块链股票投票系统：

- 📱 微信小程序前端
- 🖥️ Node.js后端服务  
- 🔗 区块链存证功能 (模拟)
- 💰 积分系统
- 🏆 排行榜功能
- 🛒 积分商城

**下一步：给甲方演示，展示区块链上链功能！**