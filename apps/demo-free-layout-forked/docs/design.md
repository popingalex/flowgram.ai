# 实体行为树编辑器设计文档

## 一、系统概述

### 🎯 核心目标
- **实体属性编辑可视化**：支持实体基础属性、扩展属性、模块属性的可视化编辑
- **实体行为编辑可视化**：基于行为树模式的智能体行为逻辑编辑
- **当前开发重点**：展示系统中已有行为和属性配置调整，优化用户交互体验

### 🏗️ 技术架构
- **基础框架**：基于FlowGram.AI的Free Layout模式构建
- **组件集成**：作为独立Web应用，通过iframe方式嵌入Vue宿主系统
- **数据交互**：通过postMessage传递实体ID，编辑器内部独立完成数据加载和保存
- **工具链**：使用rush monorepo工具管理，支持Vue + React混合开发

## 二、存储架构 (Store Layer)

### 📊 数据存储分层

#### 2.1 实体管理存储
```typescript
// 实体列表管理 (entity-list.ts)
- useEntityListStore: 管理所有实体的列表状态
- useEntityList: 提供实体数据访问
- useEntityListActions: 提供实体CRUD操作
- 数据来源: /hub/entities API endpoint

// 当前实体编辑状态 (current-entity.store.ts)
- useCurrentEntityStore: 管理当前编辑实体的状态
- useCurrentEntity: 提供当前实体数据访问
- useCurrentEntityActions: 提供实体编辑操作
- 数据来源: 基于选中实体ID从entity-list获取，支持本地编辑缓存
```

#### 2.2 行为与工作流存储
```typescript
// 函数行为管理 (behavior.store.ts)
- useBehaviorStore: 管理后台解析的函数列表
- useBehaviorList: 提供函数行为数据访问
- useBehaviorActions: 提供函数行为操作
- 数据来源: /hub/behaviors API endpoint (Java静态函数解析)

// 工作流图管理 (graph.store.ts)
- useGraphStore: 管理行为树工作流图
- useGraphList: 提供工作流图数据访问
- useGraphActions: 提供工作流图操作
- 数据来源: /hub/entities/{id}/graph API endpoint (实体行为树数据)
```

#### 2.3 模块与枚举存储
```typescript
// 模块管理 (module.store.tsx)
- ModuleStoreProvider: 模块数据提供者
- 数据来源: /hub/modules API endpoint
- 模块编辑逻辑: 模块属性定义和编辑
- 模块关联逻辑: 实体与模块的关联关系管理
- 统一界面: 单个弹窗中切换"模块编辑"和"模块关联"功能

// 枚举类型管理 (enum-store)
- EnumStoreProvider: 枚举类型数据提供者
- 数据来源: /hub/enum-classes API endpoint
- 支持动态枚举创建和管理
```

### 🔄 数据同步机制
- **EntityWorkflowSyncer**: 实体与工作流数据同步组件
- **OptimizedEntityPropertySyncer**: 优化的实体属性同步器
- **实时状态管理**: 支持编辑状态跟踪(isDirty, isSaving)

## 三、组件架构 (Component Layer)

### 3.1 基础功能组件 (Basic Components)

#### 🎛️ 属性选择组件
```typescript
// 变量选择器 (variable-selector-ext)
- 支持实体基础属性、扩展属性选择
- 支持模块属性分组展示(TreeSelect)
- 支持全局上下文属性($context, $time, $entity等)

// 动态值输入 (dynamic-value-input-ext)
- 常量输入能力
- 变量引用能力
- 支持右值选择(常量/变量切换)

// 类型选择器 (type-selector-ext)
- 支持嵌套类型选择
- 支持枚举类型树形选择
- 类型：string, number, boolean, enum, list, object, unknown
```

#### 🔧 条件与行为组件
```typescript
// 条件行组件 (condition-row-ext)
- 左值(变量选择器) + 运算符 + 右值(值选择器)
- 支持多种比较运算符(EQUALS, CONTAINS, EMPTY, AMONG等)
- 支持逻辑取反和联合条件

// 行为选择器 (invoke-function-selector)
- 后台函数列表展示
- 支持命名空间和标签过滤
- 出入参数类型定义和绑定
```

#### 📝 选择器组件
```typescript
// 模块选择器 (module-selector)
- 模块列表展示和选择
- 模块属性预览
- 统一弹窗界面设计:
  * Tab1: 模块关联 - 管理实体与模块的关联关系
  * Tab2: 模块编辑 - 编辑模块属性定义
- 支持模块关联状态管理

// 枚举类别选择器 (enum-class-selector)
- 枚举类型选择
- 支持动态创建枚举
- 枚举项管理和验证
```

### 3.2 表单组件层 (Form Components)

#### 📋 属性编辑表单
```typescript
// 实体属性编辑 (properties-edit)
- PropertyEdit: 单个属性编辑器
- 支持属性名、类型、默认值编辑
- 支持属性删除和排序

// 实体元数据表单 (form-entity-metas)
- 实体基本信息编辑(id, name, description)
- 实体标签和统计信息

// 模块输出表单 (form-module-outputs)
- 模块属性展示和管理
- 模块关联状态管理
```

#### 🔗 输入输出管理
```typescript
// 表单输入 (form-inputs)
- 节点输入参数配置
- 参数类型验证和绑定

// 表单输出 (form-outputs)
- 节点输出结果配置
- 输出类型定义

// 值显示组件 (value-display)
- 属性值的格式化显示
- 支持不同类型的可视化展示
```

