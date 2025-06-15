# 属性系统重构计划

## 📋 重构目标

### 核心问题
1. **数据展示多态不统一**：节点模式和侧边栏模式使用不同组件和逻辑
2. **组件职责混乱**：form-outputs 承担过多职责，逻辑复杂
3. **重复代码**：数据转换逻辑在多处重复
4. **状态管理分散**：数据来源不一致，同步困难

### 重构目标
- ✅ **统一数据模型**：基于同一数据源进行多态展示
- ✅ **简化组件逻辑**：清晰的职责分离
- ✅ **消除重复代码**：统一的数据处理和转换
- ✅ **优化性能**：减少不必要的重新渲染

## 🏗️ 重构架构设计

### 新架构分层

```
┌─────────────────────────────────────────┐
│           业务组件层                      │
│  FormOutputs, FormEntityProperties      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           管理组件层                      │
│      PropertyDisplayManager             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           展示组件层                      │
│         PropertyTable                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           数据管理层                      │
│       PropertyDataManager               │
└─────────────────────────────────────────┘
```

### 核心组件设计

#### 1. PropertyDataManager（数据管理层）
```typescript
interface PropertyDataManager {
  // 数据转换
  fromJsonSchema(schema: IJsonSchema): PropertyData[]
  fromEntityAttributes(attributes: Attribute[]): PropertyData[]
  fromModuleAttributes(attributes: ModuleAttribute[]): PropertyData[]

  // 数据过滤
  filterByType(properties: PropertyData[], type: PropertyType): PropertyData[]
  filterByMode(properties: PropertyData[], mode: DisplayMode): PropertyData[]

  // 数据分组
  groupByModule(properties: PropertyData[]): GroupedPropertyData
  groupByCategory(properties: PropertyData[]): GroupedPropertyData
}
```

#### 2. PropertyTable（展示组件层）
```typescript
interface PropertyTableProps {
  properties: PropertyData[]
  mode: 'node' | 'sidebar' | 'compact'
  editable?: boolean
  selectable?: boolean
  expandable?: boolean
  onEdit?: (property: PropertyData) => void
  onDelete?: (property: PropertyData) => void
  onSelect?: (properties: PropertyData[]) => void
}
```

#### 3. PropertyDisplayManager（管理组件层）
```typescript
interface PropertyDisplayManagerProps {
  dataSource: 'entity' | 'module' | 'schema'
  entityId?: string
  moduleId?: string
  schema?: IJsonSchema
  mode: 'node' | 'sidebar'
  filters?: PropertyFilter[]
  editable?: boolean
}
```

## 📅 重构阶段计划

### 阶段1：数据层统一（1-2天）

#### 1.1 创建统一数据模型
- [ ] 定义 `PropertyData` 标准接口
- [ ] 创建 `PropertyDataManager` 工具类
- [ ] 实现数据转换函数
- [ ] 添加单元测试

#### 1.2 创建数据过滤工具
- [ ] 实现属性类型过滤
- [ ] 实现显示模式过滤
- [ ] 实现属性分组功能
- [ ] 添加过滤器组合逻辑

**文件清单**：
```
src/utils/property-data-manager.ts
src/utils/property-filters.ts
src/utils/__tests__/property-data-manager.test.ts
```

### 阶段2：组件层重构（2-3天）

#### 2.1 创建统一展示组件
- [ ] 重构 `PropertyTable` 组件
- [ ] 支持多种显示模式
- [ ] 集成编辑功能
- [ ] 添加选择和展开功能

#### 2.2 创建管理组件
- [ ] 实现 `PropertyDisplayManager`
- [ ] 集成数据管理和展示
- [ ] 处理不同数据源
- [ ] 优化性能和缓存

**文件清单**：
```
src/components/ext/property-system/
├── PropertyTable.tsx
├── PropertyDisplayManager.tsx
├── types.ts
└── __tests__/
```

### 阶段3：表单组件简化（1-2天）

#### 3.1 重构 form-outputs
- [ ] 简化组件逻辑
- [ ] 使用新的 PropertyDisplayManager
- [ ] 移除重复代码
- [ ] 保持API兼容性

#### 3.2 整合其他表单组件
- [ ] 重构 form-entity-properties
- [ ] 重构 form-module-outputs
- [ ] 统一组件接口
- [ ] 更新文档

**文件清单**：
```
src/form-components/form-outputs/index.tsx (重构)
src/form-components/form-entity-properties/index.tsx (重构)
src/form-components/form-module-outputs/index.tsx (重构)
```

### 阶段4：状态管理优化（1天）

