# 实体属性编辑器 (Entity Properties Editor)

## 概述

基于 `@flowgram.ai/form-materials` 的 `JsonSchemaEditor` 实现的增强版本，主要特性：

1. **去除 integer 类型**：只保留 string、number、boolean、object、array 类型
2. **数据限制功能**：为字符串类型添加枚举值限制功能
3. **现代化UI**：使用尺子图标表示数据限制，提供直观的用户体验
4. **优化布局**：调整属性编辑器的布局比例和最小宽度

## 文件结构

```
src/components/ext/
├── entity-properties-editor/
│   ├── index.tsx                    # 主编辑器组件
│   ├── styles.tsx                   # 自定义样式组件
│   └── test-page.tsx               # 测试页面
└── entity-property-type-selector/
    ├── index.tsx                   # 类型选择器组件
    ├── constants.tsx               # 常量和图标定义
    └── data-restriction-modal.tsx  # 数据限制弹窗
```

## 主要功能

### 1. 类型选择器 (EntityPropertyTypeSelector)

- 支持基础类型：string、number、boolean、object、array
- 字符串类型旁显示数据限制按钮（尺子图标）
- 非字符串类型显示禁用的占位按钮
- 有枚举值时按钮高亮显示
- 鼠标悬停显示"数据限制"提示

### 2. 布局优化

**响应式布局设计：**
- 容器最小宽度：500px，避免过于拘谨
- 属性名称：flex: 1，填充剩余宽度
- 类型选择器：固定宽度 152px（120px选择器 + 28px按钮 + 4px间距）
- 必填复选框：固定宽度 24px，居中对齐
- 操作按钮：固定宽度，防止挤压
- 子属性保持原版缩进效果

### 3. 数据限制弹窗 (DataRestrictionModal)

**网格卡片布局：**
- 弹窗尺寸：800x600px
- 顶部搜索栏：支持过滤枚举类
- 网格布局：自适应列数，最小宽度350px
- 卡片直接编辑：点击卡片选择，点击编辑按钮进入编辑模式

**功能特性：**
- 搜索过滤枚举类（名称、描述、枚举值）
- 新建/编辑/删除枚举类
- 选择枚举类应用到属性
- 支持"不限制"选项清除枚举值
- 显示当前匹配的枚举类
- 卡片内直接编辑，无需右侧面板

**枚举类管理：**
- 只读模式：显示名称、描述、枚举值标签（最多8个，超出显示+N）
- 编辑模式：表单编辑，支持动态添加/删除枚举值
- 一键切换编辑/只读状态
- 确定/取消/不限制三个操作按钮

### 4. 预设枚举类

系统预置了常用的枚举类：
- **车辆类型**：推土机、挖掘机、装载机、压路机、起重机
- **颜色**：红色、蓝色、绿色、黄色、黑色、白色
- **尺寸**：XS、S、M、L、XL、XXL

## 使用方法

### 基础用法

```tsx
import { EntityPropertiesEditor } from './components/ext/entity-properties-editor';

function MyComponent() {
  const [schema, setSchema] = useState<IJsonSchema>({
    type: 'object',
    properties: {}
  });

  return (
    <EntityPropertiesEditor
      value={schema}
      onChange={setSchema}
      config={{
        placeholder: '输入属性名称',
        descTitle: '描述',
        descPlaceholder: '帮助AI理解这个属性',
        addButtonText: '添加属性',
      }}
    />
  );
}
```

### 向后兼容

组件同时导出为 `JsonSchemaEditor`，保持与原版API兼容：

```tsx
import { JsonSchemaEditor } from './components/ext/entity-properties-editor';
// 使用方式完全相同
```

## 设计理念

### 数据限制 vs 枚举类型

- **理念**：枚举本质是对字符串数据的限制，而不是独立的数据类型
- **实现**：在字符串类型基础上添加限制功能，而非创建新类型
- **图标**：使用尺子图标象征"测量/限制"的概念

### 用户体验

1. **渐进式披露**：只在字符串类型时显示限制按钮
2. **视觉反馈**：有限制时按钮高亮，无限制时半透明
3. **操作便捷**：支持重复点击取消选择，提供明确的"不限制"选项
4. **布局清晰**：网格卡片布局，直接在卡片中编辑
5. **响应式设计**：固定关键元素宽度，属性名称自适应填充

### 布局优化原则

1. **最小宽度保证**：避免界面过于拥挤
2. **固定关键元素**：类型选择器、按钮等保持固定宽度
3. **弹性填充**：属性名称区域自适应剩余空间
4. **一致性**：保持与原版相同的视觉层次和缩进

## 技术特点

- **类型安全**：完整的 TypeScript 类型定义
- **组件化**：模块化设计，易于维护和扩展
- **样式隔离**：自定义样式组件，不影响原版
- **扩展性**：为后续数据服务集成预留接口
- **最小侵入**：只修改必要部分，其他功能复用原版

## 测试

访问应用并切换到"实体属性编辑器测试"页面，可以：

1. 添加字符串类型属性
2. 点击尺子图标打开数据限制弹窗
3. 选择或创建枚举类
4. 查看生成的JSON Schema
5. 测试布局在不同宽度下的表现

## 后续扩展

- [ ] 支持从远程API加载枚举类
- [ ] 支持枚举类的分类管理
- [ ] 支持枚举值的国际化
- [ ] 支持枚举值的验证规则
- [ ] 支持更多数据限制类型（如数值范围、字符串长度等）
