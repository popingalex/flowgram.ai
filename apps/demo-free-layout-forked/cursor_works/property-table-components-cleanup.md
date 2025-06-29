# 属性表格组件整合分析

## 📊 需要整合的组件清单

### 1. 重复的输入组件（优先整合）

#### 🔄 FieldInput 组件
**位置**:
- `src/components/entity-list-page.tsx` (第32-85行)
- `src/components/module-list-page.tsx` (第30-83行)

**当前功能**:
- 通用字段输入框，支持只读/编辑模式
- 处理ID字段的等宽字体显示
- 支持必填校验和重复校验
- 支持错误信息显示

**在系统中的角色**:
- 实体列表：编辑实体ID、名称、描述
- 模块列表：编辑模块ID、名称、描述
- 属性编辑：编辑属性ID、名称、类型

**整合方案**:
- 提取到 `src/components/ext/common-inputs/field-input.tsx`
- 统一接口，消除重复代码
- 保持现有功能不变

#### 🔄 专用输入组件
**组件列表**:
- `ModuleIdInput` (module-list-page.tsx:91-105)
- `ModuleNameInput` (module-list-page.tsx:107-121)
- `AttributeIdInput` (module-list-page.tsx:123-154)
- `AttributeNameInput` (module-list-page.tsx:156-170)

**当前功能**:
- 封装特定字段的输入逻辑
- 处理模块属性ID的前缀拼接
- 统一的onChange回调格式

**在系统中的角色**:
- 模块管理：编辑模块基本信息
- 属性管理：编辑属性信息，处理模块前缀

**整合方案**:
- 合并到通用的FieldInput组件
- 通过props控制特殊逻辑（如ID前缀）
- 减少组件数量，提升维护性

### 2. 数据表格组件

#### 🔴 BehaviorDetail 参数表格
**位置**: `src/components/behavior-editor/behavior-detail.tsx` (第650-680行)

**当前功能**:
- 显示行为函数的参数列表
- 支持参数的模块过滤配置
- 支持参数的属性过滤配置
- 支持参数的条件过滤配置
- 自定义参数的增删改

**在系统中的角色**:
- 行为编辑器的核心组件
- 连接函数定义和实际执行的桥梁
- 提供参数到实体属性的映射配置

**整合方案**:
- 使用UniversalTable的 `showParameterMapping`
- 使用UniversalTable的 `showModuleFilter`
- 使用UniversalTable的 `showPropertyFilter`
- 自定义列配置处理参数类型显示

#### 🔴 EntityListPage 主表格
**位置**: `src/components/entity-list-page.tsx` (第1000-1150行)

**当前功能**:
- 树形显示：实体 → 属性 → 模块 → 模块属性
- 支持实体的增删改
- 支持属性的增删改
- 支持模块关联/解除关联
- 支持搜索过滤
- 复杂的行类型判断和渲染

**在系统中的角色**:
- 实体管理的主界面
- 提供实体、属性、模块的统一管理视图
- 支持实体工作流的查看入口

**整合方案**:
- 使用UniversalTable的 `expandable` 树形功能
- 使用UniversalTable的 `showModuleAssociation`
- 使用UniversalTable的 `showActions` 操作列
- 自定义列配置处理不同行类型的显示

#### 🔴 ModuleListPage 主表格
**位置**: `src/components/module-list-page.tsx` (第850-950行)

**当前功能**:
- 树形显示：模块 → 属性
- 支持模块的增删改
- 支持属性的增删改
- 支持属性类型选择
- 支持搜索过滤

**在系统中的角色**:
- 模块管理的主界面
- 定义可复用的模块和属性
- 为实体提供可关联的模块库

**整合方案**:
- 使用UniversalTable的 `expandable` 树形功能
- 使用UniversalTable的 `showActions` 操作列
- 自定义列配置处理模块和属性的不同显示

### 3. 表格单元格组件

#### 🔄 类型选择单元格
**位置**:
- `entity-list-page.tsx` 中的类型选择逻辑
- `module-list-page.tsx` 中的类型选择逻辑

**当前功能**:
- 显示属性类型（string, number, boolean等）
- 支持枚举类型选择
- 支持数据限制配置

**在系统中的角色**:
- 属性定义的核心组件
- 影响工作流中变量的类型推断
- 连接枚举管理和属性定义

**整合方案**:
- 封装为独立的单元格组件
- 集成到UniversalTable的列配置中
- 统一类型选择的交互体验

#### 🔄 操作按钮单元格
**位置**:
- 各表格中的删除、编辑、保存按钮

**当前功能**:
- 提供行级操作按钮
- 支持确认对话框
- 支持按钮状态控制

**在系统中的角色**:
- 数据操作的入口
- 提供用户交互反馈

**整合方案**:
- 使用UniversalTable的 `showActions` 统一处理
- 自定义操作按钮的显示逻辑

## 🎯 整合顺序和方案

### 第1步：整合重复输入组件
**目标**: 消除FieldInput等重复组件
**文件**:
- 新建 `src/components/ext/common-inputs/field-input.tsx`
- 修改 `entity-list-page.tsx` 和 `module-list-page.tsx` 引用

**验证**: 实体列表和模块列表的编辑功能正常

### 第2步：整合BehaviorDetail参数表格
**目标**: 验证UniversalTable的扩展能力
**文件**:
- 修改 `src/components/behavior-editor/behavior-detail.tsx`
- 扩展UniversalTable的参数映射功能

**验证**: 行为参数配置功能正常

### 第3步：整合EntityListPage主表格
**目标**: 简化最复杂的表格组件
**文件**:
- 重构 `src/components/entity-list-page.tsx`
- 扩展UniversalTable的树形和模块关联功能

**验证**: 实体管理的所有功能正常

### 第4步：整合ModuleListPage主表格
**目标**: 统一模块管理界面
**文件**:
- 重构 `src/components/module-list-page.tsx`
- 复用EntityListPage的经验

**验证**: 模块管理的所有功能正常

## 📋 每步整合的具体变化

### FieldInput整合
**删除**: 两个文件中的重复FieldInput定义 (约170行代码)
**新增**: 统一的FieldInput组件 (约80行代码)
**修改**: 两个文件的import和使用方式

### BehaviorDetail整合
**删除**: 原生Semi Table使用 (约30行)
**修改**: 使用UniversalTable + 参数映射配置 (约20行)
**扩展**: UniversalTable支持参数映射功能

### EntityListPage整合
**删除**: 复杂的表格渲染逻辑 (约800行)
**修改**: 使用UniversalTable + 树形配置 (约200行)
**保留**: 数据处理和业务逻辑

### ModuleListPage整合
**删除**: 复杂的表格渲染逻辑 (约600行)
**修改**: 使用UniversalTable + 树形配置 (约150行)
**保留**: 数据处理和业务逻辑

---

**总结**: 4个整合步骤，每步都有明确的目标和验证标准，逐步消除重复代码，统一表格体验。

---

**状态**: 📋 计划制定完成，等待执行确认
**预计工期**: 6-9个工作日
**负责人**: AI Assistant
**更新时间**: 2024-12-19