#### 4.1 优化数据同步
- [ ] 确保 store 和 Field 数据一致性
- [ ] 添加数据变更监听
- [ ] 优化重新渲染逻辑
- [ ] 添加错误处理

#### 4.2 性能优化
- [ ] 添加必要的 memo 和 callback
- [ ] 优化大数据量渲染
- [ ] 添加虚拟滚动（如需要）
- [ ] 性能测试和优化

## 🔧 实现细节

### 统一数据接口

```typescript
// 标准属性数据接口
export interface PropertyData {
  key: string                    // 唯一标识
  id: string                     // 属性ID
  name: string                   // 显示名称
  type: string                   // 数据类型
  description?: string           // 描述
  required?: boolean             // 是否必需
  readonly?: boolean             // 是否只读
  category?: PropertyCategory    // 属性分类
  source?: PropertySource        // 数据来源
  meta?: Record<string, any>     // 元数据
}

export type PropertyCategory = 'entity' | 'module' | 'system' | 'custom'
export type PropertySource = 'store' | 'schema' | 'computed'
export type DisplayMode = 'node' | 'sidebar' | 'compact' | 'detailed'
```

### 数据转换策略

```typescript
export class PropertyDataManager {
  // 从不同数据源转换为统一格式
  static fromEntityAttributes(attributes: Attribute[]): PropertyData[] {
    return attributes.map(attr => ({
      key: attr._indexId,
      id: attr.id,
      name: attr.name,
      type: attr.type,
      description: attr.description,
      category: 'entity',
      source: 'store',
      readonly: attr.isModuleProperty,
      meta: { ...attr }
    }))
  }

  static fromJsonSchema(schema: IJsonSchema): PropertyData[] {
    const properties = schema.properties || {}
    return Object.entries(properties).map(([key, prop]) => ({
      key: prop._indexId || key,
      id: prop.id || key,
      name: prop.name || prop.title || key,
      type: prop.type || 'string',
      description: prop.description,
      category: this.inferCategory(prop),
      source: 'schema',
      meta: { ...prop }
    }))
  }
}
```

### 组件使用示例

```typescript
// 新的使用方式
<PropertyDisplayManager
  dataSource="entity"
  entityId={currentEntityId}
  mode="sidebar"
  editable={true}
  filters={[
    { type: 'category', value: ['entity', 'custom'] },
    { type: 'readonly', value: false }
  ]}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// 或者直接使用底层组件
<PropertyTable
  properties={processedProperties}
  mode="node"
  editable={false}
  columns={['id', 'type']}
/>
```

## 🧪 测试策略

### 单元测试
- [ ] PropertyDataManager 数据转换测试
- [ ] PropertyTable 渲染测试
- [ ] PropertyDisplayManager 集成测试
- [ ] 过滤和分组功能测试

### 集成测试
- [ ] 表单组件重构后的功能测试
- [ ] 不同模式下的显示测试
- [ ] 数据同步一致性测试
- [ ] 性能基准测试

### 回归测试
- [ ] 确保现有功能不受影响
- [ ] API 兼容性测试
- [ ] 用户交互流程测试

## 📚 文档更新

### 组件文档
- [ ] PropertyTable 使用文档
- [ ] PropertyDisplayManager 配置文档
- [ ] 迁移指南
- [ ] 最佳实践

### 架构文档
- [ ] 新架构设计文档
- [ ] 数据流图更新
- [ ] 组件关系图
- [ ] 性能优化指南

## 🚀 迁移计划

### 向后兼容
- 保持现有组件API不变
- 逐步迁移到新组件
- 提供迁移工具和指南
- 设置废弃警告

### 迁移步骤
1. **并行开发**：新组件与旧组件并存
2. **逐步替换**：从非关键页面开始
3. **测试验证**：确保功能完整性
4. **清理代码**：移除旧组件和重复代码

## ⚠️ 风险评估

### 技术风险
- **数据同步**：新旧系统数据一致性
- **性能影响**：重构可能影响渲染性能
- **兼容性**：现有代码依赖可能破坏

### 缓解措施
- 充分的单元测试和集成测试
- 分阶段发布，及时发现问题
- 保留回滚方案
- 详细的代码审查

## 📊 成功指标

### 代码质量
- [ ] 代码重复率降低 50%
- [ ] 组件复杂度降低 30%
- [ ] 测试覆盖率达到 90%

### 性能指标
- [ ] 渲染时间不增加
- [ ] 内存使用优化
- [ ] 包大小不显著增加

### 开发体验
- [ ] 新功能开发时间减少
- [ ] Bug 修复时间减少
- [ ] 代码维护成本降低

---

**预计总工期**：5-8天
**参与人员**：前端开发工程师
**优先级**：高
**风险等级**：中等
