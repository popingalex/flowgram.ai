# 树形结构重新设计文档

## 🎯 设计目标

根据用户需求，重新设计树形控制面板：
1. **默认展开**：树形组件默认展开所有分类
2. **一级分类**：实体、模块、系统作为一级节点直接显示
3. **分类控制**：支持对整个分类进行隐藏/高亮操作
4. **批量操作**：可以一次性控制某个分类下的所有节点

## ✅ 实现的功能

### 1. 新的树形结构

**修改前**：
```
📁 节点 (6)
  📁 实体 (2)
    🔵 直升机    [RadioGroup]
    🔵 坦克      [RadioGroup]
  📁 模块 (2)
    🟢 移动模块  [RadioGroup]
    🟢 容器模块  [RadioGroup]
  📁 系统 (3)
    🟡 推演系统  [RadioGroup]
    🟡 决策系统  [RadioGroup]
    🟡 监控系统  [RadioGroup]
📁 关系 (8)
  ...
```

**修改后**：
```
📁 实体 (2)        [RadioGroup]
  🔵 直升机        [RadioGroup]
  🔵 坦克          [RadioGroup]
📁 模块 (2)        [RadioGroup]
  🟢 移动模块      [RadioGroup]
  🟢 容器模块      [RadioGroup]
📁 系统 (3)        [RadioGroup]
  🟡 推演系统      [RadioGroup]
  🟡 决策系统      [RadioGroup]
  🟡 监控系统      [RadioGroup]
```

### 2. 分类级别控制

**新增功能**：
- **分类隐藏**：隐藏"实体"分类，所有实体节点不显示
- **分类高亮**：高亮"模块"分类，所有模块节点及相关边高亮
- **组合使用**：可以隐藏实体，只查看模块和系统的关系

**控制逻辑**：
```typescript
// 分类状态管理
const [categoryStates, setCategoryStates] = useState<
  Record<string, 'visible' | 'hidden' | 'highlighted'>
>({});

// 节点可见性 = 分类可见性 && 节点可见性
const categoryVisible = categoryStates['实体'] !== 'hidden';
const nodeVisible = nodeStates[nodeId] !== 'hidden';
const finalVisible = categoryVisible && nodeVisible;

// 节点高亮 = 节点高亮 || 分类高亮
const finalHighlighted = nodeStates[nodeId] === 'highlighted' ||
                        categoryStates['实体'] === 'highlighted';
```

### 3. 默认展开设置

**技术实现**：
```typescript
// 默认展开所有分类
const [expandedKeys, setExpandedKeys] = useState<string[]>(['实体', '模块', '系统']);
```

**用户体验**：
- 打开页面时所有分类自动展开
- 用户可以立即看到所有节点
- 减少点击操作，提高效率

### 4. 双层控制体系

#### 分类级控制（一级节点）
- **控制范围**：影响整个分类下的所有节点
- **优先级**：高于单个节点控制
- **使用场景**：快速过滤、批量操作

#### 节点级控制（二级节点）
- **控制范围**：只影响单个节点
- **前提条件**：分类必须可见
- **使用场景**：精细控制、个别调整

## 🎨 交互设计

### 1. 分类控制效果

#### 隐藏分类
```typescript
// 用户选择隐藏"实体"分类
categoryStates['实体'] = 'hidden';

// 结果：所有实体节点不显示，相关边也不显示
// 图表中只显示模块和系统节点
```

#### 高亮分类
```typescript
// 用户选择高亮"模块"分类
categoryStates['模块'] = 'highlighted';

// 结果：
// - 所有模块节点显示红色边框
// - 与模块相连的边和节点正常显示
// - 其他无关节点和边半透明显示
```

### 2. 组合使用场景

#### 场景1：只查看模块和系统
```typescript
categoryStates = {
  '实体': 'hidden',    // 隐藏所有实体
  '模块': 'visible',   // 显示所有模块
  '系统': 'visible'    // 显示所有系统
};
// 结果：图表中只显示模块和系统的关系
```

