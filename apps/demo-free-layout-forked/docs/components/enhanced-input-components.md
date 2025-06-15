# 增强输入组件设计文档

## 📋 概述

增强输入组件提供了比原始 Flowgram 组件更强大的用户交互体验，特别是在变量选择和条件编辑方面。这些组件专门为仿真系统的实体编辑场景进行了优化。

## 🧩 组件架构

### 1. enhanced-dynamic-value-input 增强动态值输入 ✅

#### 功能描述
- 支持常量和变量引用两种输入模式
- 集成增强的变量选择器，支持父节点展开功能
- 完全兼容原始 DynamicValueInput API
- 修复了 Start 节点变量显示问题

#### 核心特性
- ✅ **TreeSelect 父节点展开功能**：点击父节点可以展开/收缩子节点
- ✅ **系统属性支持**：显示 $id, $name, $desc 等系统属性
- ✅ **语义化变量名**：使用实际属性ID而不是nanoid作为变量名
- ✅ **自定义VariableSelector**：完全重写的变量选择器

#### 文件结构
```
enhanced-dynamic-value-input/
├── index.tsx                      # 主组件
├── enhanced-variable-selector.tsx # 增强的变量选择器
├── styles.tsx                     # 样式组件
├── README.md                      # 详细文档 ✅
└── __tests__/                     # 测试文件
```

### 2. enhanced-variable-selector 增强变量选择器

#### 功能描述
- 提供树形结构的变量选择界面
- 支持按模块分组展示模块属性
- $context 节点不可选中但可展开
- 优化的搜索和过滤功能

#### 核心特性

##### 🎯 $context 节点处理
```typescript
// $context节点：不可选中，但可以展开查看子节点
const isContextNode = variable.key === '$context' && parentFields.length === 0;
const shouldDisable = isContextNode || (!!children?.length && isStartNode) || !isSchemaMatch;
```

##### 🎯 模块属性分组展示
```typescript
// 创建模块分组节点
const moduleGroupNode: TreeNodeData = {
  key: `${variable.key}.module_group_${moduleId}`,
  label: (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      color: '#1890ff',
      fontWeight: 500
    }}>
      <Icon size="small" svg={VariableTypeIcons.object} />
      <span>📦 {moduleName}</span>
      <span style={{ color: '#666', fontSize: '12px' }}>
        ({moduleProps.length} 个属性)
      </span>
    </div>
  ),
  disabled: true, // 分组节点不可选中，但可以展开
  children: moduleProps.map(/* 模块内属性 */)
};
```

##### 🎯 简化的模块属性显示
- 模块内属性去掉模块前缀，显示简化名称
- 保持完整的 keyPath 用于实际选择
- 左右布局：属性ID + 中文名称

#### 文件结构
```
enhanced-variable-selector/
├── index.tsx                    # 主选择器组件
├── use-enhanced-variable-tree.tsx # 变量树构建逻辑
└── __tests__/                   # 测试文件
```

### 3. enhanced-condition-row 增强条件行

#### 功能描述
- 提供更直观的条件编辑界面
- 支持复杂的逻辑运算符
- 集成增强的变量选择器

#### 文件结构
```
enhanced-condition-row/
├── index.tsx           # 主组件
├── types.ts           # 类型定义
├── constants.ts       # 常量定义
├── styles.tsx         # 样式组件
├── hooks/             # 自定义 Hooks
│   ├── useOp.tsx
│   └── useRule.ts
└── __tests__/         # 测试文件
```

## 🎯 关键优化点

### 1. 变量选择器交互优化

#### 问题描述
原始变量选择器存在以下问题：
- $context 节点可以被选中，但实际无意义
- 模块属性显示混乱，没有按模块分组
- 属性名显示 nanoid 而不是语义化名称

#### 解决方案
```typescript
// 1. $context 节点禁用选择，保留展开功能
const isContextNode = variable.key === '$context' && parentFields.length === 0;
const shouldDisable = isContextNode || /* 其他禁用条件 */;

// 2. 模块属性按模块分组
Object.entries(moduleGroups).forEach(([moduleId, moduleProps]) => {
  const moduleGroupNode: TreeNodeData = {
    disabled: true, // 分组节点不可选中
    children: moduleProps.map(/* 模块内属性 */)
  };
});

// 3. 使用语义化的属性ID
const simplifiedKey = originalKey.startsWith(`${moduleId}/`)
  ? originalKey.replace(`${moduleId}/`, '')
  : originalKey;
```

### 2. 视觉设计优化

#### 分组节点样式
```typescript
const moduleGroupLabel = (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    color: '#1890ff',
    fontWeight: 500
  }}>
    <Icon size="small" svg={VariableTypeIcons.object} />
    <span>📦 {moduleName}</span>
    <span style={{ color: '#666', fontSize: '12px' }}>
      ({moduleProps.length} 个属性)
    </span>
  </div>
);
```

#### $context 节点样式
```typescript
const contextLabel = (
  <span style={{
    fontWeight: 500,
    color: '#1890ff'
  }}>
    {variable.key}
  </span>
);
```

### 3. 搜索和过滤优化

```typescript
const filterTreeNode = useCallback(
  (inputValue: string, treeNodeString: string, data?: TreeNodeData) => {
    // 搜索节点的key、value、label
    // 搜索meta信息
    // 对于模块属性，搜索原始属性名（去掉模块前缀）
    if (data.meta?.isModuleProperty && typeof data.meta.id === 'string') {
      const originalAttrName = data.meta.id.split('/').pop() || '';
      if (originalAttrName.toLowerCase().includes(searchText)) {
        return true;
      }
    }

    return /* 其他搜索逻辑 */;
  },
  []
);
```

## 🧪 测试策略

### 单元测试
- 变量树构建逻辑测试
- 模块分组功能测试
- 搜索过滤功能测试
- 禁用状态测试

### 集成测试
- 与表单组件的集成测试
- 变量选择和值更新测试
- 用户交互流程测试

### 用户体验测试
- $context 节点交互测试
- 模块属性选择测试
- 搜索功能可用性测试

## 📝 使用示例

### 基础用法
```tsx
import { EnhancedDynamicValueInput } from '@/components/ext/enhanced-dynamic-value-input';

<EnhancedDynamicValueInput
  value={value}
  onChange={onChange}
  schema={{ type: 'string' }}
/>
```

### 高级配置
```tsx
<EnhancedDynamicValueInput
  value={value}
  onChange={onChange}
  schema={schema}
  config={{
    placeholder: '请选择变量或输入值...',
    notFoundContent: '未定义变量'
  }}
  includeSchema={includeSchema}
  excludeSchema={excludeSchema}
/>
```

## 🔮 未来规划

### 短期优化
- [ ] 添加键盘导航支持
- [ ] 优化大量变量时的渲染性能
- [ ] 增强搜索功能（支持拼音搜索）

### 长期扩展
- [ ] 支持多选模式
- [ ] 添加变量使用统计
- [ ] 支持自定义图标和样式
- [ ] 添加变量预览功能

## 📚 相关文档

- [enhanced-dynamic-value-input README](../../src/components/ext/enhanced-dynamic-value-input/README.md)
- [业务架构文档](../business-architecture.md)
- [扩展组件开发规范](../development/extension-component-guidelines.md)

## 🔄 更新记录

### 2025-01-14 - 变量选择器优化
- ✅ $context 节点设置为不可选中但可展开
- ✅ 模块属性按模块分组展示
- ✅ 优化分组节点的视觉设计
- ✅ 简化模块内属性的显示名称
- ✅ 增强搜索和过滤功能
