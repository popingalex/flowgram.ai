# 属性组件归档

## 整合背景

项目中原本有多个分散的属性相关组件，功能重复且维护困难。现已整合为单一的 `UniversalPropertyTable` 组件。

## 整合时间
2025-06-16

## 归档内容

### 已废弃的组件

1. **unified-property-table/** - 与 `UniversalPropertyTable` 功能重复，未被使用
2. **property-panel/** - 只是 `UniversalPropertyTable` 的简单包装器
3. **property-list/** - 旧的实体属性组件
4. **property-list-bt/** - 旧的实体属性组件(bt版本)
5. **property-tree-bt/** - 旧的模块属性组件

注意：`ext/` 目录已恢复到 `src/components/ext/`，因为其中包含仍在使用的组件（如 `type-selector-ext`、`dynamic-value-input-ext` 等）。

### 当前使用的组件

- **`src/components/bt/universal-property-table/`** - 统一的属性组件
  - 支持实体属性和模块属性
  - 支持 sidebar 和 node 两种显示模式
  - 支持编辑和只读状态

## 功能对照

| 原组件 | 功能 | 新组件中的实现 |
|--------|------|----------------|
| property-list/sidebar-editor | 实体属性编辑 | UniversalPropertyTable (showEntityProperties=true) |
| property-tree-bt/sidebar-tree | 模块属性管理 | UniversalPropertyTable (showModuleProperties=true) |
| property-tree-bt/node-display | 节点模块显示 | UniversalPropertyTable (mode='node') |
| property-panel | 属性面板 | UniversalPropertyTable 直接使用 |
| unified-property-table | 统一属性表格 | 被 UniversalPropertyTable 替代 |

## 恢复说明

如果需要恢复某个组件的功能，可以：
1. 从归档目录复制相关代码
2. 参考 `UniversalPropertyTable` 的实现
3. 查看 git 历史记录
