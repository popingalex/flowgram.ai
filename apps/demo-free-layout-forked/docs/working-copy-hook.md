# Working Copy Hook 使用指南

## 🎯 设计目标

Working Copy Hook 是一个通用的数据管理hook，用于替代复杂的Store逻辑，提供：

- **可缓存**：自动管理原始数据和编辑副本
- **可重置**：一键恢复到原始状态
- **可对比**：智能检测数据变化
- **可验证**：内置数据验证机制
- **可保存**：统一的保存流程

## 📊 核心概念

### 数据状态
- `original`: 原始数据（只读，用于重置）
- `current`: 当前编辑的数据（可修改）
- `isDirty`: 是否有未保存的变化
- `isSaving`: 是否正在保存
- `error`: 错误信息

### 操作方法
- `setOriginal()`: 设置原始数据，创建working copy
- `updateCurrent()`: 更新当前数据
- `reset()`: 重置到原始状态
- `save()`: 保存变化
- `validate()`: 验证数据

## 🚀 基本使用

### 1. 通用使用

```typescript
import { useWorkingCopy } from '../hooks/use-working-copy';

function MyComponent() {
  // 创建working copy
  const workingCopy = useWorkingCopy<MyDataType>({
    debugName: 'MyComponent',
    defaultValidator: (data) => {
      const errors = [];
      if (!data.name) errors.push('名称不能为空');
      return { isValid: errors.length === 0, errors };
    },
  });

  // 加载数据
  useEffect(() => {
    const data = getDataFromAPI();
    workingCopy.setOriginal(data);
  }, []);

  // 保存数据
  const handleSave = async () => {
    await workingCopy.save(async (data) => {
      await saveDataToAPI(data);
    });
  };

  return (
    <div>
      <input
        value={workingCopy.current?.name || ''}
        onChange={(e) => workingCopy.updateCurrent({ name: e.target.value })}
      />
      <button
        onClick={handleSave}
        disabled={!workingCopy.isDirty}
      >
        保存
      </button>
      <button
        onClick={workingCopy.reset}
        disabled={!workingCopy.isDirty}
      >
        重置
      </button>
    </div>
  );
}
```

### 2. 通用验证器使用

```typescript
import { useWorkingCopy, commonValidator, commonCleanForComparison } from '../hooks/use-working-copy';

function BehaviorEditor({ behaviorId }) {
  // 使用通用working copy，配置常用的验证器
  const workingCopy = useWorkingCopy({
    debugName: 'BehaviorEditor',
    defaultValidator: commonValidator, // 通用的id和name验证
    cleanForComparison: commonCleanForComparison, // 通用的数据清理
  });

  // 加载行为数据
  useEffect(() => {
    if (behaviorId) {
      const behavior = getBehaviorById(behaviorId);
      workingCopy.setOriginal(behavior);
    }
  }, [behaviorId]);

  // 验证数据
  const validation = workingCopy.validate();

  return (
    <form>
      <input
        value={workingCopy.current?.name || ''}
        onChange={(value) => workingCopy.updateCurrent({ name: value })}
      />

      {!validation.isValid && (
        <div>
          {validation.errors.map(error => (
            <div key={error} style={{ color: 'red' }}>{error}</div>
          ))}
        </div>
      )}

      <button
        onClick={() => workingCopy.save(saveBehavior)}
        disabled={!workingCopy.isDirty || !validation.isValid}
      >
        保存行为
      </button>
    </form>
  );
}
```

## 🔧 高级配置

### 自定义比较函数

```typescript
const workingCopy = useWorkingCopy({
  compare: (a, b) => {
    // 自定义比较逻辑
    return JSON.stringify(a) === JSON.stringify(b);
  },
});
```

### 自定义数据清理

```typescript
const workingCopy = useWorkingCopy({
  cleanForComparison: (data) => {
    // 移除不参与比较的字段
    const { _timestamp, _internal, ...cleaned } = data;
    return cleaned;
  },
});
```

### 自定义验证器

```typescript
const workingCopy = useWorkingCopy({
  defaultValidator: (data) => {
    const errors = [];

    if (!data.id) errors.push('ID不能为空');
    if (!data.name) errors.push('名称不能为空');
    if (data.priority < 0) errors.push('优先级不能为负数');

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});
```

## 📋 内置通用工具

### commonValidator

