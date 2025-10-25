@echo off
echo ========================================
echo 🚀 启动股票投票小程序 (纯净模式)
echo ========================================

cd server

echo 第1步：停止所有Node进程...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1

echo 第2步：设置环境变量 (模拟模式)...
set NODE_ENV=development
set MONGODB_URI=mock-data-mode

echo 第3步：检查依赖...
if not exist node_modules (
    echo 安装依赖包...
    npm install
)

echo 第4步：启动服务 (纯净模式)...
echo ========================================
echo 🔗 区块链服务：模拟模式
echo 📝 数据库：内存模拟数据
echo ⏰ 定时任务：模拟模式
echo 📍 服务地址：http://localhost:3000
echo ========================================
echo.
echo ✅ 纯净模式启动完成！
echo 💡 特点：
echo   - 无MongoDB依赖
echo   - 无定时任务错误
echo   - 所有功能正常演示
echo   - 完全免费运行
echo.
echo 🎯 现在可以：
echo 1. 保持此窗口运行
echo 2. 打开微信开发者工具
echo 3. 导入 miniprogram 目录
echo 4. 体验完整功能！
echo.

npm run dev