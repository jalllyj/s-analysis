#!/bin/bash

# 快速启动 ngrok 脚本

echo "🚀 正在启动 ngrok 内网穿透..."

# 检查是否已安装 ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ 未找到 ngrok"
    echo ""
    echo "请先安装 ngrok："
    echo "1. 访问 https://ngrok.com/"
    echo "2. 注册并下载 ngrok"
    echo "3. 解压到系统路径"
    echo ""
    echo "或者使用一键安装："
    echo "  macOS: brew install ngrok"
    echo "  Linux:  wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz && sudo tar xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin"
    exit 1
fi

# 启动 ngrok
echo "✅ 找到 ngrok，正在启动..."
echo ""
echo "请复制下方的 Forwarding 地址（以 https:// 开头）"
echo "然后将这个地址添加到 .env.local 文件中："
echo "NEXT_PUBLIC_APP_URL=https://你的ngrok地址"
echo ""
echo "按 Ctrl+C 停止 ngrok"
echo ""

ngrok http 5000
