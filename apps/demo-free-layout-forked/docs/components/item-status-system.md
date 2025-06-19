# 通用数据项状态系统

## 概述

为了避免重复定义相同的状态类型，我们引入了统一的`ItemStatus`类型，适用于所有数据项（实体、模块、属性、行为树、枚举等）。

## 状态类型

### ItemStatus
```typescript
export type ItemStatus = 'saved' | 'new' | 'dirty' | 'saving';
```

**状态说明：**
- `saved`: 已保存状态 - 数据已同步到后台
- `new`: 新增状态 - 新创建但未保存的数据
- `dirty`: 已修改状态 - 已保存的数据被修改但未保存
- `saving`: 保存中状态 - 正在保存过程中

### 类型别名
为了向后兼容和语义清晰，提供了以下别名：
```typescript
export type EntityStatus = ItemStatus;
export type ModuleStatus = ItemStatus;
export type AttributeStatus = ItemStatus;
```

## 支持的数据类型

所有主要数据类型都支持状态管理：

### 1. 实体 (Entity)
```typescript
interface Entity {
  // ... 其他字段
  _status?: ItemStatus;
}
```

### 2. 模块 (Module)
```typescript
interface Module {
  // ... 其他字段
  _status?: ItemStatus;
}
```

### 3. 属性 (Attribute)
```typescript
interface Attribute {
  // ... 其他字段
  _status?: ItemStatus;
}
```

### 4. 行为树 (BehaviorDef)
```typescript
interface BehaviorDef {
  // ... 其他字段
  _status?: ItemStatus;
}
```

### 5. 枚举类 (EnumClass)
```typescript
interface EnumClass {
  // ... 其他字段
  _status?: ItemStatus;
}
```

## 状态指示器组件

### ItemStatusIndicator
通用状态指示器组件，可用于所有数据项：

```typescript
interface ItemStatusIndicatorProps {
  status?: ItemStatus;
  size?: 'small' | 'default' | 'large';
}

// 使用示例
<ItemStatusIndicator status={item._status} />
```

### 向后兼容
为保持兼容性，仍提供`EntityStatusIndicator`别名：

```typescript
// 等价的使用方式
<EntityStatusIndicator status={entity._status} />
<ItemStatusIndicator status={entity._status} />
```

## 视觉效果

不同状态对应不同的视觉表现：

- **新增 (new)**: 蓝色标签 + 蓝色左侧边框
- **已修改 (dirty)**: 橙色标签 + 橙色左侧边框
- **保存中 (saving)**: 绿色标签 + 加载动画
- **已保存 (saved)**: 灰色标签 + 透明边框

## 状态流转

```
新增数据: undefined → new → dirty → saving → saved
编辑数据: saved → dirty → saving → saved
```

## 最佳实践

1. **一致性**: 所有数据项都使用相同的状态管理模式
2. **可扩展**: 新增数据类型时直接使用`ItemStatus`
3. **向后兼容**: 现有代码无需修改，别名保证兼容性
4. **性能**: 统一的状态类型便于TypeScript优化
5. **维护**: 只需维护一套状态逻辑，减少重复代码

## 使用建议

### 新组件开发
```typescript
// ✅ 推荐 - 使用通用类型
import { ItemStatus, ItemStatusIndicator } from '...';

interface MyComponentProps {
  status?: ItemStatus;
}
```

### 现有代码维护
```typescript
// ✅ 兼容 - 继续使用现有别名
import { EntityStatus, EntityStatusIndicator } from '...';
```

这样的设计既保证了代码的一致性和可维护性，又确保了向后兼容性。
