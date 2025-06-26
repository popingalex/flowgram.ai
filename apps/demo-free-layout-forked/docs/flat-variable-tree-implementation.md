# 扁平化变量树实现

## 🎯 用户需求

用户要求变量选择器的结构为：
1. 去掉重复的Start节点（`$Start` 和 `6VpMPdv8JbLqmrO7W8OWV`）
2. 在第一级直接显示：
   - 选中的模块（显示为 `id (name)` 格式）
   - `$context`
3. 模块内的属性去掉前缀显示
4. 模块必须显示 `id (name)` 格式，不能只显示name

## 🔧 实现方案

### 核心逻辑修改

在 `use-enhanced-variable-tree.tsx` 中，当检测到传入了 `selectedModuleIds` 参数时，创建扁平的第一级结构：

```typescript
if (
  parentFields.length === 0 &&
  type.properties &&
  Array.isArray(type.properties) &&
  type.properties.length > 0 &&
  selectedModuleIds !== undefined // 只要传入了selectedModuleIds参数就进行特殊处理
) {
  // 🎯 创建扁平的第一级结构
  children = [];

  // 1. 添加$context节点
  const properties = type.properties || [];
  const contextProperty = properties.find((p) => (p as VariableField).key === '$context');
  if (contextProperty) {
    const contextNode: TreeNodeData = {
      key: '$context',
      label: <span style={{ fontWeight: 400 }}>$context</span>,
      value: '$context',
      keyPath: ['$context'],
      icon: getVariableTypeIcon(contextProperty),
      disabled: false,
    };
    children.push(contextNode);
  }

  // 2. 为每个选中的模块创建第一级节点
  if (selectedModuleIds && selectedModuleIds.length > 0) {
    selectedModuleIds.forEach((moduleId) => {
      const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
      if (module && module.attributes) {
        // 🎯 创建模块节点（第一级）
        const moduleNode: TreeNodeData = {
          key: moduleId,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
              {moduleId} ({module.name})
            </div>
          ),
          value: moduleId,
          keyPath: [moduleId],
          disabled: true, // 模块节点不可选中，但可以展开
          children: module.attributes.map((attr: any) => ({
            key: `${moduleId}/${attr.id}`,
            label: <span style={{ fontWeight: 400 }}>{attr.name || attr.id}</span>,
            value: `${moduleId}/${attr.id}`,
            keyPath: [`${moduleId}/${attr.id}`],
            icon: getVariableTypeIcon(stringTemplate),
            disabled: false, // 属性可以选中
          })),
        };

        children.push(moduleNode);
      }
    });
  }
}
```

## 📊 结构对比

### 旧结构（多层嵌套）
```
📁 6VpMPdv8JbLqmrO7W8OWV
  📄 result
  📄 status
  📁 容器 (3)
    📄 container/content
    📄 container/strategy
    📄 container/capacity
  📄 $context
📁 $start
  📄 result
```

### 新结构（扁平化）
```
📄 $context
📁 container (容器)
  📄 策略
  📄 容量
📁 mobile (移动)
  📄 路径
  📄 速度
```

## ✅ 实现特点

### 1. 扁平化第一级
- 去掉了重复的Start节点
- 第一级直接显示模块和$context
- 结构更简洁清晰

### 2. 模块显示格式
- 模块标题：`id (name)` 格式，如 `container (容器)`
- 满足用户要求同时显示id和name
- 使用加粗字体突出显示

### 3. 属性显示优化
- 模块内属性去掉前缀显示
- 显示中文名称：`策略` 而不是 `container/strategy`
- 保持正确的变量路径：`container/strategy`

### 4. 交互逻辑
- 模块节点不可选中，但可以展开
- 属性节点可以选中
- $context节点可以直接选中

## 🔄 数据流

1. **触发条件**：当 `selectedModuleIds` 参数传入时
2. **$context处理**：从原始properties中提取$context属性
3. **模块处理**：根据selectedModuleIds动态创建模块节点
4. **属性处理**：每个模块的attributes转换为子节点
5. **路径构建**：保持 `moduleId/attrId` 格式用于变量引用

## 🎯 用户体验

### 使用流程
1. 用户在过滤器的"模块过滤条件"中选择模块
2. 在"属性过滤条件"的变量选择器中看到：
   - 第一级：`$context` 和选中的模块
   - 模块展开后：该模块的所有属性
3. 选择属性时，变量路径为完整格式（如 `container/strategy`）

### 显示效果
- **简洁性**：去掉了冗余的嵌套层级
- **清晰性**：模块和属性层次分明
- **一致性**：模块显示格式统一为 `id (name)`
- **易用性**：属性名称本地化显示

## 🚀 技术优势

1. **性能优化**：减少了不必要的节点渲染
2. **逻辑清晰**：扁平化结构更容易理解和维护
3. **兼容性**：保持了原有的变量路径格式
4. **可扩展性**：易于添加新的第一级节点类型

## 📁 相关文件

- 主要实现：`src/components/ext/variable-selector-ext/use-enhanced-variable-tree.tsx`
- 测试脚本：`debug/test-flat-structure.js`
- 过滤器组件：`src/components/ext/filter-condition-inputs/index.tsx`
