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
