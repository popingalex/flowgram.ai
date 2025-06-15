# Start 节点属性展示修复方案

## 问题描述

### 当前问题
Start 节点在展示实体属性时存在重复展示模块属性的问题：

1. **扩展属性区域**：错误地展示了来自模块的属性
2. **模块清单区域**：正确地展示了关联的模块列表

这导致模块属性被展示了两次，造成界面混乱和信息冗余。

### 问题根源
在 Start 节点的属性展示逻辑中，没有正确过滤属性类型：

```typescript
// 错误的展示逻辑
const allProperties = entity.attributes; // 包含了所有属性，包括模块属性
const moduleList = entity.bundles;       // 又单独展示模块清单

// 结果：模块属性被展示了两次
```

## 解决方案

### 设计原则

Start 节点应该按照以下逻辑展示实体信息：

1. **基础信息区域**：展示实体 ID、名称、描述
2. **扩展属性区域**：仅展示实体专有的扩展属性（排除模块属性和基础属性）
3. **模块清单区域**：展示关联的模块列表（不展示具体属性）

### 属性分类逻辑

```typescript
// 正确的属性分类
interface Attribute {
  id: string;
  name: string;
  type: string;
  _indexId: string;

  // 分类标记
  isEntityProperty?: boolean;  // 基础属性（meta）
  isModuleProperty?: boolean;  // 模块属性
  moduleId?: string;          // 所属模块ID（仅模块属性有值）
}

// 属性过滤函数
const filterEntityExtendedProperties = (attributes: Attribute[]) => {
  return attributes.filter(attr =>
    !attr.isModuleProperty && // 排除模块属性
    !attr.isEntityProperty   // 排除基础属性
  );
};
```

## 实现步骤

### 步骤 1：创建属性过滤工具函数

创建 `src/utils/property-filters.ts` 文件：

```typescript
import type { Attribute } from '../services/types';

/**
 * 过滤实体扩展属性（排除模块属性和基础属性）
 */
export const filterEntityExtendedProperties = (attributes: Attribute[]): Attribute[] => {
  return attributes.filter(attr =>
    !attr.isModuleProperty &&
    !attr.isEntityProperty
  );
};

/**
 * 过滤模块属性
 */
export const filterModuleProperties = (attributes: Attribute[]): Attribute[] => {
  return attributes.filter(attr => attr.isModuleProperty);
};

/**
 * 过滤基础属性（meta属性）
 */
export const filterMetaProperties = (attributes: Attribute[]): Attribute[] => {
  return attributes.filter(attr => attr.isEntityProperty);
};

/**
 * 按模块分组模块属性
 */
export const groupModuleProperties = (attributes: Attribute[]): Record<string, Attribute[]> => {
  const moduleProperties = filterModuleProperties(attributes);

  return moduleProperties.reduce((groups, attr) => {
    const moduleId = attr.moduleId || 'unknown';
    if (!groups[moduleId]) {
      groups[moduleId] = [];
    }
    groups[moduleId].push(attr);
    return groups;
  }, {} as Record<string, Attribute[]>);
};
```

### 步骤 2：修改 Start 节点组件

找到 Start 节点的渲染组件，应用正确的过滤逻辑：

