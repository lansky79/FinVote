@echo off
echo ========================================
echo 🔧 修复依赖并启动项目
echo ========================================

cd server

echo 第1步：安装缺失的依赖包...
npm install tencentcloud-sdk-nodejs --save
if errorlevel 1 (
    echo 使用国内镜像重试...
    npm config set registry https://registry.npmmirror.com
    npm install tencentcloud-sdk-nodejs --save
)

echo 第2步：安装其他依赖...
npm install
if errorlevel 1 (
    echo 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

echo 第3步：检查配置文件...
if not exist .env (
    copy .env.example .env
    echo ✅ 配置文件已创建
)

echo 第4步：启动服务...
echo ========================================
echo 🚀 后端服务启动中 (模拟模式)
echo 📍 服务地址：http://localhost:3000
echo 📍 区块链模式：开发模拟模式
echo ========================================
echo.
echo 💡 现在可以：
echo 1. 保持此窗口运行
echo 2. 打开微信开发者工具
echo 3. 导入 miniprogram 目录
echo 4. 体验区块链功能 (模拟模式)
echo.

npm run dev