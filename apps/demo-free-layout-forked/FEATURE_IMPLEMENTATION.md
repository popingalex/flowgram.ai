# 模块关联实体功能实现

## 功能概述

基于实体列表展示关联模块的方式，实现了模块列表展示关联实体数量，以及模块详情页的关联实体标签列表功能。

## 实现的功能

### 1. 模块列表显示关联实体数量

**位置**: `src/components/module-management/index.tsx`

**实现方式**:
- 在DataListSidebar中添加自定义渲染方法
- 计算每个模块关联的实体数量
- 以徽章形式显示数量

**核心代码**:
```javascript
// 计算关联实体的函数
const getRelatedEntitiesCount = useCallback((moduleId: string) => {
  if (!entities || !moduleId) return 0;
  return entities.filter((entity) =>
    entity.bundles?.includes(moduleId)
  ).length;
}, [entities]);

// 自定义渲染方法
const renderModuleItem = useCallback((module: any, isSelected: boolean) => {
  const relatedCount = getRelatedEntitiesCount(module.id);
  // ... 渲染逻辑
}, [getRelatedEntitiesCount, searchText]);
```

### 2. 模块详情页关联实体标签列表

**位置**: `src/components/module-management/module-detail.tsx`

**实现方式**:
- 在基本信息区域添加"关联实体"字段
- 显示所有使用该模块的实体
- 支持点击标签跳转到对应实体

**核心代码**:
```javascript
// 计算关联的实体列表
const relatedEntities = useMemo(() => {
  if (!currentModule?.id || !entities) return [];

  return entities.filter((entity) =>
    entity.bundles?.includes(currentModule.id)
  );
}, [currentModule?.id, entities]);

// 使用Typography.Text的link属性，直接使用href进行路由跳转
<Typography.Text
  link={{
    href: `/entities/${entity.id}/`  // 正确的路由格式：/entities/{entityId}/
  }}
  style={{
    fontSize: '12px',
    padding: '2px 6px',
    backgroundColor: 'var(--semi-color-fill-1)',
    borderRadius: '4px',
    border: '1px solid var(--semi-color-border)',
  }}
>
  {entity.id} {entity.name && `(${entity.name})`}
</Typography.Text>
```

## 数据关联逻辑

**实体-模块关联关系**:
- 实体的`bundles`字段存储完整关联的模块ID列表
- 通过`entity.bundles?.includes(moduleId)`判断关联关系
- 使用`useEntityList()`获取所有实体数据
- 使用href属性实现标准的链接跳转

## UI设计

### 模块列表项
- 模块名称右侧显示关联实体数量徽章
- 徽章颜色为橙色，与实体列表的模块徽章保持一致
- 支持搜索高亮显示

### 模块详情页
- 在基本信息区域添加"关联实体"字段
- 使用Typography.Text的link属性显示关联实体，格式：`实体ID (实体名称)`
- 链接文本可点击，跳转到对应实体详情页
- 显示关联实体数量统计
- 符合Semi Design的链接文本设计规范

## 测试验证

1. **模块列表**: 查看每个模块右侧是否显示正确的关联实体数量
2. **模块详情**: 查看关联实体标签是否正确显示
3. **跳转功能**: 点击实体标签是否能正确跳转到实体详情页
4. **数据同步**: 修改实体的模块关联后，模块页面的显示是否同步更新

## 技术要点

- 使用`useMemo`优化关联实体的计算性能
- 使用`useCallback`优化渲染函数的性能
- 保持与现有UI风格的一致性
- 支持实时数据更新和同步显示

## 文件修改列表

1. `src/components/module-management/index.tsx` - 添加模块列表关联实体数量显示
2. `src/components/module-management/module-detail.tsx` - 添加模块详情页关联实体标签列表

## 🔄 2024年最新UI改进

### 3. 导航文本统一化

**修改位置**: `src/app.tsx`

**修改内容**:
- ✅ "实体列表" → "实体管理"
- ✅ "模块列表" → "模块管理"
- ✅ "行为编辑" → "行为管理"

### 4. 参数配置表优化

**修改位置**: `src/components/behavior-editor/behavior-detail.tsx`

**优化内容**:
- ✅ 移除第一行无意义的文本"函数参相互...配置过滤器"
- ✅ 类型列宽度从120px调整为40px
- ✅ 模块过滤支持多选，添加清除功能
- ✅ 合并"属性过滤"、"条件过滤"、"常量"为统一的"条件过滤"列

**列合并逻辑**:
- 默认显示条件过滤组件
- 可以切换为常量值输入模式
- 提供"改为常量"/"改为条件"切换按钮
- 常量是条件过滤的一种特殊形式

### 🎯 用户体验改进

- **直观性**: 模块和实体的关联关系更加直观
- **便捷性**: 一键跳转到关联实体，提高操作效率
- **一致性**: 导航文本风格统一，界面更专业
- **简洁性**: 参数配置表布局更紧凑，功能更集中
