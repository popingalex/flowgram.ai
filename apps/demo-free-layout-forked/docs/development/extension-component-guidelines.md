# 扩展组件开发规范

## 📋 概述

本文档定义了 `src/components/ext/` 目录下扩展组件的开发规范，确保代码质量、一致性和可维护性。

## 🎯 设计原则

### 1. 单一职责原则
- 每个组件只负责一个明确的功能
- 避免组件功能过于复杂
- 通过组合而非继承实现复杂功能

### 2. 数据驱动原则
- 组件状态完全由 props 和 Store 驱动
- 避免组件内部维护复杂状态
- 使用受控组件模式

### 3. 类型安全原则
- 严格的 TypeScript 类型定义
- 所有 props 和状态都要有明确类型
- 使用泛型提高代码复用性

### 4. 可测试性原则
- 组件逻辑易于单元测试
- 避免直接操作 DOM
- 使用依赖注入模式

## 📁 目录结构规范

### 标准组件目录结构
```
component-name/
├── index.tsx           # 主组件导出
├── types.ts           # 类型定义
├── hooks/             # 自定义 Hooks
│   ├── useComponentLogic.ts
│   └── index.ts
├── components/        # 子组件
│   ├── SubComponent.tsx
│   └── index.ts
├── styles.tsx         # 样式组件
├── constants.ts       # 常量定义
├── utils.ts          # 工具函数
├── README.md         # 组件文档
└── __tests__/        # 测试文件
    ├── index.test.tsx
    └── utils.test.ts
```

### 简单组件结构
```
simple-component/
├── index.tsx         # 主组件
├── types.ts         # 类型定义
├── README.md        # 组件文档
└── __tests__/       # 测试文件
    └── index.test.tsx
```

## 🔧 代码规范

### 1. 组件命名规范
```typescript
// ✅ 正确：使用 PascalCase
export const EntityPropertyTable: React.FC<Props> = (props) => {
  // ...
};

// ❌ 错误：使用 camelCase
export const entityPropertyTable: React.FC<Props> = (props) => {
  // ...
};
```

### 2. Props 接口定义
```typescript
// ✅ 正确：明确的接口定义
interface EntityPropertyTableProps {
  entity: Entity;
  readonly?: boolean;
  onPropertyChange?: (properties: Attribute[]) => void;
  className?: string;
}

// ❌ 错误：使用 any 类型
interface EntityPropertyTableProps {
  entity: any;
  onPropertyChange?: (data: any) => void;
}
```

### 3. 状态管理规范
```typescript
// ✅ 正确：使用 Store 管理状态
const EntityPropertyEditor: React.FC<Props> = ({ entity }) => {
  const { updateEntity } = useCurrentEntityActions();

  const handlePropertyChange = (properties: Attribute[]) => {
    updateEntity({ ...entity, attributes: properties });
  };

  return <PropertyTable onPropertyChange={handlePropertyChange} />;
};

// ❌ 错误：组件内部维护复杂状态
const EntityPropertyEditor: React.FC<Props> = ({ entity }) => {
  const [localEntity, setLocalEntity] = useState(entity);
  const [isDirty, setIsDirty] = useState(false);
  // 复杂的状态管理逻辑...
};
```

### 4. 错误处理规范
```typescript
// ✅ 正确：统一的错误处理
const EntityPropertyEditor: React.FC<Props> = ({ entity }) => {
  const handleSave = async () => {
    try {
      await saveEntity(entity);
      Toast.success('保存成功');
    } catch (error) {
      console.error('保存实体失败:', error);
      Toast.error('保存失败，请重试');
    }
  };

  return <SaveButton onClick={handleSave} />;
};
```

## 🎨 样式规范

### 1. 使用 Semi Design 组件
```typescript
// ✅ 正确：优先使用 Semi Design 组件
import { Table, Button, Modal, Form } from '@douyinfe/semi-ui';

const PropertyTable: React.FC = () => {
  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
    />
  );
};
```

