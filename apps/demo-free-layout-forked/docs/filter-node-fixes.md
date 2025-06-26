# 过滤器节点问题修复记录

## 问题描述

用户反馈过滤器节点存在以下问题：

1. **缺少标题和删除控件**：过滤器节点没有其他节点通用的标题栏和右上角控件，无法删除
2. **变量选择器显示异常**：只显示一个nanoid格式的分组（6VpMPdv8JbLqmrO7W8OWV），没有显示模块属性

## 问题分析

### 1. 标题和删除控件问题

**原因**：过滤器节点配置中设置了 `disableSideBar: true`
```typescript
// apps/demo-free-layout-forked/src/nodes/filter/index.ts
meta: {
  disableSideBar: true, // 这导致没有标题栏
}
```

**影响**：
- 节点没有标题栏
- 没有删除、复制等控件
- 用户无法删除节点

### 2. 变量选择器显示问题

**现象**：
- 变量选择器只显示一个nanoid格式的分组
- 分组下有 `$context`、`result`、`status` 等属性
- 没有显示模块属性（如 `controlled/action_target`）

**原因分析**：
1. **变量key不是 `$start`**：控制台显示变量key为 `6VpMPdv8JbLqmrO7W8OWV`
2. **分类逻辑只处理 `$start` 变量**：代码中只对 `$start` 变量进行属性分类
3. **selectedModuleIds传递不一致**：有时为 `Array(1)`，有时为 `undefined`

## 修复方案

### 1. 修复标题和删除控件 ✅

```typescript
// 修改前
meta: {
  disableSideBar: true,
}

// 修改后
meta: {
  expandable: true,
}
```

**文件**：`apps/demo-free-layout-forked/src/nodes/filter/index.ts`

### 2. 修复变量选择器显示 🔧

#### 2.1 扩展分类逻辑

```typescript
// 修改前：只处理 $start 变量
if (variable.key === '$start' && parentFields.length === 0) {

// 修改后：处理所有根变量
if (parentFields.length === 0 && type.properties && Array.isArray(type.properties) && type.properties.length > 0) {
```

**文件**：`apps/demo-free-layout-forked/src/components/ext/variable-selector-ext/use-enhanced-variable-tree.tsx`

#### 2.2 增强调试信息

添加了详细的调试日志：
- 变量树参数传递
- 根变量处理过程
- 属性分类结果
- 模块过滤调试
- 调用栈信息

#### 2.3 放宽模块显示条件

```typescript
// 当 selectedModuleIds 为空时，显示所有模块属性
if (selectedModuleIds && selectedModuleIds.length > 0) {
  // 只显示选中的模块
} else {
  // 显示所有模块
}
```

## 测试验证

### 预期结果

1. **过滤器节点**：
   - ✅ 有标题栏显示
   - ✅ 有删除、复制等控件
   - ✅ 可以正常删除节点

2. **变量选择器**：
   - 🔧 显示模块分组（如：controlled (2)）
   - 🔧 显示模块属性（如：action_target, commands）
   - 🔧 过滤nanoid格式属性
   - 🔧 保留重要属性（$context, result, status）

### 测试步骤

1. 启动开发服务器：`rush dev:demo-free-layout-forked`
2. 访问 http://localhost:3000
3. 添加过滤器节点
4. 检查节点是否有标题栏和控件
5. 在模块过滤条件中选择模块
6. 在属性过滤条件中点击变量选择器
7. 查看控制台调试日志

### 关键调试日志

查找以下日志信息：
```
[变量树] useEnhancedVariableTree 参数: { selectedModuleIds: [...], stackTrace: "..." }
[变量树] 处理根变量: { key: "...", willEnterStartLogic: true/false }
[变量树] 变量属性总览: { allPropertyKeys: [...], selectedModuleIds: [...] }
[变量树] 属性分类结果: { moduleGroupsCount: 2, entityPropertiesCount: 2 }
[变量树] 模块过滤调试: { currentModuleId: "controlled", isModuleSelected: true }
```

## 相关文件

- **节点配置**：`src/nodes/filter/index.ts`
- **变量树逻辑**：`src/components/ext/variable-selector-ext/use-enhanced-variable-tree.tsx`
- **过滤器组件**：`src/components/ext/filter-condition-inputs/index.tsx`
- **条件行组件**：`src/components/ext/condition-row-ext/index.tsx`
- **变量选择器**：`src/components/ext/variable-selector-ext/index.tsx`

## 后续优化

1. **性能优化**：减少不必要的调试日志
2. **用户体验**：改进模块选择的交互
3. **错误处理**：添加数据异常的处理
4. **文档完善**：更新组件使用文档

## UI配置最终确认

### 节点配置
```typescript
meta: {
  defaultPorts: [{ type: 'input' }, { type: 'output' }],
  size: { width: 450, height: 380 },
  expandable: true,        // ✅ 显示顶部控件
  disableSideBar: true,    // ✅ 禁用边栏展开
}
```

### 对比其他节点
- **Action节点**：expandable: true, 无disableSideBar → 有顶部控件 + 有边栏
- **Condition节点**：expandable: false, 无disableSideBar → 无顶部控件 + 有边栏
- **Filter节点**：expandable: true, disableSideBar: true → 有顶部控件 + 无边栏 ✅

### 最终效果
- ✅ 有完整的节点顶部控件（标题、图标、菜单）
- ✅ 点击节点不会弹出右侧抽屉
- ✅ 所有功能都在节点内部实现
- ✅ 可以正常删除、复制节点
- ✅ 与其他节点保持一致的视觉风格

## 更新日志

- **2024-01-XX**：修复标题和删除控件问题
- **2024-01-XX**：扩展变量分类逻辑，支持非$start变量
- **2024-01-XX**：增强调试信息，便于问题排查
- **2024-01-XX**：放宽模块显示条件，改善用户体验
- **2024-01-XX**：确认UI配置：有顶部控件 + 无边栏展开
