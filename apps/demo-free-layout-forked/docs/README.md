# 项目文档

## 文档结构

### 📋 核心架构文档

1. **[业务架构文档](./business-architecture.md)**
   - 项目概述和核心概念
   - 数据存储架构
   - 实体属性架构
   - 界面架构设计

2. **[技术实现文档](./technical-implementation.md)**
   - 技术栈和项目结构
   - 状态管理架构
   - 组件架构设计
   - API 服务层设计

### 🧩 扩展组件文档

3. **[实体属性管理组件](./components/entity-property-components.md)**
   - entity-property-tables 实体属性表格
   - entity-property-type-selector 属性类型选择器
   - 属性编辑和验证逻辑

4. **[模块管理组件](./components/module-components.md)**
   - module-property-tables 模块属性表格
   - module-selector 模块选择器
   - 模块关联和继承逻辑

5. **[增强输入组件](./components/enhanced-input-components.md)**
   - enhanced-dynamic-value-input 增强动态值输入 ✅已完成
   - enhanced-variable-selector 增强变量选择器
   - enhanced-condition-row 增强条件行

6. **[业务逻辑组件](./components/business-logic-components.md)**
   - entity-behavior-workflow-generator 行为工作流生成器
   - invoke-function-selector 函数调用选择器
   - enum-class-selector 枚举类选择器

### 🔧 开发规范文档

7. **[扩展组件开发规范](./development/extension-component-guidelines.md)**
   - 组件设计原则
   - 代码规范和最佳实践
   - 测试要求

8. **[数据流设计规范](./development/data-flow-guidelines.md)**
   - Store 设计模式
   - API 服务层规范
   - Mock 数据管理

9. **[测试和调试指南](./development/testing-debugging-guide.md)**
   - 单元测试规范
   - 集成测试方法
   - 调试工具使用

### 🚀 部署和配置

10. **[环境配置文档](./deployment/environment-setup.md)**
    - 开发环境搭建
    - 生产环境部署
    - 配置参数说明

11. **[API 集成文档](./deployment/api-integration.md)**
    - 后台 API 接口规范
    - Mock 数据配置
    - 环境切换方法

### 📝 问题修复记录

12. **[Start 节点属性展示修复方案](./fix-start-node-property-display.md)** ✅已完成
    - 问题描述和解决方案
    - 详细实现步骤
    - 验证方案和测试

## 最新更新

### 2025-01-14 - Start 节点属性展示修复

#### 问题描述
Start 节点在展示实体属性时存在重复展示模块属性的问题：
- 扩展属性区域错误地展示了来自模块的属性
- 模块清单区域正确地展示了关联的模块列表
- 导致模块属性被展示了两次

#### 解决方案
1. **创建属性过滤工具函数** (`src/utils/property-filters.ts`)
   - `filterEntityExtendedProperties`: 过滤实体扩展属性
   - `filterModuleProperties`: 过滤模块属性
   - `filterMetaProperties`: 过滤基础属性
   - `groupModuleProperties`: 按模块分组模块属性

2. **修复 Start 节点展示逻辑** (`src/form-components/form-outputs/index.tsx`)
   - 修改过滤条件：`!prop.isEntityProperty && !prop.isModuleProperty`
   - 确保 Start 节点只显示实体扩展属性

3. **添加单元测试** (`src/utils/__tests__/property-filters.test.ts`)
   - 验证各种属性过滤函数的正确性
   - 测试边界情况和异常处理

#### 修复结果
- ✅ Start 节点不再重复展示模块属性
- ✅ 正确分类展示各类属性
- ✅ 保持侧边栏展示逻辑不变
- ✅ 界面清晰，信息不冗余

#### 相关文件
- `src/utils/property-filters.ts` - 新建
- `src/form-components/form-outputs/index.tsx` - 修改
- `src/utils/__tests__/property-filters.test.ts` - 新建
- `docs/fix-start-node-property-display.md` - 新建

## 开发规范

### 文档优先原则
- 功能设计前先更新文档
- 保持文档与代码的同步
- 记录重要的设计决策和修复过程

### 文档维护
- 每次重要功能修改都要更新相关文档
- 新增功能需要创建对应的设计文档
- 问题修复需要记录修复过程和验证结果

## 验证步骤

### 启动项目
```bash
rush dev:demo-free-layout-forked
```

### 验证修复效果
1. 选择包含模块属性的实体（如 vehicle）
2. 检查 Start 节点展示：
   - 基础信息区域：显示实体 ID、名称、描述
   - 扩展属性区域：仅显示实体专有属性
   - 模块清单区域：显示关联的模块标签
3. 检查侧边栏展示：
   - 基础属性表单：显示 meta 属性
   - 实体扩展属性表：显示实体专有属性
   - 模块属性表：按模块分组显示模块属性

## 后续计划

### 待优化项目
1. 添加测试框架配置，完善单元测试
2. 优化属性展示的性能
3. 增强属性编辑的用户体验
4. 完善错误处理和边界情况

### 功能扩展
1. 支持属性的批量操作
2. 增加属性的导入导出功能
3. 支持属性模板和预设
4. 增强属性验证和约束
