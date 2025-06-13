#!/bin/bash

# Mock数据更新脚本
# 从后台API获取最新数据并保存为mock文件

echo "🔄 开始更新Mock数据..."

# 检查后台服务是否可用
if ! curl -s http://localhost:9999/cm/module/ > /dev/null; then
    echo "❌ 后台服务不可用 (http://localhost:9999)"
    echo "请确保后台服务正在运行"
    exit 1
fi

# 创建mock数据目录
mkdir -p apps/demo-free-layout-forked/src/mock-data

echo "📥 获取模块数据..."
curl -s http://localhost:9999/cm/module/ > apps/demo-free-layout-forked/src/mock-data/modules.json

echo "📥 获取实体数据..."
curl -s http://localhost:9999/cm/entity/ > apps/demo-free-layout-forked/src/mock-data/entities.json

echo "📥 获取枚举数据..."
curl -s http://localhost:9999/cm/enum/ > apps/demo-free-layout-forked/src/mock-data/enums.json

echo "📥 获取函数行为数据..."
curl -s http://localhost:9999/hub/behaviors/ > apps/demo-free-layout-forked/src/mock-data/behaviors.json

echo "📥 获取工作流图数据..."
curl -s http://localhost:9999/hub/graphs/ > apps/demo-free-layout-forked/src/mock-data/graphs.json

# 显示文件大小统计
echo ""
echo "📊 Mock数据文件统计:"
ls -lh apps/demo-free-layout-forked/src/mock-data/*.json

# 显示数据条目统计
echo ""
echo "📈 数据条目统计:"
echo "模块数量: $(jq length apps/demo-free-layout-forked/src/mock-data/modules.json 2>/dev/null || echo "解析失败")"
echo "实体数量: $(jq length apps/demo-free-layout-forked/src/mock-data/entities.json 2>/dev/null || echo "解析失败")"
echo "函数行为数量: $(jq length apps/demo-free-layout-forked/src/mock-data/behaviors.json 2>/dev/null || echo "解析失败")"
echo "工作流图数量: $(jq length apps/demo-free-layout-forked/src/mock-data/graphs.json 2>/dev/null || echo "解析失败")"

# 检查枚举数据是否为错误对象
if jq -e '.reason' apps/demo-free-layout-forked/src/mock-data/enums.json > /dev/null 2>&1; then
    echo "枚举数据: ❌ 错误对象 (后台接口问题)"
else
    echo "枚举数量: $(jq length apps/demo-free-layout-forked/src/mock-data/enums.json 2>/dev/null || echo "解析失败")"
fi

echo ""
echo "✅ Mock数据更新完成!"
echo "�� 现在可以在离线环境下继续开发了"
