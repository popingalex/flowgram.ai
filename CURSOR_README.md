# Flowgram 扩展开发文档

## 项目概述
基于开源项目 Flowgram 的扩展开发，主要添加实体属性管理功能。

## 项目启动
```bash
cd apps/demo-free-layout-forked
npm run start
```
启动后查看终端输出获取访问地址。

## 后台服务配置

### API接口地址
- **Base URL**: `http://localhost:9999`
- **模块管理**: `http://localhost:9999/cm/module/`
- **实体管理**: `http://localhost:9999/cm/entity/`

### API配置文件
- 位置：`src/components/ext/api/config.ts`
- 功能：统一管理API基础URL和端点配置
- 提供：`buildApiUrl()` 和 `apiRequest()` 工具函数

### Store与后台对接
- **ModuleStore**: 已对接后台模块管理API，支持CRUD操作
- **EntityStore**: 已对接后台实体管理API，支持CRUD操作
- **数据格式**: 直接使用后台返回的数据结构

## 页面结构
- **主页面(组件化)**：新的主页面，将工作流编辑器作为组件嵌入，提供更好的布局和导航
- **流程图编辑器(原版)**：原始工作流编辑器功能，现在支持实体选择和属性展示
- **API连接测试**：测试后台API连接状态和数据展示
- **实体属性编辑器测试**：扩展的实体属性管理功能
- **实体Store测试**：实体数据管理测试
- **模块实体编辑器**：统一的模块和实体编辑界面

## 新增功能

### 🎯 组件化架构 ✅ 已完成

### WorkflowEditor 组件
- **位置**：`src/components/workflow-editor/`
- **功能**：将原来的全页面工作流编辑器封装为可复用组件
- **特性**：
  - 支持自定义样式和类名
  - 接收 `selectedEntityId` 参数
  - 完全保持原有工作流编辑功能
  - 可嵌入任何页面布局

### MainPage 主页面
- **位置**：`src/components/main-page/`
- **功能**：展示如何将工作流编辑器嵌入到更大的页面中
- **布局结构**：
  - 顶部导航栏：包含系统标题和实体选择器
  - 左侧导航栏：流程设计、实体管理、模块管理、系统设置
  - 主内容区域：根据导航选择显示不同页面
  - 右侧信息面板：实体信息、快速操作、最近使用

### 导航功能
- **多页面切换**：通过侧边栏导航在不同功能页面间切换
- **状态管理**：正确的导航状态管理和页面内容渲染
- **实体选择**：全局实体选择器，影响工作流编辑器的显示内容

### 页面组织
```
主页面(组件化)
├── 流程设计 - WorkflowEditor组件 + 右侧信息面板
├── 实体管理 - 实体列表和详情页面
├── 模块管理 - 模块分类和管理页面
└── 系统设置 - 系统配置页面
```

### 技术实现
- **Semi Design**：使用Layout、Nav、Card等组件构建界面
- **状态管理**：React useState管理导航状态和实体选择
- **组件复用**：WorkflowEditor可在任何页面中使用
- **响应式布局**：左右分栏，适应不同屏幕尺寸

### 使用方式
```tsx
// 作为独立组件使用
<WorkflowEditor
  selectedEntityId="vehicle"
  style={{ height: '600px' }}
  className="custom-workflow"
/>

// 在主页面中使用（推荐）
<MainPage />
```

### 🎯 全局导航和实体选择
- **顶部导航栏**：全局导航，在所有页面都可见
- **实体选择器**：在流程图编辑器页面的导航栏中，可以选择当前要编辑的实体
- **实体属性展示**：选择实体后，在start节点中自动展示该实体的属性信息
- **属性继承显示**：清晰展示实体的直接属性和从模块继承的属性

### 🔄 实体属性展示逻辑
- **直接属性**：显示实体自身定义的属性（绿色背景）
- **继承属性**：显示从关联模块继承的属性（黄色背景）
- **模块分组**：按模块分组显示继承的属性，便于理解属性来源
- **实时更新**：选择不同实体时，属性展示实时更新

