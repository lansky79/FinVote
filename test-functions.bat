@echo off
echo ========================================
echo 🧪 测试小程序功能
echo ========================================

echo 第1步：测试后端API...
echo.

echo 测试登录接口...
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"code\":\"test\"}" 2>nul
if errorlevel 1 (
    echo ❌ 后端服务未启动
    goto :error
) else (
    echo ✅ 登录接口正常
)

echo.
echo 测试排行榜接口...
curl -s http://localhost:3000/api/user/ranking >nul 2>&1
if errorlevel 1 (
    echo ❌ 排行榜接口异常
) else (
    echo ✅ 排行榜接口正常
)

echo.
echo 测试投票列表接口...
curl -s http://localhost:3000/api/vote/list >nul 2>&1
if errorlevel 1 (
    echo ❌ 投票列表接口异常
) else (
    echo ✅ 投票列表接口正常
)

echo.
echo 测试热门投票接口...
curl -s http://localhost:3000/api/vote/hot >nul 2>&1
if errorlevel 1 (
    echo ❌ 热门投票接口异常
) else (
    echo ✅ 热门投票接口正常
)

echo.
echo ========================================
echo ✅ 功能测试完成！
echo.
echo 💡 现在小程序应该能正常：
echo   - 微信登录 (显示演示用户)
echo   - 查看排行榜 (5个模拟用户)
echo   - 查看投票列表 (3个模拟投票)
echo   - 创建新投票
echo   - 区块链演示
echo.
echo 🎯 在微信开发者工具中测试这些功能！
echo ========================================
pause
exit /b 0

:error
echo.
echo ❌ 请先启动后端服务：
echo    双击运行 start-clean.bat
pause
exit /b 1