@echo off
echo 初始化数据库...

cd /d "%~dp0..\database"

echo 运行数据库初始化脚本...
node init.js

echo 数据库初始化完成！
pause