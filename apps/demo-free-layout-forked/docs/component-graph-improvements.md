# 组件关系图优化改进文档

## 🎯 本次改进目标

根据用户反馈，对组件关系图进行以下优化：
1. **完全去掉关系标签**：关系线上不显示任何文字
2. **改进控制界面**：将分散的按钮和复选框改为统一的RadioGroup控件
3. **实现智能高亮**：类似ECharts的adjacency focus功能

## ✅ 完成的改进

### 1. 关系标签完全移除

**修改前**：
- 关系线上显示"包含"、"使用"等标签文字
- 影响图表视觉简洁性

**修改后**：
```typescript
label: {
  show: false, // 完全不显示关系标签
},
```

**效果**：
- ✅ 图表更简洁清爽
- ✅ 关系线只保留连接功能
- ✅ 减少视觉干扰

### 2. 智能高亮功能实现

**功能描述**：
当用户选择高亮某个节点时，实现类似ECharts `focus: 'adjacency'` 的效果：
- 高亮节点本身正常显示（红色边框）
- 与高亮节点直接相连的节点和边正常显示
- 其他无关节点和边变为半透明（opacity: 0.3）

**技术实现**：
```typescript
// 计算相邻关系
const highlightedNodes = visibleNodes.filter((node) => node.highlighted);
let adjacentNodeIds = new Set<string>();
let adjacentEdgeKeys = new Set<string>();

if (highlightedNodes.length > 0) {
  highlightedNodes.forEach((highlightedNode) => {
    adjacentNodeIds.add(highlightedNode.id);

    visibleEdges.forEach((edge) => {
      if (edge.source === highlightedNode.id) {
        adjacentNodeIds.add(edge.target);
        adjacentEdgeKeys.add(`${edge.source}_${edge.target}`);
      } else if (edge.target === highlightedNode.id) {
        adjacentNodeIds.add(edge.source);
        adjacentEdgeKeys.add(`${edge.source}_${edge.target}`);
      }
    });
  });
}

// 应用透明度效果
const opacity = hasHighlightedNodes && !isAdjacent ? 0.3 : 1;
```

**高亮逻辑**：
- 🔴 **高亮节点**：红色边框，正常透明度
- 🟢 **相邻节点**：正常颜色，正常透明度
- 🔗 **相邻边**：正常颜色，正常透明度
- 🌫️ **无关元素**：半透明显示（opacity: 0.3）

### 3. 控制界面重新设计

#### 状态管理重构

**修改前**：
```typescript
// 分散的状态管理
const [nodeVisibility, setNodeVisibility] = useState<Record<string, boolean>>({});
const [nodeHighlight, setNodeHighlight] = useState<Record<string, boolean>>({});
const [edgeVisibility, setEdgeVisibility] = useState<Record<string, boolean>>({});
const [edgeHighlight, setEdgeHighlight] = useState<Record<string, boolean>>({});
```

**修改后**：
```typescript
// 统一的状态管理
const [nodeStates, setNodeStates] = useState<Record<string, 'visible' | 'hidden' | 'highlighted'>>({});
const [edgeStates, setEdgeStates] = useState<Record<string, 'visible' | 'hidden' | 'highlighted'>>({});
```

#### 控制组件重新设计

**修改前**：
```typescript
// 分散的按钮和复选框
<Space spacing={4}>
  <Button icon={node.visible ? <IconEyeOpened /> : <IconEyeClosed />} />
  <Checkbox checked={node.highlighted} />
</Space>
```

**修改后**：
```typescript
// 统一的RadioGroup控件
<RadioGroup
  type="button"
  buttonSize="small"
  value={nodeStates[node.id] || 'visible'}
  onChange={(e) => handleNodeStateChange(node.id, e.target.value)}
>
  <Radio value="visible">显示</Radio>
  <Radio value="hidden">隐藏</Radio>
  <Radio value="highlighted">高亮</Radio>
</RadioGroup>
```

