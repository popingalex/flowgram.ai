# 条件节点状态分组功能

## 🎯 问题背景

用户反馈条件节点中的多个条件混在一起显示，无法区分哪些条件属于同一个状态。

## ✅ 解决方案

实现了条件节点状态分组显示功能，按状态ID对条件进行分组，并提供清晰的视觉标识。

## 🔧 技术实现

### 核心组件
- **文件位置**: `src/nodes/condition/condition-inputs/index.tsx`
- **状态分组组件**: `StateGroup`
- **分组逻辑**: 按 `_stateId` 字段分组条件

### 关键代码
```typescript
// 状态分组逻辑
const conditionsByState: Record<string, Array<{ child: any; index: number }>> = {};
field.map((child: any, index: number) => {
  const stateId = child.value?.key || '$out';
  conditionsByState[stateId].push({ child, index });
});

// 状态名称友好显示
const getStateDisplayName = (stateId: string) => {
  if (stateId === '$out') return '默认输出';
  const parts = stateId.split('.');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    return lastPart.replace('_state', '').replace(/([A-Z])/g, ' $1').trim();
  }
  return stateId;
};
```

## 🎨 视觉设计

- **蓝色分隔线**: 区分不同状态
- **状态标签**: 显示友好的状态名称
- **层次缩进**: 增强分组层次感
- **保持功能**: 完全保留原有编辑功能

## 📊 效果对比

### 修改前
- 所有条件混在一起显示
- 无法区分状态归属
- 用户体验差

### 修改后
- 按状态清晰分组
- 状态标识明确
- 视觉层次清晰

## 🔄 更新时间
2025-01-14
