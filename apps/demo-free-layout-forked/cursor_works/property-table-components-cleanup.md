# 属性表格组件整合分析（修正版）

## 🔍 问题发现与修正

**错误方向**：之前错误地分析了废弃的 `EntityListPage` 和 `ModuleListPage` 组件
**正确方向**：应该分析实际在使用的 `EntityManagementPage` 和 `ModuleManagementPage` 组件

## 📊 实际使用的组件清单

### 🎯 当前活跃的主要组件

1. **EntityManagementPage** (`src/components/entity-management/index.tsx`)
   - 状态：✅ 活跃使用中 (路由: `case 'entities'`)
   - 功能：实体管理主页面，使用侧边栏+详情面板布局
   - 子组件：`EntityDetail` - 实体详情编辑组件

2. **ModuleManagementPage** (`src/components/module-management/index.tsx`)
   - 状态：✅ 活跃使用中 (路由: `case 'modules'`)
   - 功能：模块管理主页面，使用侧边栏+详情面板布局
   - 子组件：`ModuleDetail` - 模块详情编辑组件

3. **BehaviorDetail** (`src/components/behavior-editor/behavior-detail.tsx`)
   - 状态：✅ 活跃使用中 (路由: `case 'behavior'`)
   - 功能：行为编辑器中的参数配置表格
   - 特点：使用原生 Semi Table

### 🗑️ 已删除的废弃组件

- ❌ `EntityListPage` - 已删除，不在路由中使用
- ❌ `ModuleListPage` - 已删除，不在路由中使用

## 🔄 需要整合的组件分析

### 1. 第一优先级：FieldInput组件 ✅
**状态**：已完成整合
- 创建了统一的 `FieldInput` 组件
- 消除了重复代码

### 2. 第二优先级：BehaviorDetail参数表格
**位置**：`src/components/behavior-editor/behavior-detail.tsx`
**当前状态**：使用原生 Semi Table 显示参数配置
**功能分析**：
- 显示行为参数列表
- 参数映射配置
- 模块过滤、属性过滤
- 参数类型选择

**整合方案**：
- 使用 UniversalTable 替换原生 Semi Table
- 开启 `showParameterMapping` 功能列
- 保持现有的参数配置逻辑

### 3. 第三优先级：EntityDetail中的表格组件
**位置**：`src/components/entity-management/entity-detail.tsx`
**当前状态**：使用 UniversalTable ✅
**分析结果**：已经使用 UniversalTable，无需整合

### 4. 第四优先级：ModuleDetail中的表格组件
**位置**：`src/components/module-management/module-detail.tsx`
**当前状态**：需要检查是否使用 UniversalTable
**待分析**：确认是否需要整合

## 🎯 修正后的整合顺序

**第1步**：✅ FieldInput整合 - 已完成
**第2步**：🎯 BehaviorDetail参数表格整合 - 下一步执行
**第3步**：🔍 检查ModuleDetail是否需要整合
**第4步**：🧹 清理和优化

## 📋 下一步行动

立即开始第2步：整合BehaviorDetail参数表格到UniversalTable
