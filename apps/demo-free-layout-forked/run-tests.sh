#!/bin/bash

# 实体管理页面 E2E 测试运行脚本

echo "🚀 开始运行实体管理页面 E2E 测试"

# 检查是否在正确的目录
if [ ! -f "playwright.config.ts" ]; then
    echo "❌ 错误：请在 apps/demo-free-layout-forked 目录下运行此脚本"
    exit 1
fi

# 检查开发服务器是否运行
echo "🔍 检查开发服务器状态..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  开发服务器未运行，请先启动服务器："
    echo "   rush dev:demo-free-layout-forked"
    echo ""
    echo "或者使用以下命令启动服务器并运行测试："
    echo "   npm run test:e2e"
    exit 1
fi

echo "✅ 开发服务器运行正常"

# 运行测试
echo "🧪 开始运行测试..."

if [ "$1" = "--headed" ]; then
    echo "🖥️  运行有界面模式测试"
    npx playwright test --headed
elif [ "$1" = "--ui" ]; then
    echo "🎨 启动 Playwright UI 模式"
    npx playwright test --ui
elif [ "$1" = "--debug" ]; then
    echo "🐛 启动调试模式"
    npx playwright test --debug
else
    echo "🤖 运行无头模式测试"
    npx playwright test
fi

echo "🎉 测试完成！"
