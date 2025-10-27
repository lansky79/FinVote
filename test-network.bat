@echo off
echo ========================================
echo 🌐 测试网络连通性
echo ========================================

set LOCAL_IP=192.168.0.61

echo 本机IP地址: %LOCAL_IP%
echo 后端服务地址: http://%LOCAL_IP%:3000
echo.

echo 第1步：测试本地连接...
curl -s http://localhost:3000/api/user/ranking >nul 2>&1
if errorlevel 1 (
    echo ❌ 本地后端服务未启动
    echo 请先运行: start-clean.bat
    goto :error
) else (
    echo ✅ 本地后端服务正常
)

echo.
echo 第2步：测试IP地址连接...
curl -s http://%LOCAL_IP%:3000/api/user/ranking >nul 2>&1
if errorlevel 1 (
    echo ❌ IP地址连接失败，可能是防火墙问题
    echo 💡 解决方案：
    echo    1. 关闭Windows防火墙
    echo    2. 或添加端口3000到防火墙例外
    goto :error
) else (
    echo ✅ IP地址连接正常
)

echo.
echo 第3步：显示测试URL...
echo 📱 手机测试地址：
echo    http://%LOCAL_IP%:3000/api/user/ranking
echo.
echo 💡 在手机浏览器中访问上述地址
echo    如果能看到JSON数据，说明网络正常
echo    然后就可以在微信开发者工具中点击"预览"
echo.

echo ========================================
echo ✅ 网络配置完成！
echo.
echo 🎯 下一步：
echo 1. 确保后端服务运行中
echo 2. 在微信开发者工具中点击"预览"
echo 3. 用手机微信扫码
echo 4. 在手机上体验完整功能！
echo ========================================
pause
exit /b 0

:error
echo.
echo ❌ 网络配置失败，请检查上述问题
pause
exit /b 1