#### 场景2：突出显示系统架构
```typescript
categoryStates = {
  '实体': 'visible',      // 正常显示实体
  '模块': 'visible',      // 正常显示模块
  '系统': 'highlighted'   // 高亮显示系统
};
// 结果：系统节点高亮，相关连接突出显示
```

#### 场景3：专注分析某个实体
```typescript
nodeStates = {
  'entity_helicopter': 'highlighted'  // 高亮特定实体
};
categoryStates = {
  '模块': 'visible',   // 只显示相关模块
  '系统': 'hidden'     // 隐藏系统节点
};
// 结果：专注显示该实体与模块的关系
```

## 🔧 技术实现

### 1. 状态管理架构

```typescript
// 双层状态管理
const [nodeStates, setNodeStates] = useState<Record<string, 'visible' | 'hidden' | 'highlighted'>>({});
const [categoryStates, setCategoryStates] = useState<Record<string, 'visible' | 'hidden' | 'highlighted'>>({});

// 分类控制函数
const handleCategoryStateChange = useCallback((category: string, newState: 'visible' | 'hidden' | 'highlighted') => {
  setCategoryStates(prev => ({ ...prev, [category]: newState }));
}, []);
```

### 2. 可见性计算逻辑

```typescript
// 节点最终可见性 = 分类可见性 && 节点可见性
const categoryVisible = categoryStates[category] !== 'hidden';
const nodeVisible = nodeStates[nodeId] !== 'hidden';
const finalVisible = categoryVisible && nodeVisible;

// 节点最终高亮 = 节点高亮 || 分类高亮
const finalHighlighted = nodeStates[nodeId] === 'highlighted' ||
                        categoryStates[category] === 'highlighted';
```

### 3. 树形数据结构

```typescript
// 分类作为一级节点
const finalTreeData = categories.map(category => ({
  key: category,
  label: (
    <div>
      <span>{category} ({nodes.length})</span>
      <RadioGroup value={categoryStates[category] || 'visible'}>
        <Radio value="visible">显示</Radio>
        <Radio value="hidden">隐藏</Radio>
        <Radio value="highlighted">高亮</Radio>
      </RadioGroup>
    </div>
  ),
  children: nodes.map(node => ({
    key: `node_${node.id}`,
    label: <NodeControl node={node} />,
    isLeaf: true
  }))
}));
```

## 📊 优势对比

| 方面 | 修改前 | 修改后 |
|------|--------|--------|
| **树形层级** | 3层嵌套 | 2层扁平 |
| **默认状态** | 需要手动展开 | 自动展开 |
| **控制粒度** | 只能单个节点 | 分类+节点双层 |
| **批量操作** | 不支持 | 支持分类级操作 |
| **视觉层次** | 不够清晰 | 分类明确 |
| **操作效率** | 需要多次点击 | 一次操作批量控制 |

## 🎯 使用场景

### 1. 系统架构分析
- **隐藏实体**：专注查看系统和模块的技术架构
- **高亮系统**：突出显示系统层面的设计
- **逐层分析**：分别查看不同层次的关系

### 2. 业务流程梳理
- **隐藏系统**：专注业务实体和功能模块
- **高亮实体**：突出核心业务对象
- **关系追踪**：跟踪业务流程中的数据流

### 3. 演示和汇报
- **分步展示**：先显示实体，再显示模块，最后显示系统
- **重点突出**：高亮关键组件和关系
- **简化视图**：隐藏无关元素，专注核心内容

## ✅ 验证检查

- [x] 树形组件默认展开所有分类
- [x] 实体、模块、系统作为一级节点
- [x] 分类支持显示/隐藏/高亮控制
- [x] 分类状态影响下属所有节点
- [x] 节点状态在分类可见前提下生效
- [x] 高亮逻辑支持分类级和节点级
- [x] 批量操作功能正常工作
- [x] 界面布局清晰美观
- [x] 交互响应流畅

新的树形结构设计大大提升了用户体验和操作效率！
