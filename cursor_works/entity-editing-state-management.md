# 实体编辑状态管理设计文档

## 🎯 核心设计理念

### 数据流架构
```
后台服务 → Store (权威数据源) → JsonSchema副本 (编辑专用) → 编辑操作 → 保存确认 → 更新Store
```

### 关键原则
1. **Store是唯一权威数据源**：存储从后台获取的实体/模块信息
2. **JsonSchema副本用于编辑**：选中实体时生成，专门供节点编辑器使用
3. **编辑过程中不重新生成**：在副本上直接修改，避免丢失编辑状态
4. **显式保存机制**：只有保存操作才会将修改同步回Store

## 📊 数据结构设计

### Store数据结构 (权威数据源)
```typescript
interface Entity {
  id: string;
  name: string;
  description?: string;
  bundles: string[]; // 完整关联的模块
  attributes: Attribute[];
}

interface Attribute {
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
}
```

### JsonSchema副本 (编辑专用)
```typescript
interface EditingJsonSchema extends IJsonSchema {
  type: "object";
  properties: {
    [nanoidKey: string]: {
      id: string; // 原始英文标识符
      name: string; // 中文名称
      type: string; // JSONSchema类型
      description?: string;
      _id: string; // nanoid索引ID
      isEntityProperty?: boolean;
      isModuleProperty?: boolean;
      moduleId?: string;
      // ... 其他meta属性
    };
  };
}
```

## 🔧 React状态管理方案

### useEditingState Hook设计
```typescript
interface UseEditingStateOptions<T> {
  initialData: T;
  transform?: (data: T) => any; // Store数据 → 编辑数据转换
  onSave?: (editedData: any, originalData: T) => void;
  onCancel?: () => void;
}

interface UseEditingStateReturn<T> {
  editingData: any; // 当前编辑的数据
  originalData: T; // 原始数据
  isDirty: boolean; // 是否有未保存的修改
  updateEditingData: (updater: (draft: any) => void) => void;
  save: () => void;
  reset: () => void;
  canSave: boolean;
  canReset: boolean;
}
```

### 实现方案对比

#### 方案1：使用immer (推荐)
- 类似Vue的响应式，但更适合React
- 不可变更新，性能好
- 支持复杂嵌套对象

#### 方案2：使用useReducer + 深拷贝
- React原生方案
- 适合复杂状态逻辑
- 需要手动处理不可变更新

#### 方案3：使用useState + 自定义hook
- 简单直接
- 适合简单场景
- 需要注意引用相等性

## 🎨 UI交互设计

### 编辑状态指示
- **未修改状态**：保存按钮禁用，撤销按钮禁用
- **已修改状态**：保存按钮启用，撤销按钮启用，显示"未保存"提示
- **保存中状态**：按钮loading状态

### 按钮布局
```
[实体选择器] [保存] [撤销] [其他操作...]
```

### 确认对话框
- 切换实体时如有未保存修改，弹出确认对话框
- 页面刷新/关闭时提示未保存修改

## 🔄 生命周期管理

### 选中实体时
1. 检查当前是否有未保存修改
2. 如有修改，弹出确认对话框
3. 确认后，从Store获取实体数据
4. 转换为JsonSchema格式
5. 初始化编辑状态

### 编辑过程中
1. 所有修改都在副本上进行
2. 实时计算isDirty状态
3. 不触发Store更新
4. 不重新生成JsonSchema

### 保存时
1. 验证数据有效性
2. 将编辑数据转换回Store格式
3. 更新Store
4. 触发EntityPropertySyncer同步
5. 重置编辑状态

### 撤销时
1. 恢复到原始JsonSchema状态
2. 重置isDirty标记
3. 清除所有编辑痕迹

## 🚀 实现优先级

### Phase 1: 基础编辑状态管理
- [ ] 实现useEditingState hook
- [ ] 添加保存/撤销按钮
- [ ] 基础的dirty状态检测

### Phase 2: 增强用户体验
- [ ] 确认对话框
- [ ] 加载状态
- [ ] 错误处理

### Phase 3: 高级功能
- [ ] 自动保存
- [ ] 编辑历史
- [ ] 冲突检测

## 📝 技术细节

### 性能优化
- 使用React.memo避免不必要的重渲染
- 使用useMemo缓存转换结果
- 使用useCallback稳定函数引用

### 类型安全
- 严格的TypeScript类型定义
- 泛型支持不同数据类型
- 运行时类型检查

### 错误处理
- 保存失败回滚机制
- 网络错误重试
- 用户友好的错误提示