## 架构设计

### 组件层次结构
```
App
├── TopNavigation (全局导航)
├── MainPage (主页面 - 推荐)
│   ├── TopNavigation (页面级导航)
│   └── WorkflowEditor (工作流组件)
└── EditorPage (原版编辑器页面)
    └── WorkflowEditor (工作流组件)
```

### 组件特性
- **WorkflowEditor**: 可复用的工作流编辑器组件
  - 支持selectedEntityId属性
  - 支持自定义样式和类名
  - 完整的工作流编辑功能
- **MainPage**: 展示组件化使用方式
  - 卡片布局包装工作流编辑器
  - 集成实体选择和导航
  - 响应式设计

## 当前扩展功能

### 1. 实体属性编辑器
- 位置：`src/components/ext/entity-properties-editor/`
- 功能：提供可视化的属性编辑界面
- 支持直接属性和模块化属性管理

### 2. 模块化属性管理
- 枚举类管理：`src/components/ext/entity-property-type-selector/enum-store.tsx`
- 模块管理：`src/components/ext/entity-property-type-selector/module-store.tsx`
- 实体管理：`src/components/ext/entity-property-type-selector/entity-store.tsx`

### 3. 后台数据集成
- **模块数据**：从后台API获取，包含transform、mobile、terrain、vehicle、controlled等模块
- **实体数据**：从后台API获取，包含vehicle、slope、debris_flow等实体类型
- **属性继承**：实体通过bundles字段关联模块，实现属性继承

### 4. 统一编辑器
- 位置：`src/components/ext/module-entity-editor/`
- 功能：模块和实体的统一编辑界面
- 支持：属性编辑、模块关联、继承关系管理

## 当前问题

### ✅ 已解决的问题
- VariableSelector Provider 依赖问题 - 通过独立实现解决
- 实体属性编辑器测试页面 - 已正常工作
- 后台API对接 - 已完成模块和实体的CRUD操作

### 🔄 进行中的问题
- 数据同步优化 - 需要完善错误处理和加载状态
- 界面交互优化 - 需要改进用户体验

## 开发状态
- ✅ 模块化属性管理功能已实现
- ✅ 枚举类管理功能已实现
- ✅ 后台API对接已完成
- ✅ 实体属性编辑器测试页面正常工作
- ✅ 统一的模块实体编辑器已实现
- ✅ API连接测试页面已添加

## 代码组织

### 不能修改的部分
- `packages/` - Flowgram 引擎核心代码
- `apps/demo-free-layout/` - 原始示例，仅作参考

### 可以自由修改的部分
- `apps/demo-free-layout-forked/src/components/ext/` - 所有扩展组件
- `apps/demo-free-layout-forked/src/typings/mas/` - 扩展类型定义

### 需要谨慎修改的部分
- `apps/demo-free-layout-forked/src/app.tsx` - 应用入口
- 其他原有的工作流编辑器相关代码

## 开发注意事项
1. 确保原始工作流编辑器功能不受影响
2. 扩展功能应该独立工作，避免复杂的引擎依赖
3. 优先解决功能问题，而不是拘泥于代码复用
4. API配置统一管理，便于环境切换
5. 数据操作通过Store进行，保持数据一致性

## 最近修复 (2025-01-27)

### 1. 工作流图自动加载功能 ✅ 新增

**功能**: 根据选中实体ID自动加载对应的后台工作流图

**实现方案**:
- **数据转换器**: 创建了`graph-to-workflow.ts`，将后台工作流图格式转换为编辑器可用格式
- **节点类型映射**: `nest→start`, `action→invoke`, `condition→condition`, `sequence→condition`
- **智能回退**: 如果没有找到对应工作流图，自动回退到使用实体数据生成默认工作流
- **完整转换**: 支持节点数据、连线关系、输入输出参数的完整转换
- **大小写兼容**: 自动处理实体ID和工作流图ID的大小写差异（如`vehicle`↔`Vehicle`）

