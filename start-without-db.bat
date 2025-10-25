@echo off
echo ========================================
echo 🚀 启动股票投票小程序 (无数据库模式)
echo ========================================

cd server

echo 第1步：设置环境变量...
set NODE_ENV=development
set MONGODB_URI=mock

echo 第2步：检查依赖...
if not exist node_modules (
    echo 安装依赖包...
    npm install
)

echo 第3步：启动服务 (模拟数据模式)...
echo ========================================
echo 🔗 区块链服务：模拟模式
echo 📝 数据库：模拟数据模式  
echo 📍 服务地址：http://localhost:3000
echo ========================================
echo.
echo ✅ 现在可以：
echo 1. 保持此窗口运行
echo 2. 打开微信开发者工具
echo 3. 导入 miniprogram 目录
echo 4. 体验完整功能！
echo.

npm run dev