```typescript
// 在 Start 节点组件中
import { filterEntityExtendedProperties } from '../../utils/property-filters';

const StartNodeComponent = ({ entity }: { entity: Entity }) => {
  // 正确过滤扩展属性
  const entityExtendedProperties = useMemo(() =>
    filterEntityExtendedProperties(entity.attributes),
    [entity.attributes]
  );

  // 模块清单
  const moduleList = entity.bundles;

  return (
    <div>
      {/* 基础信息 */}
      <div>
        <h3>{entity.name}</h3>
        <p>ID: {entity.id}</p>
        <p>描述: {entity.description}</p>
      </div>

      {/* 扩展属性（仅实体专有属性） */}
      {entityExtendedProperties.length > 0 && (
        <div>
          <h4>扩展属性</h4>
          <UnifiedPropertyDisplay
            properties={entityExtendedProperties}
            mode="node"
            editable={false}
          />
        </div>
      )}

      {/* 模块清单 */}
      {moduleList.length > 0 && (
        <div>
          <h4>关联模块</h4>
          <div>
            {moduleList.map(moduleId => (
              <Tag key={moduleId}>{moduleId}</Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 步骤 3：更新 UnifiedPropertyDisplay 组件

确保 UnifiedPropertyDisplay 组件能正确处理过滤后的属性：

```typescript
// 在 UnifiedPropertyDisplay 组件中
export const UnifiedPropertyDisplay: React.FC<UnifiedPropertyDisplayProps> = ({
  properties,
  mode,
  editable = false,
  onEdit,
  onDelete,
  onDataRestriction,
}) => {
  // 转换为 PropertyData 格式
  const propertyData: PropertyData[] = properties.map(attr => ({
    key: attr._indexId,
    id: attr.id,
    name: attr.name,
    type: attr.type,
    description: attr.description,
    required: false, // 根据实际需求设置
  }));

  // 根据 mode 调整展示样式
  const displayMode = mode === 'node' ? 'compact' : 'detailed';

  return (
    <div className={`property-display-${displayMode}`}>
      {propertyData.map(property => (
        <PropertyItem
          key={property.key}
          property={property}
          editable={editable}
          onEdit={onEdit}
          onDelete={onDelete}
          onDataRestriction={onDataRestriction}
        />
      ))}
    </div>
  );
};
```

### 步骤 4：添加单元测试

创建测试文件验证过滤逻辑：

```typescript
// src/utils/__tests__/property-filters.test.ts
import { filterEntityExtendedProperties, filterModuleProperties, filterMetaProperties } from '../property-filters';
import type { Attribute } from '../../services/types';

describe('Property Filters', () => {
  const mockAttributes: Attribute[] = [
    {
      id: 'entity_id',
      name: '实体ID',
      type: 'string',
      _indexId: 'meta1',
      isEntityProperty: true,
    },
    {
      id: 'custom_field',
      name: '自定义字段',
      type: 'string',
      _indexId: 'ext1',
    },
    {
      id: 'mobile/speed',
      name: '移动速度',
      type: 'number',
      _indexId: 'mod1',
      isModuleProperty: true,
      moduleId: 'mobile',
    },
  ];

  it('should filter entity extended properties correctly', () => {
    const result = filterEntityExtendedProperties(mockAttributes);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('custom_field');
  });

  it('should filter module properties correctly', () => {
    const result = filterModuleProperties(mockAttributes);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('mobile/speed');
  });

  it('should filter meta properties correctly', () => {
    const result = filterMetaProperties(mockAttributes);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entity_id');
  });
});
```

## 验证方案

### 验证步骤

1. **启动开发服务器**
   ```bash
   rush dev:demo-free-layout-forked
   ```

2. **选择包含模块属性的实体**
   - 选择一个关联了模块的实体（如 vehicle）
   - 确保该实体有扩展属性和模块属性

3. **检查 Start 节点展示**
   - 基础信息区域：显示实体 ID、名称、描述
   - 扩展属性区域：仅显示实体专有属性，不显示模块属性
   - 模块清单区域：显示关联的模块标签

4. **检查侧边栏展示**
   - 基础属性表单：显示 meta 属性
   - 实体扩展属性表：显示实体专有属性
   - 模块属性表：按模块分组显示模块属性

### 预期结果

修复后的 Start 节点应该：

1. ✅ **不重复展示模块属性**
2. ✅ **正确分类展示各类属性**
3. ✅ **保持侧边栏展示不变**
4. ✅ **界面清晰，信息不冗余**

## 相关文件

### 需要修改的文件

1. `src/utils/property-filters.ts` - 新建属性过滤工具函数
2. `src/nodes/start/form-meta.tsx` - 修改 Start 节点渲染逻辑
3. `src/components/ext/entity-property-tables/unified-display.tsx` - 确保组件兼容

### 需要测试的文件

1. `src/utils/__tests__/property-filters.test.ts` - 新建测试文件
2. Start 节点相关的集成测试

## 注意事项

### 兼容性考虑

1. **保持侧边栏功能不变**：侧边栏的展示逻辑是正确的，不需要修改
2. **保持数据结构不变**：只修改展示逻辑，不修改数据结构
3. **保持 API 接口不变**：不影响与后台的数据交互

### 性能考虑

1. **使用 useMemo 缓存过滤结果**：避免不必要的重复计算
2. **使用 React.memo 优化组件渲染**：减少不必要的重新渲染

### 可扩展性考虑

1. **工具函数设计**：便于后续添加新的属性分类
2. **组件设计**：支持不同的展示模式和配置