**技术细节**:
- 在WorkflowEditor中集成GraphStore
- 优先使用`getGraphById(entityId)`获取真实工作流图
- 支持大小写不敏感匹配：先精确匹配，再大小写不敏感匹配
- 自动网格布局，避免节点重叠
- 保持原有的实体属性同步功能

**解决的问题**:
- 后台实体ID为小写（如`vehicle`, `task`）
- 后台工作流图ID为大写（如`Vehicle`, `Task`）
- 通过双重匹配策略确保能正确找到对应的工作流图

### 2. Store架构简化

**问题**: BehaviorStore和FunctionStore功能重复，FunctionStore只是BehaviorStore的包装层

**修复方案**:
- **删除FunctionStore**: 移除了多余的`function.store.ts`文件
- **统一使用BehaviorStore**: 所有Java函数行为管理统一使用BehaviorStore
- **简化架构**: 避免了不必要的数据转换和代码重复
- **提升性能**: 减少了包装层的性能开销

### 2. 模块配置弹窗重构和nanoid关联

**问题**: 有两个重复的"模块配置"弹窗，界面有"模块"标签冗余，模块ID变更会丢失关联关系

**修复方案**:
- **保留ModuleConfigModal功能**: 恢复了`sidebar-tree.tsx`中的`ModuleConfigModal`，保持模块属性编辑功能
- **去掉"模块"标签**: 在边栏和弹窗中移除"模块"标签，简化界面显示
- **实现nanoid关联**: 实体通过模块的`_indexId`(nanoid)关联模块，而不是模块ID
- **支持模块属性编辑**: 在配置弹窗中，选中模块的属性支持类型编辑（保持原有功能）

**技术实现**:
```typescript
// 使用nanoid关联而不是模块ID
const handleModuleConfigConfirm = (selectedModuleIds: string[]) => {
  const selectedNanoids = modules
    .filter(module => selectedModuleIds.includes(module.id))
    .map(module => module._indexId || module.id); // 优先使用nanoid

  updateEntity({ bundles: selectedNanoids });
};

// 支持旧ID和新nanoid的兼容匹配
.filter(module => {
  return entityBundles.includes(module.id) || entityBundles.includes(module._indexId || '');
})
```

**核心优化**:
- 模块关联关系通过nanoid维护，避免模块ID变更导致的关联丢失
- 保持了完整的模块配置功能，包括属性类型编辑
- 简化的视觉设计，去掉冗余标签
- 两个弹窗各司其职：`ModuleConfigModal`(高级配置)，`ModuleSelectorModal`(简单选择)

### 2. 之前的修复 (2025-01-14)

#### 实体属性删除功能调试增强

**问题**: 用户反映实体属性编辑表中删除属性功能无效

**修复方案**:
- 在 `sidebar-editor.tsx` 的 `handleDelete` 函数中添加详细的调试日志
- 在 `current-entity.store.ts` 的 `removeAttribute` 函数中添加完整的调试信息

#### 模块配置面板重新设计

**问题**:
- 页面布局有问题，输入框乱
- 控件（操作）列按钮没有对齐
- 缺少关联业务，需要可选择的表格

**解决方案**:

#### 重新设计的模块配置面板特性：

1. **行选择功能**:
   - 使用 Semi Design Table 的 `rowSelection` 属性
   - 支持单行选择和全选操作
   - 只有模块行可以被选择，属性行跟随模块状态

2. **改进的布局**:
   - 固定列宽，避免布局混乱
   - 统一的按钮对齐和样式
   - 清晰的模块/属性层次结构

3. **模块关联业务**:
   - 实时同步实体的 `bundles` 字段
   - 模块选择/取消选择会立即更新实体状态
   - 配置模块弹窗提供完整的模块列表和描述

4. **用户体验优化**:
   - 选中状态的视觉反馈（绿色高亮）
   - 显示已选择模块数量
   - 每个模块显示属性数量
   - 只读模式下禁用选择操作

#### 技术实现：

