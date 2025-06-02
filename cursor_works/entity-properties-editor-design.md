# 实体属性编辑器设计文档

## 🎯 核心问题解决方案

### 问题背景
- React组件中使用可变属性作为key导致input失去焦点
- 用户修改属性名时，组件重新渲染，编辑状态丢失
- 数据结构过于复杂，维护困难

### 解决方案：nanoid索引设计模式

## 📊 数据结构设计

### 1. Store数据结构 (后台交互)
```javascript
// 存储在 [entity-store](mdc:apps/demo-free-layout-forked/src/components/ext/entity-store/index.tsx) 中
{
  id: "helicopter",
  name: "直升机",
  bundles: ["container", "mobile", "controlled"], // 完整关联的模块
  attributes: [
    { id: "vehicle_yard_id", name: "集结点id", type: "s", enumClassId: "yard_enum" },
    { id: "task_id", name: "任务id", type: "s" }
  ]
}
```

### 2. JSONSchema数据结构 (节点编辑器)
```javascript
// 在 [entity-properties-editor](mdc:apps/demo-free-layout-forked/src/components/ext/entity-properties-editor/index.tsx) 中处理
{
  type: "object",
  properties: {
    "abc123": {                    // nanoid作为key - React key专用
      id: "vehicle_yard_id",       // 原始英文标识符
      name: "集结点id",            // 原始中文名称
      type: "string",              // 转换后的JSONSchema类型
      title: "集结点id",           // 显示名称（可编辑）
      description: "...",          // 描述信息
      enumClassId: "yard_enum",    // 保留的meta属性
      _id: "abc123",               // 索引ID - 与key相同
      isEntityProperty: true       // 属性分类标记
    },
    "def456": {                    // nanoid作为key
      id: "container/content",     // 模块属性ID格式
      name: "内容物",              // 原始中文名称
      type: "array",
      items: { type: "string" },
      title: "内容物",
      description: "来自模块: 容器",
      _id: "def456",               // 索引ID
      isModuleProperty: true,      // 模块属性标记
      moduleId: "container"        // 所属模块ID
    }
  }
}
```

## 🔑 nanoid索引设计核心

### 索引ID (nanoid)
- **用途**: React key专用，确保组件稳定性
- **特点**: 永远不变，使用nanoid生成
- **生成**: `nanoid()` - 短小精悍的唯一标识符
- **使用**: 作为properties的key和_id字段

### 语义化ID (title)
- **用途**: 用户界面显示，用户可编辑
- **特点**: 可修改，不影响React渲染
- **显示**: 在input中展示给用户编辑
- **存储**: JSONSchema的 `title` 字段

### Meta属性保留
- **原则**: 使用`...attr`保留所有原始Attribute属性
- **包含**: id, name, type, description, enumClassId等所有字段
- **覆盖**: 只覆盖需要转换的字段（如type转换为JSONSchema格式）

## 🔄 属性分类逻辑

### 1. 实体直接属性
- **来源**: `entity.attributes`
- **标记**: `isEntityProperty: true`
- **可编辑**: 是

### 2. 完整关联模块属性
- **来源**: `entity.bundles` 中的模块
- **标记**: `isModuleProperty: true`
- **ID格式**: `moduleId/attrId`
- **可编辑**: 否 (只读)

### 3. 部分关联模块属性
- **来源**: 单独添加的模块属性
- **标记**: `isModuleProperty: true`
- **可编辑**: 是 (可删除)

### 4. 用户自定义属性
- **来源**: 用户手动添加
- **标记**: 无特殊标记
- **可编辑**: 是

## 🛠️ 实现要点

### React Key使用
```javascript
// ✅ 正确 - 使用稳定的nanoid
<PropertyEdit key={nanoidKey} />

// ❌ 错误 - 使用可变的语义化ID
<PropertyEdit key={property.title} />
```

### 属性编辑逻辑
```javascript
// 编辑属性名时，只修改title，不动nanoid key
const handleEditProperty = (nanoidKey, updatedFields) => {
  // nanoidKey 是 properties的key (nanoid)
  // updatedFields.title 是新的语义化名称
  // nanoid key 永远不变，确保React组件稳定
}
```

### 数据持久化
- nanoid存储在 properties的key和`_id` 字段中
- 重新加载时从 `_id` 恢复，确保React key稳定
- 如果没有 `_id`，生成新的nanoid

## 🚫 避免的反模式

1. **不要用属性内容作为React key**
   ```javascript
   // ❌ 错误
   key={`entity_${attr.id}`}
   key={`custom_${propertyName}`}
   ```

2. **不要在编辑时重新生成nanoid**
   ```javascript
   // ❌ 错误 - 每次编辑都生成新nanoid
   _id: nanoid()
   ```

3. **不要隐藏meta属性**
   ```javascript
   // ❌ 错误 - 只保留部分属性
   { type, title, description }

   // ✅ 正确 - 保留所有原始属性
   { ...attr, type: convertedType, title: displayName }
   ```

## 📁 相关文件

- 主组件: [entity-properties-editor/index.tsx](mdc:apps/demo-free-layout-forked/src/components/ext/entity-properties-editor/index.tsx)
- 实体存储: [entity-store/index.tsx](mdc:apps/demo-free-layout-forked/src/components/ext/entity-store/index.tsx)
- 模块存储: [module-store.tsx](mdc:apps/demo-free-layout-forked/src/components/ext/entity-property-type-selector/module-store.tsx)

## ✅ 验证标准

1. 修改属性名时input不失去焦点
2. 属性顺序保持稳定
3. 页面刷新后React key保持不变
4. 数据结构简洁清晰
5. 性能良好，无不必要的重新渲染
6. 所有meta属性都被保留和显示
