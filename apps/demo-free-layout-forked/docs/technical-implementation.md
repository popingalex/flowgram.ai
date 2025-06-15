# 技术实现文档

## 技术栈

### 核心框架
- **React 18**: 前端框架
- **TypeScript**: 类型安全
- **Zustand**: 状态管理
- **Semi Design**: UI 组件库
- **Flowgram Engine**: 工作流引擎

### 构建工具
- **Rsbuild**: 构建工具
- **Rush**: Monorepo 管理

## 项目结构

```
src/
├── components/           # 组件目录
│   ├── ext/             # 扩展组件
│   ├── base-node/       # 基础节点组件
│   ├── sidebar/         # 侧边栏组件
│   └── ...
├── stores/              # 状态管理
│   ├── behavior.store.ts
│   ├── current-entity.store.ts
│   ├── entity-list.ts
│   ├── graph.store.ts
│   └── module.store.tsx
├── services/            # 服务层
│   ├── api-service.ts
│   └── types.ts
├── form-components/     # 表单组件
├── nodes/              # 节点定义
├── utils/              # 工具函数
└── typings/            # 类型定义
```

## 状态管理架构

### Store 设计模式

使用 Zustand 实现状态管理，采用分层设计：

#### 1. 数据层 Store
负责与后台 API 交互，缓存数据：

```typescript
// 实体列表管理
EntityListStore: {
  entities: Entity[];
  loading: boolean;
  error: string | null;
  loadEntities(): Promise<void>;
  getEntity(id: string): Entity | undefined;
}

// 模块管理（含编辑缓存）
ModuleStore: {
  modules: Module[];
  editingModules: Map<string, ModuleEditState>;
  startEditModule(moduleId: string): void;
  saveModule(moduleId: string): Promise<void>;
}
```

#### 2. 编辑层 Store
管理当前编辑状态：

```typescript
// 当前实体编辑
CurrentEntityStore: {
  selectedEntityId: string | null;
  originalEntity: Entity | null;
  editingEntity: Entity | null;
  isDirty: boolean;
  selectEntity(entity: Entity): void;
  updateProperty(path: string, value: any): void;
  saveChanges(): Promise<void>;
}
```

### 数据流设计

```
API Service → Data Store → Edit Store → UI Components
     ↑                                        ↓
     ← Save Operations ← State Management ← User Actions
```

## 组件架构

### 核心组件

#### 1. WorkflowEditor
主工作流编辑器组件：

```typescript
interface WorkflowEditorProps {
  style?: React.CSSProperties;
  className?: string;
}

// 功能：
// - 渲染工作流画布
// - 管理节点和连接线
// - 同步实体数据到工作流
```

#### 2. Start 节点组件
实体属性展示节点：

```typescript
// 位置：src/nodes/start/
// 功能：
// - 展示实体基础信息
// - 展示实体扩展属性（过滤模块属性）
// - 展示关联模块清单
```

#### 3. 侧边栏组件

```typescript
// FormEntityMetas: 基础属性表单
// FormOutputs: 实体扩展属性表
// FormModuleOutputs: 模块属性表
```

#### 4. 条件节点组件

条件节点支持状态分组显示功能：

```typescript
// 位置：src/nodes/condition/condition-inputs/
// 功能：
// - 按状态ID分组显示条件
// - 提供状态标识和视觉分隔
// - 支持状态名称友好显示
// - 保持原有编辑功能

interface StateGroupProps {
  stateId: string;
  children: React.ReactNode;
}

// 状态分组逻辑
const conditionsByState: Record<string, Array<{ child: any; index: number }>> = {};
field.map((child: any, index: number) => {
  const stateId = child.value?.key || '$out';
  if (!conditionsByState[stateId]) {
    conditionsByState[stateId] = [];
  }
  conditionsByState[stateId].push({ child, index });
  return null;
});
```

### 属性展示组件

#### UnifiedPropertyDisplay
统一的属性展示组件：

```typescript
interface PropertyData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

interface UnifiedPropertyDisplayProps {
  properties: PropertyData[];
  mode: 'node' | 'sidebar';
  editable?: boolean;
  onEdit?: (property: PropertyData) => void;
  onDelete?: (property: PropertyData) => void;
}
```

## 数据转换机制

### 实体到工作流数据转换

```typescript
// src/utils/entity-to-workflow.ts
export function entityToWorkflowData(entity: Entity): FlowDocumentJSON {
  // 转换实体数据为工作流格式
  // 处理属性分类和nanoid索引
}
```

### 属性分类逻辑

```typescript
// 属性分类标记
interface Attribute {
  id: string;
  name: string;
  type: string;
  _indexId: string;

  // 分类标记
  isEntityProperty?: boolean;  // 基础属性
  isModuleProperty?: boolean;  // 模块属性
  moduleId?: string;          // 所属模块ID
}
```

## API 服务层

### 服务抽象

```typescript
// src/services/api-service.ts
export const apiRequest = async (url: string, options?: RequestInit) => {
  // 统一的API请求处理
  // 支持Mock模式切换
}

// 实体API
export const entityApi = {
  getAll(): Promise<Entity[]>;
  getById(id: string): Promise<Entity>;
  create(entity: Entity): Promise<Entity>;
  update(id: string, entity: Entity): Promise<Entity>;
  delete(id: string): Promise<void>;
}
```

### Mock 数据支持

```typescript
// 支持开发时的Mock模式
export const toggleMockMode = () => {
  // 切换Mock/真实API模式
}
```