```typescript
// 模块树数据构建
const moduleTreeData = useMemo(() => {
  const entityBundles = editingEntity?.bundles || [];

  return modules.map((module) => {
    const isModuleSelected = entityBundles.includes(module.id);
    // ...构建完整的树形数据
  });
}, [modules, editingEntity?.bundles]);

// 行选择配置
const rowSelection = useMemo(() => ({
  selectedRowKeys,
  onChange: (selectedKeys, selectedRows) => {
    // 处理选择变化
  },
  onSelect: (record, selected) => {
    // 处理单行选择，更新实体的 bundles
    if (!record.isAttribute && typeof selected === 'boolean') {
      const currentBundles = editingEntity?.bundles || [];
      const newBundles = selected
        ? [...currentBundles, moduleId]
        : currentBundles.filter(id => id !== moduleId);
      updateEntity({ bundles: newBundles });
    }
  },
  // ...其他配置
}), [selectedRowKeys, editingEntity?.bundles, modules, updateEntity, readonly]);
```

### 3. 类型安全性改进

**修复的TypeScript错误**:
- 修复了 `rowSelection` 的类型定义问题
- 使用 `any` 类型处理 Semi Design 的复杂类型约束
- 添加了运行时类型检查确保类型安全

### 4. 文件结构

**修改的核心文件**:
- `apps/demo-free-layout-forked/src/components/ext/module-property-tables/sidebar-tree.tsx` - 重新设计的模块配置面板
- `apps/demo-free-layout-forked/src/components/ext/entity-property-tables/sidebar-editor.tsx` - 添加删除调试
- `apps/demo-free-layout-forked/src/stores/current-entity.store.ts` - 添加删除调试

## 使用说明

### 模块配置面板
1. 通过复选框选择/取消选择模块
2. 选中的模块会自动关联到当前实体
3. 点击"配置模块"按钮打开详细配置弹窗
4. 点击链接按钮可以跳转到模块详情页

### 实体属性删除
1. 点击属性行的红色删除按钮
2. 确认删除弹窗
3. 查看控制台调试信息验证删除过程
4. 只有实体自有属性可以删除，模块属性不可删除

## 调试建议

1. **删除属性问题**:
   - 检查控制台是否有删除相关的调试日志
   - 确认属性有 `_indexId` 字段
   - 验证 `removeAttribute` 函数被正确调用

2. **模块选择问题**:
   - 检查实体的 `bundles` 字段是否正确更新
   - 确认模块数据已正确加载
   - 验证 `updateEntity` 函数的调用

## 下一步计划

1. 根据用户反馈继续优化删除功能
2. 考虑添加批量操作功能
3. 优化模块配置的用户体验
4. 添加更多的错误处理和用户提示

---

## 历史记录

### 2025-01-13
- 修复了模块导入路径错误
- 清理了冗余组件和文件
- 恢复了实体模块列表和属性表显示功能

### 2025-01-12
- 初始化项目结构
- 建立基础的实体和模块管理功能

# Flowgram 扩展开发记录

## 🎯 项目概览
基于 Flowgram 引擎的自定义扩展开发，主要包含实体属性编辑器、模块管理等功能。

## 📋 开发任务

### ✅ 已完成
1. **实体属性编辑器重构** - 2025年1月
   - 重构了实体属性编辑器，支持实体直接属性、模块属性和自定义属性的管理
   - 实现了nanoid索引设计模式，确保React组件稳定性
   - 解决了属性编辑时input失去焦点的问题
   - 参考: [entity-properties-editor-design.md](entity-properties-editor-design.md)

2. **Zustand状态管理迁移** - 2025年1月
   - 从Redux迁移到Zustand，简化状态管理
   - 创建了`current-entity.store.ts`用于当前实体编辑状态管理
   - 参考: [cursor_works/zustand_fix_summary.md](cursor_works/zustand_fix_summary.md)

