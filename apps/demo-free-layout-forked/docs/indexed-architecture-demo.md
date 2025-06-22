# 基于索引的通用架构设计演示

## 🏗️ 架构层次

### 1. 基础接口层 (`types/indexed.ts`)
```typescript
// 基础索引接口
export interface Indexed {
  _indexId: string; // nanoid索引，用于React key和内部关联
}

// 编辑状态
export type EditStatus = 'saved' | 'modified' | 'new' | 'saving' | 'error';

// 可编辑的索引对象
export interface EditableIndexed extends Indexed {
  _status: EditStatus;
  _editStatus?: 'saving' | 'idle';
}

// 索引路径类型
export type IndexPath = string[]; // nanoid路径数组

// 验证函数类型
export type ValidationFunction = (
  value: any,
  allData: any[],
  indexPath: IndexPath,
  field: string
) => string;
```

### 2. 基础Store工具层 (`stores/base-indexed-store.ts`)
```typescript
// 基础Store状态
export interface BaseIndexedStoreState<T extends EditableIndexed> {
  items: T[];
  loading: boolean;
  error: string | null;
}

// 基础Store动作
export interface BaseIndexedStoreActions<T extends EditableIndexed> {
  loadItems: () => Promise<void>;
  updateField: (indexPath: IndexPath, field: string, value: any) => void;
  getItemByPath: (indexPath: IndexPath) => any;
  isItemDirty: (indexId: string) => boolean;
  // ... 其他通用方法
}

// 工具函数
export function addIndexToItem<T>(item: T): T & EditableIndexed;
export function findByPath<T>(items: T[], indexPath: IndexPath): any;
export function updateNestedField<T>(items: T[], indexPath: IndexPath, field: string, value: any): T[];
```

### 3. 具体Store实现层 (`stores/indexed-entity-store.ts`)
```typescript
// 实体特定接口
export interface Entity extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  attributes: EntityAttribute[];
  moduleIds: string[]; // 关联的模块_indexId数组
}

export interface EntityAttribute extends EditableIndexed {
  id: string;
  name: string;
  type: string;
  description?: string;
}

// 实体Store
export const useIndexedEntityStore = create<EntityStoreState & EntityStoreActions>((set, get) => ({
  // 继承基础Store的所有功能
  // 实现实体特定的业务逻辑

  updateEntityField: (entityIndexId, field, value) => {
    get().updateField([entityIndexId], field, value);
  },

  updateEntityAttribute: (entityIndexId, attributeIndexId, field, value) => {
    get().updateField([entityIndexId, attributeIndexId], field, value);
  },

  // ... 其他实体特定方法
}));
```

### 4. 通用组件层 (`components/indexed-input.tsx`)
```typescript
export interface IndexedInputProps<T extends EditableIndexed> {
  indexPath: IndexPath;
  field: string;
  useStore: () => BaseIndexedStoreState<T>;
  useActions: () => BaseIndexedStoreActions<T>;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  validation?: ValidationFunction;
}

export const IndexedInput = React.memo(({
  indexPath,
  field,
  useStore,
  useActions,
  // ... 其他props
}: IndexedInputProps<T>) => {
  const { items } = useStore();
  const { updateField } = useActions();

  // 根据路径查找目标对象
  const targetObject = findByPath(items, indexPath);
  const value = targetObject?.[field] || '';

  const handleChange = (newValue: string) => {
    updateField(indexPath, field, newValue);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      // ... 其他props
    />
  );
});
```

## 🎯 使用方式演示

### 实体列表页面使用
```typescript
// 实体ID输入
<IndexedInput
  indexPath={[entity._indexId]}
  field="id"
  useStore={useIndexedEntityState}
  useActions={useIndexedEntityActions}
  placeholder="实体ID"
  required={true}
  validation={createIndexedValidator('id', { entityName: '实体' })}
/>

// 实体属性ID输入
<IndexedInput
  indexPath={[entity._indexId, attribute._indexId]}
  field="id"
  useStore={useIndexedEntityState}
  useActions={useIndexedEntityActions}
  placeholder="属性ID"
  required={true}
  validation={createIndexedValidator('unique-parent', { entityName: '属性' })}
/>

// 实体属性名称输入
<IndexedInput
  indexPath={[entity._indexId, attribute._indexId]}
  field="name"
  useStore={useIndexedEntityState}
  useActions={useIndexedEntityActions}
  placeholder="属性名称"
  required={true}
  validation={createIndexedValidator('required')}
/>
```

### 模块列表页面使用
```typescript
// 模块ID输入
<IndexedInput
  indexPath={[module._indexId]}
  field="id"
  useStore={useIndexedModuleState}
  useActions={useIndexedModuleActions}
  placeholder="模块ID"
  required={true}
  validation={createIndexedValidator('id', { entityName: '模块' })}
/>

// 模块属性输入
<IndexedInput
  indexPath={[module._indexId, attribute._indexId]}
  field="name"
  useStore={useIndexedModuleState}
  useActions={useIndexedModuleActions}
  placeholder="模块属性名称"
  readonly={true} // 模块属性可能是只读的
/>
```

## ✅ 架构优势

### 1. 稳定的React Key
- 使用nanoid作为_indexId，永远不变
- 避免因业务ID变化导致的组件重新渲染
- 确保输入框焦点不会丢失

### 2. 统一的数据管理
- 所有数据类型都继承相同的基础接口
- 统一的状态管理和更新逻辑
- 一致的编辑状态跟踪

### 3. 通用的组件设计
- 一个组件支持所有数据类型的编辑
- 通过索引路径支持任意深度的嵌套
- 灵活的验证机制

### 4. 类型安全
- 完整的TypeScript类型支持
- 编译时错误检查
- 良好的IDE智能提示

### 5. 易于扩展
- 新增数据类型只需实现基础接口
- 新增字段类型只需扩展验证函数
- 新增UI组件可复用相同的架构

## 🔄 数据流示意

```
用户输入 → IndexedInput → updateField(indexPath, field, value)
    ↓
Store.updateField → updateNestedField(items, indexPath, field, value)
    ↓
更新对应对象的字段值 → 设置_status为'modified'
    ↓
触发React重新渲染 → 显示最新值和状态
```

## 🎨 关键设计原则

1. **索引分离**: 业务ID和索引ID分离，索引ID永远稳定
2. **路径寻址**: 使用索引路径数组支持任意深度嵌套
3. **状态统一**: 所有对象都有统一的编辑状态管理
4. **组件通用**: 一个组件支持所有场景，避免重复代码
5. **类型安全**: 完整的TypeScript支持，减少运行时错误

这个架构完全解决了你提到的所有问题：
- ✅ 避免重复更新事件
- ✅ 保持输入焦点稳定
- ✅ 统一的数据管理
- ✅ 可复用的组件设计
- ✅ 支持实体、模块、API等所有数据类型
