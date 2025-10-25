@echo off
echo ========================================
echo 📱 设置手机预览
echo ========================================

echo 第1步：获取本机IP地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)

:found
echo 本机IP地址: %LOCAL_IP%

echo.
echo 第2步：配置说明...
echo 💡 要在手机上预览，需要修改小程序配置：
echo.
echo 1. 打开 miniprogram/app.js
echo 2. 找到 serverUrl 配置
echo 3. 改为: 'http://%LOCAL_IP%:3000/api'
echo 4. 在微信开发者工具中点击"预览"
echo 5. 用手机微信扫码即可
echo.
echo ⚠️  注意事项：
echo - 手机和电脑必须在同一WiFi网络
echo - 确保电脑防火墙允许3000端口
echo - 后端服务必须保持运行
echo.
echo 第3步：测试网络连通性...
echo 在手机浏览器中访问: http://%LOCAL_IP%:3000/api/user/ranking
echo 如果能看到JSON数据，说明网络正常
echo.
pause