# ECS架构实现 - 实体过滤器与系统行为节点

## 概述

基于用户需求，我们实现了ECS（Entity Component System）架构的核心组件：
- **实体过滤器节点**：根据模块类型和属性条件过滤实体，返回实体集合
- **系统行为节点**：接收多个实体集合作为输入，执行系统级函数

## 1. Flowgram无头工作流支持分析

### 现状
- **运行时验证**：`WorkflowRuntimeValidation`中的TODO显示计划检查start节点，但当前返回`valid: true`
- **运行时执行**：`WorkflowRuntimeEngine.process()`依赖`context.document.start`作为执行入口
- **编辑器限制**：start节点标记为`deleteDisable: true`，无法删除

### 结论
Flowgram原则上支持无头工作流，但需要修改运行时引擎的执行逻辑，或创建虚拟start节点。

## 2. 实体过滤器节点 (EntityFilter)

### 功能特性
- **模块过滤**：选择实体必须包含的模块类型
- **属性过滤**：基于属性ID、操作符和值进行精确过滤
- **输出**：返回符合条件的实体集合

### 配置选项
```typescript
interface EntityFilterData {
  moduleIds: string[];           // 必需模块ID列表
  attributeFilters: Array<{
    attributeId: string;         // 属性ID
    operator: 'equals' | 'notEquals' | 'contains' | 'exists';
    value: string;               // 过滤值
  }>;
}
```

### 使用场景
- 过滤具有"移动"模块的所有实体
- 查找状态为"空闲"的工作单位
- 筛选血量低于阈值的战斗单位

## 3. 系统行为节点 (SystemAction)

### 功能特性
- **函数选择**：从预定义的系统函数库中选择
- **多输入端口**：支持多个实体集合和参数输入
- **动态端口映射**：将函数参数映射到输入端口

### 预定义函数示例
```typescript
const systemFunctions = [
  {
    id: 'moveEntities',
    name: '移动实体',
    parameters: [
      { name: 'entities', type: 'EntitySet' },
      { name: 'targetPosition', type: 'Vector3' },
      { name: 'speed', type: 'number' }
    ]
  },
  {
    id: 'executeTask',
    name: '执行任务',
    parameters: [
      { name: 'workers', type: 'EntitySet' },
      { name: 'taskType', type: 'string' },
      { name: 'priority', type: 'number' }
    ]
  }
];
```

### 端口配置
```typescript
interface InputPortMapping {
  portId: string;              // 端口标识
  parameterName: string;       // 对应的函数参数名
  sourceType: 'entitySet' | 'value' | 'variable';
  constantValue?: string;      // 常量值（当sourceType为'value'时）
}
```

## 4. ECS工作流设计模式

### 典型工作流结构
```
[实体过滤器1] → [系统行为节点] → [输出]
[实体过滤器2] ↗
```

### 示例：战斗系统
1. **实体过滤器A**：筛选所有敌方单位
2. **实体过滤器B**：筛选我方攻击单位
3. **系统行为节点**：执行"战斗交互"函数，输入两个实体集合

### 示例：资源收集系统
1. **实体过滤器A**：筛选空闲的工人单位
2. **实体过滤器B**：筛选附近的资源点
3. **系统行为节点**：执行"分配收集任务"函数

## 5. 技术实现要点

### 表单组件
- 使用`Field`和`FieldArray`组件处理动态表单数据
- 通过`FormItem`组件统一布局和类型标识
- 支持类型安全的数据绑定和验证

### 节点注册
```typescript
// 在 src/nodes/constants.ts 中添加新类型
export enum WorkflowNodeType {
  EntityFilter = 'entity-filter',
  SystemAction = 'system-action',
}

// 在 src/nodes/index.ts 中注册节点
export const nodeRegistries: FlowNodeRegistry[] = [
  // ... 其他节点
  EntityFilterNodeRegistry,
  SystemActionNodeRegistry,
];
```

### 数据结构扩展
- 保持与现有`FlowNodeJSON`接口的兼容性
- 通过`data`字段扩展节点特定的配置数据
- 支持运行时的类型验证和错误处理

## 6. 下一步计划

1. **运行时集成**：实现实体过滤和系统函数的实际执行逻辑
2. **函数库扩展**：接入真实的行为函数API
3. **可视化增强**：为不同类型的端口添加视觉标识
4. **性能优化**：实现实体集合的高效过滤和传递机制
5. **无头工作流**：完善无start节点的工作流执行支持

## 7. 文件结构

```
src/nodes/
├── entity-filter/
│   ├── index.ts           # 节点注册器
│   └── form-meta.tsx      # 表单配置
├── system-action/
│   ├── index.ts           # 节点注册器
│   └── form-meta.tsx      # 表单配置
├── constants.ts           # 节点类型定义
└── index.ts              # 节点导出
```

这一实现为ECS架构在Flowgram中的应用奠定了基础，支持更灵活和高效的实体-组件-系统工作流设计。
