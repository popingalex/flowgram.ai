# FormOutputs组件架构修正

## 📋 问题描述

原有的`form-components/form-outputs/index.tsx`组件存在架构问题：

1. **违反数据流原则**：在抽屉模式中直接调用`updateEntity`修改实体store，绕过了设计的编辑状态管理
2. **代码重复**：重复实现了实体编辑逻辑，没有复用`EntityEditorWithState`组件
3. **职责不清**：混合了实体meta编辑和data.outputs管理的职责
4. **按钮位置错误**：保存/撤销按钮应该在顶部操作栏，不应该在form-outputs组件内

## 🎯 修正方案

### 数据流架构原则
遵循设计的数据流：`Backend Service → Store (权威来源) → JsonSchema copy (仅用于编辑) → Edit operations → Save confirmation → Update Store`

### 职责分离
- **form-outputs组件**：负责data.outputs的显示和基础编辑
- **EntityEditorWithState组件**：负责完整的实体编辑（含状态管理）
- **顶部操作栏**：负责保存/撤销按钮

## 🔧 实施细节

### 修改前的问题代码
```typescript
// ❌ 直接修改实体store，绕过状态管理
updateEntity(currentEntity.id, { ...currentEntity, id: val });

// ❌ 重复实现属性编辑表格
const columns = [
  {
    title: 'ID',
    render: (text: string, record: any) => (
      <Input onChange={...} /> // 重复的编辑逻辑
    )
  }
  // ...
];
```

### 修改后的正确实现
```typescript
// ✅ 抽屉模式：复用EntityEditorWithState
if (isSidebar && selectedEntityId) {
  return (
    <EntityEditorWithState
      selectedEntityId={selectedEntityId}
      showActionButtons={false} // 按钮在顶部操作栏
    />
  );
}

// ✅ 节点模式：简单只读显示
return (
  <div>
    {/* 实体基本信息显示 */}
    {currentEntity && (...)}

    {/* 只读属性表格 */}
    <Field name="data.outputs">
      {({ field: { value } }) => (
        <Table dataSource={...} columns={readOnlyColumns} />
      )}
    </Field>
  </div>
);
```

## 📊 改进效果

### 架构层面
- ✅ 恢复正确的数据流，避免绕过状态管理
- ✅ 消除代码重复，提高维护性
- ✅ 明确职责分离，提高代码清晰度

### 用户体验
- ✅ 抽屉模式：完整的实体编辑功能（meta + 属性）
- ✅ 节点模式：简洁的只读显示
- ✅ 按钮位置符合用户期望（顶部操作栏）

### 代码质量
- ✅ 减少代码行数：从359行减少到约120行
- ✅ 类型安全：正确使用组件props接口
- ✅ ESLint检查通过

## 🔄 相关组件关系

```
FormOutputs (当前组件)
├── 抽屉模式 → EntityEditorWithState (完整编辑)
├── 节点模式 → 只读显示
└── Field("data.outputs") → 管理输出schema

EntityEditorWithState
├── useEditingState (状态管理)
├── PropertyTableAdapter (属性表格)
└── EntityStore (数据持久化)

顶部操作栏
└── EntityEditorActionButtons (保存/撤销)
```

## ✅ 验证检查项

- [x] ESLint检查通过
- [x] 类型错误修复（selectedEntityId vs entityId）
- [x] 移除直接的updateEntity调用
- [x] 复用EntityEditorWithState组件
- [x] 保持节点模式的只读显示
- [x] 按钮位置符合设计（showActionButtons=false）

## 📁 修改的文件

- `apps/demo-free-layout-forked/src/form-components/form-outputs/index.tsx`

## 🔮 后续工作

1. 测试抽屉模式的完整编辑功能
2. 验证节点模式的只读显示
3. 确认顶部操作栏的按钮集成
4. 测试数据同步是否正常工作