## 🎨 UI/UX 改进效果

### 1. 视觉效果提升
- **简洁性**：移除所有关系标签，图表更清爽
- **统一性**：所有控制元素使用相同的RadioGroup样式
- **聚焦性**：高亮功能帮助用户专注于特定节点及其关系

### 2. 交互体验优化
- **直观性**：用户可以直接看到当前状态和所有可选项
- **智能性**：高亮时自动突出相关元素，弱化无关元素
- **效率性**：一次点击即可切换到任何状态

### 3. 功能性增强
- **关系探索**：通过高亮功能轻松探索节点间的连接关系
- **视觉层次**：半透明效果创建清晰的视觉层次
- **专注模式**：高亮功能提供类似"专注模式"的体验

## 🔧 技术实现细节

### 高亮算法
```typescript
// 1. 找出所有高亮节点
const highlightedNodes = visibleNodes.filter((node) => node.highlighted);

// 2. 计算相邻节点和边
highlightedNodes.forEach((highlightedNode) => {
  adjacentNodeIds.add(highlightedNode.id);

  visibleEdges.forEach((edge) => {
    if (edge.source === highlightedNode.id || edge.target === highlightedNode.id) {
      adjacentNodeIds.add(edge.source);
      adjacentNodeIds.add(edge.target);
      adjacentEdgeKeys.add(`${edge.source}_${edge.target}`);
    }
  });
});

// 3. 应用透明度
const opacity = hasHighlightedNodes && !isAdjacent ? 0.3 : 1;
```

### 状态映射逻辑
```typescript
// 从新状态映射到图形属性
visible: nodeStates[nodeId] !== 'hidden',
highlighted: nodeStates[nodeId] === 'highlighted',
```

### RadioGroup配置
```typescript
<RadioGroup
  type="button"           // 使用按钮样式
  buttonSize="small"      // 小尺寸适合树形控件
  value={currentState}    // 当前状态值
  onChange={handleChange} // 状态变更处理
>
```

## 📊 改进前后对比

| 方面 | 改进前 | 改进后 |
|------|--------|--------|
| **关系标签** | 显示文字标签 | 完全不显示 |
| **高亮效果** | 只改变节点颜色 | 智能聚焦+半透明 |
| **控制元素** | 按钮+复选框 | RadioGroup |
| **状态数量** | 4个独立状态 | 2个统一状态 |
| **视觉层次** | 平面化显示 | 层次化聚焦 |
| **用户体验** | 需要多次点击 | 一次点击切换 |

## 🎯 高亮功能使用场景

### 1. 关系探索
- 选择一个实体节点高亮，查看它关联的所有模块
- 选择一个系统节点高亮，查看它使用的所有模块
- 快速理解复杂图表中的局部关系

### 2. 数据分析
- 分析某个核心节点的影响范围
- 识别孤立节点（无连接的节点）
- 发现关键连接点（连接度高的节点）

### 3. 演示展示
- 在演示时突出特定的业务流程
- 分步骤展示系统架构的不同部分
- 提供清晰的视觉焦点

## 🚀 未来扩展可能

基于新的设计，可以轻松添加更多功能：
- **多级高亮**：支持高亮距离N步的节点
- **路径高亮**：高亮两个节点间的最短路径
- **分组高亮**：同时高亮多个相关节点群组
- **动画效果**：高亮切换时的平滑过渡动画

## ✅ 验证检查

- [x] 关系标签完全移除
- [x] 智能高亮功能正常工作
- [x] 相邻元素正确识别
- [x] 半透明效果正确应用
- [x] RadioGroup正确显示三种状态
- [x] 状态切换功能正常
- [x] 图表渲染响应状态变化
- [x] 代码无TypeScript错误
- [x] 界面布局美观统一
- [x] 交互体验流畅直观

所有改进已完成，组件关系图现在具备专业级的高亮聚焦功能！
