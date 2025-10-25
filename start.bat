@echo off
echo ========================================
echo 启动股票投票区块链小程序
echo ========================================

echo.
echo 第1步：检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未安装Node.js，请先安装Node.js 16.0+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境正常

echo.
echo 第2步：安装依赖包...
cd server
if not exist node_modules (
    echo 正在安装依赖包，请稍候...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败，尝试使用国内镜像...
        npm config set registry https://registry.npmmirror.com
        npm install
    )
)

echo ✅ 依赖包安装完成

echo.
echo 第3步：检查配置文件...
if not exist .env (
    echo 创建配置文件...
    copy .env.example .env
    echo ✅ 配置文件已创建，使用默认配置
) else (
    echo ✅ 配置文件已存在
)

echo.
echo 第4步：启动后端服务...
echo ========================================
echo 🚀 后端服务启动中...
echo 📍 服务地址：http://localhost:3000
echo 📍 API地址：http://localhost:3000/api
echo ========================================
echo.
echo 💡 接下来请：
echo 1. 保持此窗口运行
echo 2. 打开微信开发者工具
echo 3. 导入 miniprogram 目录
echo 4. 开始体验区块链功能！
echo.

npm run dev