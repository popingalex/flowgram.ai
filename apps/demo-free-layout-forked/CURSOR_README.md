# Flowgram 开发注意事项

## 🔧 最新修复 (2025-01-05)

### 实体属性编辑问题修复

1. **实体meta属性编辑**
   - ✅ 修复了meta属性key格式问题：从`meta_${entity.id}_id`改为固定的`__entity_id`格式
   - ✅ 现在FormEntityMetas可以正确找到对应的Field进行编辑

2. **属性增删dirty状态**
   - ✅ 在FormOutputs的handleAttributeChange中添加了`setIsEntityDirty(true)`调用
   - ✅ 现在属性增删后会正确触发保存/撤销按钮启用

3. **🎉 实现useCloned数据管理机制**
   - ✅ 创建了`src/hooks/use-cloned.ts`，提供reactive的blur属性和reset函数
   - ✅ 更新了EditableEntityAttributeTable使用useCloned机制
   - ✅ 自动管理修改状态（isModified）
   - ✅ 提供简单的重置功能（reset）
   - ✅ 删除了复杂的手动历史管理代码

4. **待验证问题**
   - 🔍 实体属性类型选择器是否可以正常修改
   - 🔍 页面垂直滚动条的具体原因

### 测试步骤

1. 启动开发服务器：`npm run dev`
2. 选择一个实体，打开侧边栏编辑器
3. 测试meta属性编辑（ID、名称、描述）
4. 测试实体属性的类型修改
5. 测试属性增删后保存按钮是否启用
6. 检查页面是否有不必要的垂直滚动条

## 🏗️ 架构设计

### nanoid索引设计模式
- 使用nanoid作为React key，确保组件稳定性
- 属性编辑时只修改name/type等字段，不动nanoid key
- 详见：[entity-properties-editor-design.mdc](entity-properties-editor-design.mdc)

### 数据转换流程
- EntityStore → entityToWorkflowData() → WorkflowEditor
- 实体meta属性使用固定key：`__entity_id`、`__entity_name`、`__entity_description`
- 实体属性使用nanoid作为key，保留原始id/name在对应字段中

## 🚨 开发约束

- ❌ **禁止修改**：`packages/` 目录下的引擎代码
- ✅ **自由修改**：`src/components/ext/` 下的所有扩展代码
- ⚠️ **谨慎修改**：其他原有的工作流编辑器相关代码

## 📁 关键文件

- 实体转换：`src/utils/entity-to-workflow.ts`
- 属性编辑：`src/form-components/form-outputs/index.tsx`
- Meta编辑：`src/form-components/form-entity-metas/index.tsx`
- 实体存储：`src/components/ext/entity-store/index.tsx`

## 🐛 已知问题

1. 类型选择器可能无法修改（待验证）
2. 页面可能出现垂直滚动条（待定位）

## 📝 开发日志

### 2025-01-05
- 修复实体meta属性编辑问题
- 修复属性增删后dirty状态问题
- 重构数据转换逻辑，使用固定key格式

## 📋 数据保存功能完成情况 (2024-12-19)

### ✅ 完成的功能

#### 1. Mock API 保存功能
- **文件**: `src/services/api-service.ts`
- **功能**: 实现了真正的内存数据保存，支持实体、模块、枚举的 CRUD 操作
- **特点**:
  - 创建可变的 mock 数据副本 (`mockEntities`, `mockModules`, `mockEnums`)
  - 支持 POST、PUT、DELETE 操作
  - 保持 `_indexId` 稳定性
  - 模拟网络延迟
  - 详细的控制台日志

#### 2. 实体保存功能
- **文件**: `src/components/entity-list-page.tsx`, `src/stores/current-entity.store.ts`, `src/stores/entity-list.ts`
- **流程**:
  1. 用户在界面修改实体属性 → `CurrentEntityStore.updateAttributeProperty`
  2. 点击保存按钮 → `CurrentEntityStore.saveChanges`
  3. 调用 `EntityListStore.saveEntity` → `entityApi.update`
  4. Mock API 保存到内存并返回更新后的数据
  5. 更新所有相关 store 状态

#### 3. 模块保存功能
- **文件**: `src/components/module-list-page.tsx`, `src/stores/module.store.tsx`
- **流程**:
  1. 用户修改模块属性 → 本地 `editingChanges` 状态
  2. 点击保存按钮 → `handleSaveChanges` → `ModuleStore.updateModule`
  3. 调用 `moduleApi.update` → Mock API 保存
  4. 清除编辑状态，更新模块列表

#### 4. 跨页面数据同步
- **机制**: 所有修改都通过 API 保存到内存中的 mock 数据
- **效果**: 在实体页面修改的数据，在模块页面、工作流编辑器等其他页面都能看到最新状态
- **验证**: 可以在不同页面之间切换验证数据同步

### 🔄 保存流程示例

#### 实体保存流程:
```
用户修改实体名称
→ EntityNameInput.onChange
→ handleEntityFieldChange
→ CurrentEntityStore.updateProperty
→ 点击保存按钮
→ CurrentEntityStore.saveChanges
→ EntityListStore.saveEntity
→ entityApi.update
→ Mock API 更新 mockEntities 数组
→ 返回更新后的实体
→ 更新所有 store 状态
```

#### 模块保存流程:
```
用户修改模块属性
→ AttributeIdInput.onChange
→ handleAttributeFieldChange
→ 本地 editingChanges 状态更新
→ 点击保存按钮
→ handleSaveChanges
→ ModuleStore.updateModule
→ moduleApi.update
→ Mock API 更新 mockModules 数组
→ 清除编辑状态
```

### 🎯 验证方法

1. **单页面验证**:
   - 修改实体/模块属性
   - 点击保存按钮
   - 刷新页面确认数据已保存

2. **跨页面验证**:
   - 在实体页面修改实体名称
   - 切换到工作流编辑器
   - 确认实体名称已更新

3. **控制台日志**:
   - 查看保存操作的详细日志
   - 确认 API 调用和数据更新过程

### 📝 注意事项

- Mock 数据只在内存中保存，页面刷新后会重置
- 实际部署时需要连接真实后台 API
- 所有保存操作都有错误处理和加载状态显示
- 保持了 `_indexId` 的稳定性，确保 React 组件不会重新创建

### 🔗 相关文件

- API 服务: `src/services/api-service.ts`
- 实体相关: `src/stores/entity-list.ts`, `src/stores/current-entity.store.ts`
- 模块相关: `src/stores/module.store.tsx`
- 界面组件: `src/components/entity-list-page.tsx`, `src/components/module-list-page.tsx`

---
