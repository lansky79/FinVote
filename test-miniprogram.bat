@echo off
echo ========================================
echo 🔧 小程序启动问题诊断
echo ========================================

echo 第1步：检查文件结构...
if exist miniprogram\app.js (
    echo ✅ app.js 存在
) else (
    echo ❌ app.js 不存在
    goto :error
)

if exist miniprogram\app.json (
    echo ✅ app.json 存在
) else (
    echo ❌ app.json 不存在
    goto :error
)

if exist miniprogram\pages\index\index.js (
    echo ✅ 首页文件存在
) else (
    echo ❌ 首页文件不存在
    goto :error
)

echo.
echo 第2步：检查后端服务...
curl -s http://localhost:3000/api/user/ranking >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务未启动，请先运行：
    echo    cd server
    echo    npm run dev
    goto :error
) else (
    echo ✅ 后端服务正常
)

echo.
echo ✅ 诊断完成！现在可以：
echo 1. 打开微信开发者工具
echo 2. 导入 miniprogram 目录
echo 3. 选择"测试号"
echo 4. 点击"编译"
echo.
pause
exit /b 0

:error
echo.
echo ❌ 发现问题，请检查上述错误
pause
exit /b 1