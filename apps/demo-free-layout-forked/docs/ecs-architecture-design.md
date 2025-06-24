# ECS架构设计文档

## 概述
将传统的实体-行为模式重构为ECS（Entity Component System）架构，提高系统的灵活性和可扩展性。

## 架构对比

### 原有架构
```
实体 (Entity) -> 行为树 (Behavior Tree)
- 一对一关联
- 实体ID = 工作流图ID
- Start节点绑定实体
```

### 新ECS架构
```
模块 (Module/Component) -> 系统 (System/Workflow)
- 多对多关联
- 工作流独立命名
- Start节点关联多个模块
```

## 数据结构设计

### 1. 工作流数据结构 (新增)
```typescript
interface WorkflowSystem {
  _indexId: string;        // nanoid，React key专用
  id: string;              // 业务ID，如 "vehicle_control_system"
  name: string;            // 显示名称，如 "载具控制系统"
  description?: string;    // 描述
  moduleIds: string[];     // 关联的模块ID列表
  deprecated: boolean;     // 是否废弃

  // 工作流图数据
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  version: string;
}
```

### 2. 模块-工作流关联表 (新增)
```typescript
interface ModuleSystemMapping {
  moduleId: string;        // 模块ID
  systemId: string;        // 系统ID
  role: 'primary' | 'secondary'; // 主要/次要角色
  createdAt: string;
}
```

### 3. 新Start节点数据结构
```typescript
interface ModuleBasedStartNode {
  id: string;
  type: 'module-start';    // 新的节点类型
  data: {
    title: string;
    selectedModules: Array<{
      moduleId: string;
      moduleName: string;
      outputProperties: string[]; // 该模块输出的属性
    }>;
    // 每个模块作为一个输出端口
    outputs: Record<string, ModuleOutputSchema>;
  };
}
```

## 实施计划

### 阶段1：数据层改造
1. 创建工作流系统数据结构
2. 修改mock数据，添加工作流系统
3. 创建模块-系统关联关系
4. 更新数据访问接口

### 阶段2：Start节点改造
1. 创建module-start节点类型
2. 实现模块选择表单组件
3. 实现多模块输出逻辑
4. 保持向后兼容

### 阶段3：UI层改造
1. 工作流页面添加系统列表
2. 模块页面添加系统统计
3. 实现系统-模块关联管理
4. 添加跳转和创建功能

### 阶段4：整合测试
1. 数据流测试
2. UI功能测试
3. 性能测试
4. 兼容性测试

## 技术要点

### 1. 向后兼容策略
- 保留原有start节点作为legacy模式
- 新旧数据结构并存
- 渐进式迁移

### 2. 数据一致性
- 使用nanoid确保组件稳定性
- 实现数据同步机制
- 添加数据验证

### 3. 性能优化
- 懒加载工作流数据
- 缓存模块-系统关联
- 优化渲染性能

## 收益分析

### 1. 灵活性提升
- 支持多模块协作
- 系统可复用
- 模块可组合

### 2. 可维护性提升
- 职责分离清晰
- 代码结构优化
- 测试覆盖度提高

### 3. 扩展性提升
- 支持动态系统配置
- 支持系统模板
- 支持系统继承
