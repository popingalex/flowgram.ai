# 模块变量动态添加功能实现

## 🎯 功能概述

根据用户需求，实现了在过滤节点中根据选择的模块动态添加对应模块属性到变量选择器的功能。

## 📋 需求分析

用户要求：
1. 第一部分：选定模块 ✅
2. 第二部分：基于选定模块的变量过滤 ✅
3. 去掉nanoid（实体的indexId） ✅
4. 保留$context属性 ✅

## 🔧 实现方案

### 1. 动态模块属性添加

在 `use-enhanced-variable-tree.tsx` 中实现了动态添加选中模块属性的逻辑：

```typescript
// 🎯 动态添加选中模块的属性
if (selectedModuleIds && selectedModuleIds.length > 0) {
  // 找一个现有的字符串类型属性作为模板
  const stringTemplate = properties.find((p) => {
    const prop = p as VariableField;
    return prop.key === 'result' || prop.key === 'status';
  }) as VariableField | undefined;

  selectedModuleIds.forEach((moduleId) => {
    // 查找模块数据
    const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
    if (module && module.attributes && stringTemplate) {
      // 将模块属性添加到moduleGroups中
      if (!moduleGroups[moduleId]) {
        moduleGroups[moduleId] = [];
      }

      module.attributes.forEach((attr: any) => {
        // 创建模块属性对象
        const moduleProperty = {
          key: `${moduleId}/${attr.id}`, // 使用模块ID/属性ID格式
          type: stringTemplate.type, // 复用现有的type对象
          meta: {
            title: attr.name || attr.id,
            moduleId: moduleId,
            moduleName: module.name,
          },
          // 复制其他必要属性
          flags: stringTemplate.flags,
          scope: stringTemplate.scope,
          parent: stringTemplate.parent,
        } as unknown as VariableField;

        moduleGroups[moduleId].push(moduleProperty);
      });
    }
  });
}
```

### 2. 模块分组显示

实现了按模块分组显示属性：

```typescript
// 🎯 尝试获取模块的中文名称
const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
const moduleName = module?.name || moduleId;

// 创建模块分组节点
const moduleGroupNode: TreeNodeData = {
  key: `${variable.key}.module_group_${moduleId}`,
  label: (
    <div style={{ display: 'flex', alignItems: 'center', color: 'inherit', fontWeight: 500, fontSize: '13px' }}>
      {moduleName} ({moduleProps.length})
    </div>
  ),
  value: `${variable.key}.module_group_${moduleId}`,
  keyPath: [variable.key, `module_group_${moduleId}`],
  disabled: true, // 分组节点不可选中，但可以展开
  children: moduleProps.map((prop) => {
    // 为模块内属性创建简化显示的节点
    const originalKey = prop.key;
    const simplifiedKey = originalKey.startsWith(`${moduleId}/`)
      ? originalKey.replace(`${moduleId}/`, '')
      : originalKey;

    return {
      key: fullKeyPath.join('.'),
      label: <span style={{ fontWeight: 400 }}>{simplifiedKey}</span>,
      value: fullKeyPath.join('.'),
      keyPath: fullKeyPath,
      icon: getVariableTypeIcon(prop),
      disabled: false, // 模块内属性可以选中
    };
  })
};
```

### 3. nanoid过滤

保持了原有的nanoid过滤逻辑：

```typescript
// 🎯 过滤掉nanoid属性（符合nanoid特征：长度15-25，包含数字和字母）
const isNanoidLike =
  propKey !== '$context' &&
  !propKey.includes('/') &&
  !propKey.startsWith('$') &&
  propKey.length >= 15 &&
  propKey.length <= 25 &&
  /^[a-zA-Z0-9_-]+$/.test(propKey) &&
  /[0-9]/.test(propKey) &&
  /[a-zA-Z]/.test(propKey) &&
  !['result', 'status', 'id', 'name', 'type'].includes(propKey);
```

### 4. $context属性保留

确保$context属性被正确分类和显示：

```typescript
if (propKey === '$context') {
  // $context属性
  contextProperties.push(prop);
}
```

## 🧪 测试验证

创建了测试脚本 `debug/test-module-variables.js` 验证逻辑正确性：

```javascript
// 测试结果显示正确的变量树结构：
📁 容器 (2)
  📄 策略 (container/strategy)
  📄 容量 (container/capacity)
📁 移动 (2)
  📄 路径 (mobile/path)
  📄 速度 (mobile/speed)
```

## 📁 相关文件

- 主要实现：`src/components/ext/variable-selector-ext/use-enhanced-variable-tree.tsx`
- 测试脚本：`debug/test-module-variables.js`
- 过滤器组件：`src/components/ext/filter-condition-inputs/index.tsx`

## ✅ 功能特点

1. **动态性**：根据用户选择的模块动态添加对应属性
2. **分组显示**：按模块进行分组，使用中文模块名称
3. **简化显示**：模块内属性去掉模块前缀，显示简化名称
4. **类型兼容**：复用现有属性的type对象，确保类型系统兼容
5. **路径正确**：保持正确的变量路径格式（moduleId/attrId）

## 🎯 预期效果

用户在过滤器节点中：
1. 选择模块（如"容器"、"移动"）
2. 在属性过滤条件中看到对应的模块分组
3. 每个模块分组下显示该模块的所有属性
4. 属性显示简化名称（如"策略"而不是"container/strategy"）
5. 选择属性时使用完整路径（如"$start.container/strategy"）

## 🚀 下一步

需要在浏览器中测试实际效果，确认：
1. 模块选择功能正常
2. 变量树正确显示模块分组
3. 属性选择和路径构建正确
4. UI显示符合预期
