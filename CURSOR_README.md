# Flowgram 扩展开发文档

## 项目概述
基于开源项目 Flowgram 的扩展开发，主要添加实体属性管理功能。

## 项目启动
```bash
cd apps/demo-free-layout-forked
npm run start
```
启动后查看终端输出获取访问地址。

## 页面结构
- **流程图编辑器**：原始工作流编辑器功能
- **实体属性编辑器测试**：扩展的实体属性管理功能

## 当前扩展功能

### 1. 实体属性编辑器
- 位置：`src/components/ext/entity-properties-editor/`
- 功能：提供可视化的属性编辑界面
- 支持直接属性和模块化属性管理

### 2. 模块化属性管理
- 枚举类管理：`src/components/ext/entity-property-type-selector/enum-store.tsx`
- 模块管理：`src/components/ext/entity-property-type-selector/module-store.tsx`
- 实体管理：`src/components/ext/entity-property-type-selector/entity-store.tsx`

### 3. 预定义模块
- **变换模块(transform)**：位置、旋转、缩放属性
- **物理模块(physics)**：质量、速度、摩擦系数属性
- **外观模块(appearance)**：颜色、材质、透明度属性

## 当前问题

### VariableSelector Provider 依赖问题
- **问题**：实体属性编辑器中使用 PropertiesEdit 时，VariableSelector 报错
- **原因**：缺少完整的 FreeLayoutEditorProvider 上下文
- **状态**：未解决

## 开发状态
- ✅ 模块化属性管理功能已实现
- ✅ 枚举类管理功能已实现
- ❌ VariableSelector Provider 依赖问题未解决
- ❌ 实体属性编辑器测试页面无法正常工作

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
