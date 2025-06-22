# 抽象框架设计文档

## 🎯 设计目标

解决之前代码中的核心问题：
1. React组件使用可变属性作为key导致input失去焦点
2. 用户修改属性名时组件重新渲染，编辑状态丢失
3. 撤销逻辑错误地访问后台API而不是本地内存操作
4. 三个页面（实体、模块、API）逻辑重复，缺乏统一抽象

## 🏗️ 三层抽象架构

### 1. 数据结构抽象层 (`indexed-store.ts`)

#### Indexed接口
```typescript
export interface Indexed {
  id: string;                    // 可变的业务ID
  _indexId: string;              // 稳定的索引ID (React key)
  _status?: 'saved' | 'new' | 'dirty' | 'saving';
  _editStatus?: 'editing' | 'saving';
}
```

**核心设计原则：**
- `id`: 用户可编辑的业务标识符，可能变化
- `_indexId`: 使用nanoid生成的稳定索引，永远不变，用作React key
- `_status`: 数据状态管理，支持增删改查的完整生命周期
- `_editStatus`: 编辑状态管理，支持保存中等UI状态

#### IndexedStoreConfig接口
```typescript
export interface IndexedStoreConfig<T extends Indexed> {
  // API端点配置 - 不同数据类型的差异化配置
  apiEndpoints: {
    getAll: () => Promise<T[]>;
    create: (item: T) => Promise<T>;
    update: (id: string, item: T) => Promise<T>;  // 🔑 关键：用原始ID作为参数
    delete: (id: string) => Promise<void>;
  };

  // 数据处理配置
  ensureIndexId: (item: Partial<T>) => T;
  validateItem: (item: T) => boolean;

  // 子属性配置（如果有）
  childrenConfig?: {
    fieldName: string;  // 子属性字段名 (attributes/parameters)
    ensureChildIndexId: (child: any) => any;
  };
}
```

### 2. 行为抽象层 (`indexed-store-base.ts`)

#### 通用Store基类
```typescript
export function createIndexedStore<T extends Indexed>(
  config: IndexedStoreConfig<T>,
  storeName: string
)
```

**核心功能：**
- **统一的CRUD操作**：loadItems, saveItem, deleteItem
- **统一的编辑操作**：updateItemField, resetItemChanges
- **正确的撤销逻辑**：从原始版本恢复，不访问后台API
- **API调用优化**：使用原始ID作为API参数，避免后台认为是新建数据

**关键实现细节：**
```typescript
// 🔑 正确的API调用逻辑
if (item._status === 'new') {
  savedItem = await config.apiEndpoints.create(item);
} else {
  // 使用原始ID作为API参数，新ID在请求体中
  const originalId = IndexedStoreUtils.getOriginalId(item, get().originalItems);
  savedItem = await config.apiEndpoints.update(originalId, item);
}

// 🔑 正确的撤销逻辑 - 纯本地内存操作
resetItemChanges: (indexId: string) => {
  if (item._status === 'new') {
    // 新增状态直接删除
    state.items = state.items.filter((i) => i._indexId !== indexId);
  } else {
    // 从原始版本恢复
    const originalItem = originalItems.get(indexId);
    state.items[itemIndex] = IndexedStoreUtils.deepClone(originalItem);
  }
}
```

### 3. 组件抽象层 (`indexed-input.tsx`)

#### IndexedInput组件
```typescript
export const IndexedInput: React.FC<IndexedInputProps>
```

**核心特性：**
- **稳定的React key**：使用stableKey参数避免组件重新挂载
- **光标位置保持**：输入过程中光标不会移动到末尾
- **统一的输入类型**：支持text、select、number、textarea
- **性能优化**：使用useMemo和useCallback减少重新渲染

#### useIndexedFieldUpdate Hook
```typescript
export function useIndexedFieldUpdate<T>({
  item: T,
  onFieldUpdate: (indexId: string, field: string, value: any) => void,
  getIndexId: (item: T) => string,
})
```

**封装的逻辑：**
- **字段更新函数生成**：createFieldUpdater(field) => (value) => void
- **稳定key生成**：createInputKey(field) => string
- **避免重复代码**：每个页面不需要重写更新函数