3. **模块属性表重构** - 2025年1月
   - **问题**: 边栏/实体属性编辑表中删除属性功能无效
   - **问题**: 模块关联面板存在多个问题：页面布局有问题，输入框乱，控件列按钮没有对齐，缺少关联业务
   - **解决方案**:
     - 重新设计模块属性表组件，分离边栏显示和配置弹窗功能
     - 边栏只显示已关联模块（不支持编辑），配置弹窗支持模块选择和属性编辑
     - 使用完全自定义渲染，只有模块行显示复选框
     - 修复了绿色配色问题，改为蓝色避免与成功状态混淆
     - 删除重复标题，统一表格展开样式

4. **删除属性功能修复** - 2025年1月
   - **问题**: 实体属性删除按钮仍然无效
   - **解决方案**: 加强了Store删除方法的错误处理和调试信息，使用Immer的splice方法确保正确删除

5. **界面优化** - 2025年1月
   - **问题**: 实体模块属性有绿色配色，标题重复，表格展开样式不一致
   - **解决方案**:
     - 修复模块属性表的绿色背景色问题，改为中性色
     - 移除重复的"实体模块"标题，改为简洁的"属性"
     - 统一表格缩进(indentSize=20)和展开样式
     - 修复FormEntityProperties组件的类型错误，使用`getExtInfo()?.entity`访问实体数据

## 🛠️ 核心设计

### nanoid索引设计模式
- **索引ID**: 使用nanoid作为React key，确保组件稳定性
- **语义化ID**: 用户界面显示和编辑
- **Meta属性保留**: 保留所有原始Attribute属性
- 详细文档: [entity-properties-editor-design.md](entity-properties-editor-design.md)

### 状态管理架构
- **Zustand Store**: 轻量级状态管理，替代Redux
- **细粒度订阅**: 避免不必要的重新渲染
- **Immer集成**: 安全的状态更新

### 模块关联架构
- **边栏显示**: 只读显示已关联模块，不支持编辑
- **配置弹窗**: 支持模块选择和属性类型编辑
- **完全自定义渲染**: 精确控制复选框显示位置

## 🐛 问题记录

### 已解决
1. **属性编辑失去焦点** ✅
   - 原因: 使用可变属性作为React key
   - 解决: 实现nanoid索引设计模式

2. **删除属性无效** ✅
   - 原因: Store删除逻辑有问题，缺少错误处理
   - 解决: 加强错误处理，使用Immer正确删除

3. **模块属性表问题** ✅
   - 原因: 混合了显示和编辑功能，样式不一致
   - 解决: 分离边栏显示和配置弹窗，统一样式

4. **类型错误** ✅
   - 原因: FlowNodeEntity访问entity属性方式错误
   - 解决: 使用`getExtInfo()?.entity`正确访问

## 📁 关键文件

### 实体属性编辑
- `src/components/ext/entity-properties-editor/index.tsx` - 主编辑器组件
- `src/components/ext/entity-property-tables/sidebar-editor.tsx` - 边栏属性表
- `src/stores/current-entity.store.ts` - 当前实体状态管理

### 模块管理
- `src/components/ext/module-property-tables/sidebar-tree.tsx` - 模块属性表
- `src/stores/module.store.ts` - 模块状态管理

### 表单组件
- `src/form-components/form-entity-properties/index.tsx` - 实体属性表单组件

## 🚀 开发指南

### 调试删除功能
1. 打开浏览器开发者工具控制台
2. 尝试删除实体属性
3. 查看🗑️开头的详细调试日志
4. 验证删除流程是否正常执行

### 模块配置
1. **边栏模块属性表**: 只显示已关联模块，点击"配置模块"按钮进入编辑
2. **模块配置弹窗**: 支持选择模块和编辑模块属性类型
3. **行选择**: 只有模块行显示复选框，属性行不显示

### 状态管理
- 使用`useCurrentEntity`和`useCurrentEntityActions`访问实体状态
- 所有属性修改都通过Store进行，确保响应式更新
- 使用Immer确保状态更新的不可变性

## 🔧 环境设置
- 开发服务器: `rush dev:demo-free-layout-forked`
- 端口: 通常为 3001 或自动分配
- 热更新: 支持
