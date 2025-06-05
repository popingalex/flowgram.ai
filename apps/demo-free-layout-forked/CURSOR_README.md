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