通用验证器，适用于大部分有id和name的数据：

```typescript
import { commonValidator } from '../hooks/use-working-copy';

const workingCopy = useWorkingCopy({
  defaultValidator: commonValidator,
});
```

验证规则：
- ID不能为空
- 名称不能为空

### commonCleanForComparison

通用数据清理函数，移除影响比较的临时字段：

```typescript
import { commonCleanForComparison } from '../hooks/use-working-copy';

const workingCopy = useWorkingCopy({
  cleanForComparison: commonCleanForComparison,
});
```

移除的字段：
- `_timestamp`
- `_version`
- `lastModified`
- `updatedAt`

## 🆚 对比传统Store

### 传统Store方式

```typescript
// 复杂的Store逻辑
const useCurrentBehaviorStore = create((set, get) => ({
  selectedBehaviorId: null,
  originalBehavior: null,
  editingBehavior: null,
  isDirty: false,
  isSaving: false,
  error: null,

  selectBehavior: (behavior) => {
    // 复杂的选择逻辑
    set(state => {
      state.originalBehavior = cloneDeep(behavior);
      state.editingBehavior = cloneDeep(behavior);
      state.isDirty = false;
    });
  },

  updateBehavior: (updates) => {
    // 复杂的更新逻辑
    set(state => {
      state.editingBehavior = { ...state.editingBehavior, ...updates };
      state.isDirty = !deepEqual(state.originalBehavior, state.editingBehavior);
    });
  },

  // ... 更多复杂逻辑
}));
```

### Working Copy Hook方式

```typescript
// 简洁的Hook使用
function BehaviorEditor() {
  const workingCopy = useWorkingCopy({
    debugName: 'BehaviorEditor',
    defaultValidator: commonValidator,
  });

  // 简单直接的操作
  workingCopy.setOriginal(behavior);
  workingCopy.updateCurrent({ name: 'new name' });
  workingCopy.save(saveBehavior);

  // 自动计算的状态
  const { isDirty, isSaving, error } = workingCopy;
}
```

## ✅ 优势总结

1. **代码减少80%**：从500+行Store减少到简单的hook调用
2. **逻辑清晰**：数据流向明确，无复杂的状态管理
3. **类型安全**：完整的TypeScript支持
4. **可复用**：一个hook解决所有working copy需求
5. **易测试**：纯函数逻辑，容易编写单元测试
6. **无副作用**：不会影响全局状态，组件卸载自动清理

## 🔄 迁移指南

### 从CurrentBehaviorStore迁移

**之前**：
```typescript
const { editingBehavior, updateBehavior, saveChanges } = useCurrentBehaviorActions();
```

**之后**：
```typescript
const workingCopy = useWorkingCopy({
  debugName: 'BehaviorEditor',
  defaultValidator: commonValidator,
});
// workingCopy.current 替代 editingBehavior
// workingCopy.updateCurrent 替代 updateBehavior
// workingCopy.save 替代 saveChanges
```

### 状态映射

| 原Store字段 | Working Copy字段 | 说明 |
|------------|------------------|------|
| `originalBehavior` | `original` | 原始数据 |
| `editingBehavior` | `current` | 当前编辑数据 |
| `isDirty` | `isDirty` | 是否有变化 |
| `isSaving` | `isSaving` | 是否保存中 |
| `error` | `error` | 错误信息 |

### 操作映射

| 原Store方法 | Working Copy方法 | 说明 |
|------------|------------------|------|
| `selectBehavior()` | `setOriginal()` | 设置原始数据 |
| `updateBehavior()` | `updateCurrent()` | 更新当前数据 |
| `resetChanges()` | `reset()` | 重置变化 |
| `saveChanges()` | `save()` | 保存变化 |
| `validateBehavior()` | `validate()` | 验证数据 |

## 🎯 最佳实践

1. **使用通用工具**：使用`commonValidator`和`commonCleanForComparison`等通用工具
2. **及时设置原始数据**：在获取数据后立即调用`setOriginal()`
3. **批量更新**：使用对象合并进行批量属性更新
4. **错误处理**：保存失败时检查`error`字段
5. **验证优先**：保存前先验证数据
6. **调试友好**：设置有意义的`debugName`
7. **按需配置**：只配置需要的选项，不需要的保持默认

通过Working Copy Hook，我们实现了更简洁、更可维护的数据管理方式！
