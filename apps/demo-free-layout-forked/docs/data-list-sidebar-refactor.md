# DataListSidebar 泛型架构重构

## 🎯 重构目标

将原本硬编码的DataListSidebar组件重构为灵活的泛型组件，提供：
1. **最基础的数据结构** - 只包含必需字段
2. **泛型扩展能力** - 支持各种业务数据结构
3. **多种渲染方式** - 默认渲染、自定义函数、render props
4. **完整的类型安全** - TypeScript 严格类型检查

## 📊 数据结构设计

### 基础数据结构
```typescript
interface BaseDataItem {
  id: string;           // 业务ID
  _indexId: string;     // nanoid索引ID (React key)
}
```

### 扩展数据结构
```typescript
// 默认渲染字段
interface DefaultRenderFields {
  name?: string;        // 显示名称
  desc?: string;        // 描述
  bundles?: string[];   // 关联模块ID列表
  attributes?: any[];   // 属性列表
}

// 拖拽排序字段
interface DragSortFields {
  isNew?: boolean;      // 是否为新建项
  priority?: number;    // 优先级
}

// 完整默认数据项（向后兼容）
type DataListItem = BaseDataItem & DefaultRenderFields & DragSortFields & {
  [key: string]: any;
};
```

## 🎨 渲染方式

### 1. 默认渲染
```typescript
<DataListSidebar
  items={items}
  // ... 其他props
  renderMethod={{ type: 'default' }}
/>
```

**特性：**
- 自动显示 id、name、desc
- 自动渲染模块标签和统计信息
- 支持搜索高亮
- 支持拖拽排序

### 2. 自定义渲染函数
```typescript
<DataListSidebar
  items={items}
  renderMethod={{
    type: 'custom',
    render: ({ item, isSelected, index, searchText }: RenderContext<YourType>) => (
      <div>
        {/* 自定义渲染逻辑 */}
      </div>
    ),
  }}
/>
```

### 3. Render Props (Children)
```typescript
<DataListSidebar
  items={items}
  renderMethod={{
    type: 'children',
    children: ({ item, isSelected }: RenderContext<YourType>) => (
      <div>
        {/* 使用 children 函数渲染 */}
      </div>
    ),
  }}
/>
```

## 🔧 渲染上下文

所有自定义渲染方式都会接收到完整的渲染上下文：

```typescript
interface RenderContext<T extends BaseDataItem> {
  item: T;                    // 当前数据项
  isSelected: boolean;        // 是否选中
  index?: number;             // 在列表中的索引
  searchText: string;         // 当前搜索文本
  modules?: Array<...>;       // 模块数据（用于标签渲染）
  onItemSelect: (item: T) => void;  // 选择回调

  // 拖拽排序相关
  enableDragSort?: boolean;
  onDragSort?: (oldIndex: number, newIndex: number) => void;
  testId?: string;
  totalItems?: number;        // 列表总数
}
```

## 📝 使用示例

### 实体管理（使用默认渲染）
```typescript
interface EntityData extends BaseDataItem, DefaultRenderFields {
  entityType: string;
}

<DataListSidebar<EntityData>
  items={entities}
  renderMethod={{ type: 'default' }}
  // 自动处理 name、bundles、attributes 等字段
/>
```

### 行为管理（自定义渲染）
```typescript
interface BehaviorData extends BaseDataItem {
  desc: string;
  nodeCount: number;
  priority: number;
}

<DataListSidebar<BehaviorData>
  items={behaviors}
  renderMethod={{
    type: 'custom',
    render: ({ item, isSelected }) => (
      <div className={isSelected ? 'selected' : ''}>
        <div>{item.id}</div>
        <div>{item.desc}</div>
        <div>节点: {item.nodeCount}</div>
        <div>优先级: {item.priority}</div>
      </div>
    ),
  }}
/>
```

### 模块管理（Render Props）
```typescript
<DataListSidebar<ModuleData>
  items={modules}
  renderMethod={{
    type: 'children',
    children: ({ item, isSelected, searchText }) => (
      <CustomModuleItem
        module={item}
        selected={isSelected}
        highlight={searchText}
      />
    ),
  }}
/>
```

## 🔄 向后兼容

旧的 `renderItem` prop 仍然支持，但已标记为废弃：

```typescript
// ⚠️ 已废弃，但仍可用
<DataListSidebar
  items={items}
  renderItem={(item, isSelected, index) => <div>...</div>}
/>

// ✅ 推荐使用新方式
<DataListSidebar
  items={items}
  renderMethod={{
    type: 'custom',
    render: ({ item, isSelected, index }) => <div>...</div>,
  }}
/>
```

## 🎁 优势

### 1. 类型安全
- 完整的 TypeScript 类型推断
- 编译时错误检查
- 智能代码提示

### 2. 灵活性
- 支持任意数据结构扩展
- 三种渲染方式可选
- 完全可定制的UI

### 3. 可维护性
- 清晰的职责分离
- 统一的接口设计
- 易于测试和调试

### 4. 性能
- 基于React key的稳定渲染
- 支持虚拟化（未来扩展）
- 最小化重新渲染

## 🚀 迁移指南

### 步骤1：更新数据类型
```typescript
// 旧方式
interface OldData {
  id: string;
  name: string;
  // ... 其他字段
}

// 新方式
interface NewData extends BaseDataItem {
  name: string;
  // ... 其他字段
}
```

### 步骤2：更新渲染方式
```typescript
// 旧方式
<DataListSidebar
  renderItem={(item, isSelected) => <div>...</div>}
/>

// 新方式
<DataListSidebar
  renderMethod={{
    type: 'custom',
    render: ({ item, isSelected }) => <div>...</div>,
  }}
/>
```

### 步骤3：利用新特性
- 使用默认渲染减少代码量
- 利用 RenderContext 获取更多上下文信息
- 享受完整的类型安全

## 📋 已完成的页面迁移

- ✅ **行为管理** - 使用自定义渲染，支持优先级和拖拽排序
- ✅ **实体管理** - 使用默认渲染
- ✅ **模块管理** - 使用默认渲染

## 🔮 未来扩展

1. **虚拟化支持** - 大数据集性能优化
2. **更多内置渲染器** - 卡片式、表格式等
3. **主题定制** - 支持自定义样式主题
4. **无障碍支持** - ARIA 标签和键盘导航
5. **国际化** - 多语言支持