## 🔧 使用方法

### 1. 定义数据类型
```typescript
// 让现有类型继承Indexed接口
export interface Entity extends Indexed {
  name: string;
  description?: string;
  attributes: Attribute[];
  // ... 其他字段
}
```

### 2. 创建Store配置
```typescript
const entityStoreConfig: IndexedStoreConfig<Entity> = {
  apiEndpoints: {
    getAll: () => entityApi.getAll(),
    create: (entity: Entity) => entityApi.create(entity),
    update: (id: string, entity: Entity) => entityApi.update(id, entity),
    delete: (id: string) => entityApi.delete(id),
  },
  ensureIndexId: (entity: Partial<Entity>): Entity => ({
    // 确保每个字段都有默认值
    id: entity.id || '',
    name: entity.name || '',
    _indexId: entity._indexId || nanoid(),
    _status: entity._status || 'saved',
    // ... 其他字段
  }),
  validateItem: (entity: Entity): boolean => {
    return !!(entity.id && entity.name);
  },
  childrenConfig: {
    fieldName: 'attributes',
    ensureChildIndexId: (attr: Attribute): Attribute => ({
      ...attr,
      _indexId: attr._indexId || nanoid(),
    }),
  },
};
```

### 3. 创建Store实例
```typescript
export const useEntityListStore = createIndexedStore(entityStoreConfig, 'EntityList');
```

### 4. 在组件中使用
```typescript
const MyComponent: React.FC = () => {
  const store = useEntityListStore();

  // 字段更新逻辑
  const fieldUpdate = useIndexedFieldUpdate({
    item: store.items[0],
    onFieldUpdate: store.updateItemField,
    getIndexId: (item) => item._indexId,
  });

  return (
    <IndexedInput
      value={store.items[0]?.name}
      onChange={fieldUpdate.createFieldUpdater('name')}
      stableKey={fieldUpdate.createInputKey('name')}
      placeholder="实体名称"
    />
  );
};
```

## ✅ 解决的问题

### 1. React Key稳定性
- **之前**：使用可变的业务ID作为React key
- **现在**：使用稳定的nanoid作为React key
- **效果**：输入时组件不会重新挂载，光标位置保持

### 2. 撤销逻辑正确性
- **之前**：用修改后的ID访问后台API，导致找不到数据
- **现在**：纯本地内存操作，从原始版本恢复
- **效果**：撤销功能稳定可靠，不会崩溃

### 3. API调用正确性
- **之前**：用修改后的ID作为API参数，后台认为是新建数据
- **现在**：用原始ID作为API参数，新ID在请求体中
- **效果**：更新操作正确执行，不会创建重复数据

### 4. 代码重复问题
- **之前**：三个页面都有重复的更新、撤销、保存逻辑
- **现在**：统一的抽象框架，一套代码处理所有数据类型
- **效果**：代码量减少，维护成本降低，逻辑一致性提高

## 🚀 扩展性

### 添加新的数据类型
1. 定义接口继承Indexed
2. 创建StoreConfig配置
3. 调用createIndexedStore创建Store
4. 在组件中使用IndexedInput和useIndexedFieldUpdate

### 自定义子属性处理
```typescript
childrenConfig: {
  fieldName: 'parameters', // API参数
  ensureChildIndexId: (param: ApiParameter): ApiParameter => ({
    ...param,
    _indexId: param._indexId || nanoid(),
  }),
}
```

### 自定义验证逻辑
```typescript
validateItem: (item: MyType): boolean => {
  return !!(item.id && item.name && item.customField);
}
```

## 🔍 测试验证

访问测试页面：`/#test-indexed-store`

测试内容：
- 数据加载和显示
- 字段编辑和状态更新
- 保存和撤销功能
- 光标位置保持
- 组件稳定性

## 📝 注意事项

1. **nanoid作为稳定索引**：永远不要修改_indexId，它是组件稳定性的保证
2. **原始版本保存**：originalItems Map保存了撤销所需的原始数据
3. **状态管理**：_status字段管理数据的完整生命周期
4. **API参数**：更新时用原始ID作为参数，避免后台混淆
5. **类型安全**：充分利用TypeScript的类型检查，避免运行时错误