### 3.3 节点组件层 (Node Components)

#### 🌟 核心业务节点
```typescript
// 起始节点 (start/form-meta.tsx)
- 实体定义与属性配置核心
- 实体属性声明和初始值设置
- 模块化属性管理
- 智能体上下文配置

// 条件节点 (condition/form-meta.tsx)
- 逻辑判断和流程控制
- 属性与静态值/属性匹配
- 联合条件支持(All/Any/None/Neither)
- 行为索引兼容(order属性)

// 行为节点 (action/form-meta.tsx)
- 本地函数或远程服务调用
- 函数参数配置和类型绑定
- 服务平台集成
- 智能体间接交互支持
```

#### 🔄 流程控制节点
```typescript
// 阶段节点 (phase/phase-form-render.tsx)
- 行为树阶段管理
- 多行为协调执行
- 阶段间流转控制

// 结束节点 (end/form-meta.tsx)
- 工作流终止处理
- 结果汇总和输出

// 循环节点 (loop/loop-form-render.tsx)
- 循环逻辑支持(预留)
- 条件循环和计数循环
```

#### 💬 协作节点 (暂时搁置)
```typescript
// 会话节点/会话块 (ContractNode/ContractBlock) - 暂不实现
// 当前重点：展示系统中已有行为和属性配置调整
```

## 四、业务交互设计

### 🎮 用户交互流程

#### 4.1 实体编辑工作流
1. **实体选择**: 从实体列表选择或创建新实体
2. **属性配置**:
   - 基础属性编辑(id, name, description)
   - 扩展属性定义(自定义属性)
   - 模块属性关联(模块选择和属性继承)
3. **行为设计**:
   - 起始节点配置实体属性访问
   - 条件节点设置判断逻辑
   - 行为节点配置函数调用
   - 流程连线和执行顺序

#### 4.2 属性管理交互
- **智能属性选择**: 支持属性搜索、分类展示、上下文提示
- **类型安全**: 类型选择器提供类型约束和验证
- **模块化管理**: 通过模块选择器实现属性复用
- **枚举支持**: 动态创建和管理枚举类型

#### 4.3 行为编辑交互
- **函数发现**: 自动解析后台函数，提供搜索和分类
- **参数绑定**: 可视化参数配置，支持拖拽绑定
- **条件编辑**: 直观的条件表达式编辑器
- **流程可视化**: 基于FlowGram的流程图编辑体验

### 🔧 高级特性

#### 智能体上下文系统
- **内置属性访问**: $branch(分支), $time(时刻), $name(名称), $id(标识), $entity(实体引用)
- **动态上下文**: 运行时智能体信息和属性访问
- **跨实体交互**: 通过context访问其他智能体属性

#### 枚举类型管理
- **动态创建**: 编辑时即时创建枚举类型
- **引用管理**: 自动跟踪枚举项被引用情况
- **安全删除**: 删除前检查引用关系，防止数据不一致

#### 模块化扩展
- **属性继承**: 通过模块添加实现属性批量继承
- **双重逻辑分离**:
  * 模块编辑: 定义模块自身的属性和结构
  * 模块关联: 管理实体与模块之间的关联关系
- **统一交互界面**: 单个弹窗内Tab切换，提供一致的用户体验
- **版本管理**: 支持模块版本控制和更新

## 五、技术实现细节

### 🎨 UI组件库集成
- **Semi Design**: 基础UI组件库
- **样式系统**: styled-components + CSS模块化
- **图标系统**: @douyinfe/semi-icons
- **布局系统**: Layout + Grid响应式布局

### 🔄 状态管理模式
- **Zustand Store**: 轻量级状态管理
- **分层设计**: Store -> Hook -> Component
- **数据同步**: 实时状态同步和持久化
- **性能优化**: 选择性订阅和memo优化

### 🌐 API集成架构
- **后端API**: RESTful接口设计
- **数据转换**: 前后端数据格式适配
- **错误处理**: 统一错误处理和用户反馈
- **加载状态**: 细粒度加载状态管理

### 🧪 测试与调试
- **组件测试**: 单元测试和集成测试
- **E2E测试**: 端到端工作流测试
- **开发工具**: 调试面板和日志系统
- **模拟数据**: Mock数据支持离线开发

## 六、扩展规划

### 🚀 短期优化
- **性能优化**: 解决页面加载卡顿问题，优化数据处理逻辑冗余
- **用户体验**: 操作引导和错误提示优化
- **模块管理**: 完善模块编辑和模块关联的统一界面实现
- **功能重点**: 已有行为展示和属性配置调整的用户体验优化

### 🌟 长期规划
- **AI辅助**: 智能行为推荐和自动生成
- **协作编辑**: 多用户实时协作编辑
- **版本控制**: 实体和行为树版本管理
- **模板市场**: 行为模板分享和复用

## 七、部署与集成

### 📦 构建与部署
- **构建工具**: Rsbuild + TypeScript
- **代码质量**: ESLint + Prettier
- **包管理**: Rush monorepo管理
- **环境配置**: 开发/测试/生产环境分离

### 🔌 宿主系统集成
- **iframe嵌入**: 独立部署，iframe方式集成
- **消息通信**: postMessage API进行数据交换
- **样式隔离**: CSS作用域隔离，避免样式冲突
- **权限管理**: 集成宿主系统的用户权限体系

---

> **注**: 本设计文档基于当前代码实现整理，随着功能迭代会持续更新。重点关注可交互组件的用户体验和技术实现细节。
