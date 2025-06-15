# 实体属性管理组件设计文档

## 📋 概述

实体属性管理组件负责处理仿真系统中实体的属性定义、编辑和展示功能。这些组件实现了实体属性的完整生命周期管理。

## 🧩 组件架构

### 1. entity-property-tables 实体属性表格

#### 功能描述
- 统一展示实体的所有属性（基础属性、扩展属性、模块属性）
- 支持属性的增删改查操作
- 提供侧边栏编辑和节点内嵌展示两种模式

#### 核心文件
```
entity-property-tables/
├── index.tsx           # 组件导出
├── sidebar-editor.tsx  # 侧边栏编辑器
└── unified-display.tsx # 统一属性展示
```

#### 设计原则
- **数据分离**：基础属性、扩展属性、模块属性分类展示
- **编辑隔离**：只有扩展属性可编辑，模块属性只读
- **状态同步**：与 CurrentEntityStore 保持数据同步

#### API 接口
```typescript
interface PropertyData {
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
  _indexId: string;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
}

// 侧边栏编辑器
interface SidebarEditorProps {
  entity: Entity;
  onPropertyChange: (properties: Attribute[]) => void;
  readonly?: boolean;
}

// 统一展示组件
interface UnifiedDisplayProps {
  properties: PropertyData[];
  showModuleProperties?: boolean;
  groupByModule?: boolean;
}
```

### 2. entity-property-type-selector 属性类型选择器

#### 功能描述
- 提供属性类型选择界面（string, number, boolean, array, object）
- 支持枚举类型选择和配置
- 集成数据约束配置（长度、范围、格式等）

#### 核心文件
```
entity-property-type-selector/
├── index.tsx                    # 主选择器组件
├── constants.tsx               # 类型常量定义
├── data-restriction-modal.tsx  # 数据约束配置弹窗
├── enum-class-item.tsx         # 枚举类选项组件
├── enum-store.tsx              # 枚举类状态管理
└── module-store.tsx            # 模块状态管理
```

#### 设计原则
- **类型安全**：严格的 TypeScript 类型定义
- **扩展性**：支持自定义类型和约束
- **用户友好**：直观的类型选择界面

#### API 接口
```typescript
interface PropertyTypeConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  enumClassId?: string;
  restrictions?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
}

interface PropertyTypeSelectorProps {
  value: PropertyTypeConfig;
  onChange: (config: PropertyTypeConfig) => void;
  disabled?: boolean;
}
```

## 🔄 数据流设计

### 属性数据流向
```
后台API → EntityListStore → CurrentEntityStore → 属性组件 → 用户界面
                                     ↓
                              编辑状态管理 → 保存/撤销
```

### 状态管理
- **EntityListStore**：管理所有实体的原始数据
- **CurrentEntityStore**：管理当前编辑实体的副本
- **ModuleStore**：管理模块数据和模块属性
- **EnumStore**：管理枚举类数据

## 🎯 关键特性

### 1. nanoid 索引设计模式
- 使用 `_indexId` 作为 React key，确保组件稳定性
- 属性编辑时保持 nanoid 不变，避免组件重新渲染
- 详见：[实体属性编辑器设计文档](../../entity-properties-editor-design.mdc)

### 2. 属性分类逻辑
```typescript
// 实体基础属性
const metaProperties = ['id', 'name', 'description'];

// 实体扩展属性（可编辑）
const entityProperties = attributes.filter(attr =>
  attr.isEntityProperty && !attr.isModuleProperty
);

// 模块属性（只读）
const moduleProperties = attributes.filter(attr =>
  attr.isModuleProperty
);
```

### 3. 编辑权限控制
- **基础属性**：系统管理，不可编辑
- **扩展属性**：用户可自由编辑
- **完整模块属性**：继承自 bundles，不可编辑
- **部分模块属性**：单独添加，可删除

## 🧪 测试策略

### 单元测试
- 属性过滤逻辑测试
- 类型选择器功能测试
- 数据约束验证测试

### 集成测试
- 与 Store 的数据同步测试
- 编辑状态管理测试
- 保存/撤销功能测试

### 用户界面测试
- 属性表格交互测试
- 类型选择器界面测试
- 错误状态展示测试

## 📝 开发规范

### 组件设计原则
1. **单一职责**：每个组件只负责一个特定功能
2. **数据驱动**：组件状态完全由 props 和 Store 驱动
3. **类型安全**：严格的 TypeScript 类型定义
4. **可测试性**：组件逻辑易于单元测试

### 代码规范
- 使用 Semi Design 组件库
- 遵循 React Hooks 最佳实践
- 统一的错误处理和用户反馈
- 完整的 TypeScript 类型注解

## 🔮 未来规划

### 短期优化
- [ ] 添加属性批量操作功能
- [ ] 优化大量属性时的渲染性能
- [ ] 增强属性验证和约束功能

### 长期扩展
- [ ] 支持属性模板和预设
- [ ] 添加属性导入导出功能
- [ ] 支持属性的版本管理
- [ ] 增加属性使用统计和分析

## 📚 相关文档

- [业务架构文档](../business-architecture.md)
- [技术实现文档](../technical-implementation.md)
- [实体属性编辑器设计文档](../../entity-properties-editor-design.mdc)
- [nanoid 索引设计模式](../../entity-properties-editor-design.mdc#nanoid索引设计核心)
