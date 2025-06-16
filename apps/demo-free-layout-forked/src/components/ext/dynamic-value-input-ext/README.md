# EnhancedDynamicValueInput

增强版的 DynamicValueInput 组件，在原始功能基础上添加了 TreeSelect 父节点展开功能。

## ✅ 已完成功能

### 1. 基础功能（完全兼容原版）
- ✅ 常量和变量引用两种输入模式
- ✅ 类型约束和验证
- ✅ 只读模式和错误状态
- ✅ 完全兼容原始 DynamicValueInput API

### 2. 🎯 核心增强功能
- ✅ **TreeSelect 父节点展开功能**：点击父节点可以展开/收缩子节点
- ✅ **系统属性支持**：显示 $id, $name, $desc 等系统属性
- ✅ **语义化变量名**：使用实际属性ID而不是nanoid作为变量名
- ✅ **自定义VariableSelector**：完全重写的变量选择器，支持展开控制

### 3. 🔧 问题修复
- ✅ 修复了 Start 节点变量显示nanoid的问题
- ✅ 添加了基础系统属性（$id, $name, $desc）
- ✅ 使用语义化的属性ID作为变量key

## 📁 文件结构

```
enhanced-dynamic-value-input/
├── index.tsx                      # 主组件 EnhancedDynamicValueInput
├── enhanced-variable-selector.tsx # 增强的变量选择器（支持父节点展开）
├── styles.tsx                     # 样式组件
├── example.tsx                    # 基础使用示例
├── demo.tsx                       # 完整演示组件
├── test.tsx                       # 测试组件
├── README.md                      # 本文档
└── config.json                    # 配置文件
```

## 🎯 TreeSelect 展开功能实现

### 核心实现原理
```tsx
// 1. 受控的展开状态
const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

// 2. 自定义父节点Label
label: hasChildren ? (
  <div
    onClick={(e) => {
      e.stopPropagation();
      // 切换展开状态
      if (expandedKeys.includes(key)) {
        setExpandedKeys(expandedKeys.filter(k => k !== key));
      } else {
        setExpandedKeys([...expandedKeys, key]);
      }
    }}
  >
    {variable.meta?.title || variable.key}
  </div>
) : (variable.meta?.title || variable.key),

// 3. 父节点禁用选择，只能展开
disabled: hasChildren,
```

### 关键技术要点
- ✅ 使用 `e.stopPropagation()` 阻止事件冒泡
- ✅ 父节点设置 `disabled: true` 防止意外选中
- ✅ 自定义 label 实现点击展开逻辑
- ✅ 受控的 `expandedKeys` 状态管理

## 🔧 变量数据修复

### 问题描述
原始实现中Start节点的变量使用nanoid作为变量名，导致：
- 显示随机字符串而不是语义化名称
- 缺少系统基础属性
- 变量名与实际属性不对应

### 解决方案
```tsx
// 1. 添加系统基础属性
properties['$id'] = {
  id: '$id',
  name: '实体ID',
  type: 'string',
  isSystemProperty: true,
};

// 2. 使用语义化ID作为key
const propertyKey = attr.id; // 使用 "vehicle_yard_id" 而不是 nanoid
properties[propertyKey] = {
  ...attr,
  _indexId: attr._indexId, // 保留原始nanoid用于内部引用
};
```

## 🚀 使用方法

### 基础用法
```tsx
import { EnhancedDynamicValueInput } from '@/components/ext/enhanced-dynamic-value-input';

<EnhancedDynamicValueInput
  value={value}
  onChange={onChange}
  schema={{
    type: 'string',
    title: '输入字段'
  }}
/>
```

### 完整配置
```tsx
<EnhancedDynamicValueInput
  value={value}
  onChange={onChange}
  schema={schema}
  readonly={false}
  hasError={false}
  config={{
    placeholder: '请选择变量...',
    notFoundContent: '未定义变量'
  }}
  includeSchema={includeSchema}
  excludeSchema={excludeSchema}
/>
```

## 📝 API 文档

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| value | `any` | - | 当前值 |
| onChange | `(value: any) => void` | - | 值变化回调 |
| schema | `IJsonSchema` | - | 字段schema定义 |
| readonly | `boolean` | `false` | 是否只读 |
| hasError | `boolean` | `false` | 是否显示错误状态 |
| config | `object` | `{}` | 配置选项 |
| includeSchema | `IJsonSchema \| IJsonSchema[]` | - | 包含的schema类型 |
| excludeSchema | `IJsonSchema \| IJsonSchema[]` | - | 排除的schema类型 |

### Config 选项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| placeholder | `string` | `'Select Variable...'` | 占位符文本 |
| notFoundContent | `string` | `'Undefined'` | 未找到变量时的显示文本 |

## 🎯 集成状态

- ✅ 已集成到 `form-inputs/index.tsx`
- ✅ 替换原始 DynamicValueInput
- ✅ 修复了 Start 节点变量显示问题
- ✅ 支持父节点展开功能
- ✅ 显示正确的系统属性和实体属性

## 🔮 未来增强计划

- 🔄 考虑添加键盘导航支持
- 🔄 考虑添加搜索过滤功能
- 🔄 考虑添加多选模式支持
- 🔄 考虑添加自定义图标支持

## 📚 相关文档

- [原始 DynamicValueInput 文档](https://github.com/bytedance/flowgram.ai/tree/main/packages/materials/form-materials/src/components/dynamic-value-input)
- [Semi TreeSelect 文档](https://semi.design/zh-CN/input/treeselect)
- [变量引擎文档](/guide/advanced/variable/)