## 表单组件设计

### 动态表单生成

基于 JSON Schema 的动态表单：

```typescript
// EntityPropertiesEditor
// 基于 @flowgram.ai/form-materials 的增强版本
interface EntityPropertiesEditorProps {
  value?: IJsonSchema;
  onChange?: (value: IJsonSchema) => void;
  config?: {
    placeholder?: string;
    descTitle?: string;
    addButtonText?: string;
  };
}
```

### 属性类型选择器

```typescript
// EntityPropertyTypeSelector
// 支持基础类型和数据限制功能
interface EntityPropertyTypeSelectorProps {
  value?: Partial<IJsonSchema>;
  onChange?: (value: Partial<IJsonSchema>) => void;
  onDataRestrictionClick?: () => void;
}
```

## 节点渲染机制

### Start 节点渲染逻辑

当前问题：Start 节点展示了重复的模块属性

#### 问题分析
```typescript
// 当前错误的展示逻辑
const allProperties = entity.attributes; // 包含了模块属性
const moduleList = entity.bundles;       // 又单独展示模块

// 结果：模块属性被展示了两次
// 1. 在扩展属性中展示（错误）
// 2. 在模块清单中展示（正确）
```

#### 修复方案
```typescript
// 正确的过滤逻辑
const entityExtendedProperties = entity.attributes.filter(attr =>
  !attr.isModuleProperty && // 排除模块属性
  !attr.isEntityProperty   // 排除基础属性（meta）
);

const moduleList = entity.bundles; // 模块清单
```

### 属性过滤工具函数

```typescript
// src/utils/property-filters.ts
export const filterEntityExtendedProperties = (attributes: Attribute[]) => {
  return attributes.filter(attr =>
    !attr.isModuleProperty &&
    !attr.isEntityProperty
  );
};

export const filterModuleProperties = (attributes: Attribute[]) => {
  return attributes.filter(attr => attr.isModuleProperty);
};

export const filterMetaProperties = (attributes: Attribute[]) => {
  return attributes.filter(attr => attr.isEntityProperty);
};
```

## 编辑状态管理

### Dirty 状态跟踪

```typescript
// 使用 Immer 进行不可变更新
const updateProperty = (path: string, value: any) => {
  set((state) => {
    // 使用 lodash.set 或自定义路径设置
    setNestedProperty(state.editingEntity, path, value);

    // 检查是否有变化
    state.isDirty = !deepEqual(state.originalEntity, state.editingEntity);
  });
};
```

### 保存/撤销机制

```typescript
const saveChanges = async () => {
  try {
    setSaving(true);
    await entityApi.update(editingEntity.id, editingEntity);

    // 更新原始数据
    set((state) => {
      state.originalEntity = { ...state.editingEntity };
      state.isDirty = false;
    });
  } finally {
    setSaving(false);
  }
};

const resetChanges = () => {
  set((state) => {
    state.editingEntity = JSON.parse(JSON.stringify(state.originalEntity));
    state.isDirty = false;
  });
};
```

## 性能优化

### React 优化

```typescript
// 使用 React.memo 优化组件渲染
export const PropertyDisplay = React.memo<PropertyDisplayProps>(({ properties }) => {
  // 组件实现
});

// 使用 useMemo 缓存计算结果
const filteredProperties = useMemo(() =>
  filterEntityExtendedProperties(entity.attributes),
  [entity.attributes]
);
```

### 状态管理优化

```typescript
// Zustand 选择器优化
const useEntityProperties = () => useCurrentEntity(
  state => state.editingEntity?.attributes || [],
  shallow // 浅比较优化
);
```

## 类型安全

### 核心类型定义

```typescript
// src/services/types.ts
export interface Entity {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  attributes: Attribute[];
  bundles: string[];
  _indexId?: string;
}

export interface Attribute {
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
```

### 扩展类型

```typescript
// src/typings/extended-json-schema.ts
export interface ExtendedJsonSchema extends IJsonSchema {
  category?: 'meta' | 'entity' | 'module';
  id?: string;
  name?: string;
  _indexId?: string;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
  enumClassId?: string;
}
```

## 测试策略

### 组件测试

```typescript
// 使用 React Testing Library
describe('PropertyDisplay', () => {
  it('should filter module properties correctly', () => {
    // 测试属性过滤逻辑
  });
});
```

### Store 测试

```typescript
// 测试状态管理逻辑
describe('CurrentEntityStore', () => {
  it('should track dirty state correctly', () => {
    // 测试dirty状态跟踪
  });
});
```

## 部署配置

### 开发环境

```bash
# 启动开发服务器
rush dev:demo-free-layout-forked

# 端口：3000
# 支持热重载
```

### 构建配置

```typescript
// rsbuild.config.ts
export default defineConfig({
  plugins: [pluginReact(), pluginLess()],
  source: {
    entry: { index: './src/app.tsx' },
    decorators: { version: 'legacy' }
  }
});
```

## 调试工具

### 开发者工具

```typescript
// Zustand DevTools 集成
export const useEntityStore = create<EntityStore>()(
  devtools(
    immer((set, get) => ({
      // store implementation
    })),
    { name: 'entity-store' }
  )
);
```

### Mock 数据管理

```typescript
// 浏览器控制台工具
window.mockUtils = {
  clearAllMockData(),
  resetMockData(),
  exportMockData(),
  importMockData(data)
};
```
