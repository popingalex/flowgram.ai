#!/bin/bash

# 统一数据同步脚本 - 更新唯一的数据源目录
# 支持Expression格式，已完成数据整合

set -e

echo "🔄 开始同步统一数据源..."

# 检查后端服务状态
BACKEND_URL="http://localhost:9999"
if ! curl -s "$BACKEND_URL/hub/behaviors/" > /dev/null; then
    echo "❌ 后端服务未启动，请先启动：mvn spring-boot:run"
    exit 1
fi

# 唯一的数据目录
MOCK_DIR="apps/demo-free-layout-forked/src/mock-data"

echo "📁 统一数据目录: $MOCK_DIR"

# 1. 更新behaviors数据 (Expression格式)
echo "🔄 同步behaviors数据..."
curl -s "$BACKEND_URL/hub/behaviors/" | jq '.' > "$MOCK_DIR/behaviors.json"
BEHAVIOR_COUNT=$(jq length "$MOCK_DIR/behaviors.json")
echo "✅ behaviors.json: $BEHAVIOR_COUNT 个函数"

# 2. 更新graphs数据
echo "🔄 同步graphs数据..."
curl -s "$BACKEND_URL/hub/graphs/" | jq '.' > "$MOCK_DIR/graphs.json"
GRAPH_COUNT=$(jq length "$MOCK_DIR/graphs.json")
echo "✅ graphs.json: $GRAPH_COUNT 个图"

# 3. 验证数据格式
echo "🔍 验证数据格式..."

# 检查behaviors是否为Expression格式
FIRST_BEHAVIOR=$(jq '.[0]' "$MOCK_DIR/behaviors.json")
if echo "$FIRST_BEHAVIOR" | jq -e '.inputs and .output and (.params | not) and (.returns | not)' > /dev/null; then
    echo "✅ behaviors.json: Expression格式正确"
else
    echo "❌ behaviors.json: 格式错误，应为Expression格式"
    exit 1
fi

# 4. 更新统计信息
echo "📊 数据统计:"
echo "  - Functions: $BEHAVIOR_COUNT (Expression格式)"
echo "  - Graphs: $GRAPH_COUNT"
echo "  - 数据目录: 1个 (已整合)"
echo "  - 最后更新: $(date)"

echo "🎉 统一数据源同步完成！"

# 5. 显示示例数据
echo ""
echo "📋 示例函数数据:"
jq '.[0] | {id, name, desc, inputs: .inputs | length, output: .output.desc}' "$MOCK_DIR/behaviors.json"

echo ""
echo "📋 可用的实体图:"
jq '.[].id' "$MOCK_DIR/graphs.json" | head -10

echo ""
echo "✨ 数据整合优势:"
echo "  - 单一数据源，避免重复"
echo "  - 自动同步，保持一致"
echo "  - 便捷查询，简化使用"