### 2. 自定义样式组件
```typescript
// ✅ 正确：使用 styled-components
import styled from 'styled-components';

const StyledContainer = styled.div`
  padding: 16px;
  border: 1px solid var(--semi-color-border);
  border-radius: 6px;

  .property-row {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;
```

### 3. 响应式设计
```typescript
// ✅ 正确：考虑响应式设计
const ResponsiveContainer = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;
```

## 🧪 测试规范

### 1. 单元测试结构
```typescript
// __tests__/EntityPropertyTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityPropertyTable } from '../index';
import { mockEntity } from '../../__mocks__/entity';

describe('EntityPropertyTable', () => {
  const defaultProps = {
    entity: mockEntity,
    onPropertyChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render entity properties correctly', () => {
    render(<EntityPropertyTable {...defaultProps} />);

    expect(screen.getByText('属性名称')).toBeInTheDocument();
    expect(screen.getByText('属性类型')).toBeInTheDocument();
  });

  it('should call onPropertyChange when property is modified', () => {
    render(<EntityPropertyTable {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: '编辑' });
    fireEvent.click(editButton);

    expect(defaultProps.onPropertyChange).toHaveBeenCalled();
  });
});
```

### 2. Mock 数据规范
```typescript
// __mocks__/entity.ts
export const mockEntity: Entity = {
  id: 'test-entity',
  name: '测试实体',
  description: '用于测试的实体',
  deprecated: false,
  attributes: [
    {
      id: 'test-attr',
      name: '测试属性',
      type: 'string',
      _indexId: 'mock-nanoid-123',
      isEntityProperty: true,
    },
  ],
  bundles: [],
  _indexId: 'mock-entity-nanoid',
};
```

## 📚 文档规范

### 1. README.md 结构
```markdown
# ComponentName

组件简要描述

## ✅ 功能特性

- 功能点1
- 功能点2

## 🚀 使用方法

### 基础用法
```tsx
<ComponentName prop1="value1" prop2="value2" />
```

### 高级用法
```tsx
<ComponentName
  prop1="value1"
  prop2="value2"
  onEvent={handleEvent}
/>
```

## 📝 API 文档

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| prop1 | string | - | 属性描述 |

## 🔮 未来规划

- [ ] 待实现功能1
- [ ] 待实现功能2
```

### 2. 代码注释规范
```typescript
/**
 * 实体属性表格组件
 *
 * @description 用于展示和编辑实体的属性信息
 * @example
 * ```tsx
 * <EntityPropertyTable
 *   entity={entity}
 *   onPropertyChange={handleChange}
 * />
 * ```
 */
export const EntityPropertyTable: React.FC<EntityPropertyTableProps> = ({
  entity,
  readonly = false,
  onPropertyChange,
  className,
}) => {
  // 组件实现...
};
```

## 🔄 开发流程

### 1. 组件开发流程
1. **需求分析**：明确组件功能和接口
2. **设计文档**：编写组件设计文档
3. **类型定义**：定义 TypeScript 接口
4. **组件实现**：编写组件代码
5. **单元测试**：编写测试用例
6. **文档更新**：更新 README 和 API 文档
7. **代码审查**：提交代码审查
8. **集成测试**：验证组件集成效果

### 2. 版本管理
- 使用语义化版本号
- 记录重要变更历史
- 保持向后兼容性

### 3. 性能优化
- 使用 React.memo 优化渲染
- 避免不必要的重新渲染
- 合理使用 useMemo 和 useCallback

## ⚠️ 注意事项

### 1. 禁止事项
- ❌ 不要修改 `packages/` 目录下的引擎代码
- ❌ 不要在组件中直接操作 DOM
- ❌ 不要使用全局变量
- ❌ 不要忽略 TypeScript 类型检查

### 2. 最佳实践
- ✅ 优先使用 Semi Design 组件
- ✅ 保持组件的纯函数特性
- ✅ 使用 Store 管理全局状态
- ✅ 编写完整的单元测试
- ✅ 保持代码简洁和可读性

## 📞 支持和反馈

如有问题或建议，请：
1. 查阅相关文档
2. 检查现有组件实现
3. 提交 Issue 或 PR
4. 联系开发团队
