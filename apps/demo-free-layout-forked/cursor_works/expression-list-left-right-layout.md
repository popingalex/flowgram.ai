# 表达式列表左右分栏布局任务

## 任务状态：已完成组件化拆分

## 已完成步骤

### ✅ 1. 修复控制台报错 (2024-12-19 完成)
- 修复了Semi Design Tree组件的`renderFullLabel`属性错误
- 修复了Space组件的`size`属性为`spacing`
- 修正了Tree组件的`onSelect`回调函数签名
- 清理了大量逐个元素打印的调试日志

### ✅ 2. 实现API编辑Store (2024-12-19 完成)
- 创建了`useApiEditStore`支持API的原件列表和当前编辑副本管理
- 实现了类似实体编辑的双Store模式：原件列表 + 编辑副本
- 支持参数的增删改查、字段更新、撤销/保存等完整编辑功能

### ✅ 3. 重构表达式列表页面 (2024-12-19 完成)
- 完全重写了`expression-list-page.tsx`，使用新的API编辑Store
- 实现了真正的左右分栏交互，不再是写死的内容
- 左侧树形结构支持分组展开切换
- 分组按钮正确右对齐，添加了"添加分组"和"添加API"按钮
- 右侧详情页面完整实现：
  - API标题编辑
  - URL工具栏：HTTP方法选择 + URL编辑 + 撤销/保存/发送按钮
  - 标签页结构：参数/Body/描述
  - 参数按Query/Header/Path三组分别显示
  - 每组都有独立的"添加参数"按钮
  - 支持参数的完整编辑：名称、类型、描述、默认值、必填状态

### ✅ 4. 修复UI细节 (2024-12-19 完成)
- 撤销和保存按钮正确根据是否有未保存更改来启用/禁用
- Body标签页提供了格式化的TextArea支持JSON编辑
- 描述标签页支持完整的描述编辑
- 参数表格有正确的表头和控制列
- 无参数时显示友好的空状态提示

### ✅ 5. 组件化拆分重构 (2024-12-19 完成)
- 创建了`src/components/expression-list/`专门文件夹
- 将庞大的单一文件拆分为多个专门组件：
  - `index.tsx` - 主入口组件，负责数据加载和路由
  - `components/api-sidebar.tsx` - 左侧API侧边栏
  - `components/api-detail-panel.tsx` - 右侧API详情面板
  - `components/api-header.tsx` - API标题组件
  - `components/api-url-toolbar.tsx` - URL工具栏组件
  - `components/api-tabs.tsx` - 标签页容器组件
  - `components/api-parameters-tab.tsx` - 参数标签页组件
  - `components/api-body-tab.tsx` - Body标签页组件
  - `components/api-description-tab.tsx` - 描述标签页组件

### ✅ 6. API显示和URL路由优化 (2024-12-19 完成)
- 修改API树显示ID而不是中文名称，符合API管理规范
- 为mock数据添加了`_indexId`字段支持nanoid索引
- 修复了API编辑Store中的数据映射：
  - 正确映射`inputs`数组到`parameters`
  - 支持`desc`字段映射到`description`
  - 自动转换scope格式（path->Path, query->Query, header->Header）
- 实现了URL路由自动选中功能：
  - 访问`/exp/remote/{API_ID}`时自动选中对应API
  - 自动开始编辑模式并显示详情页面
  - 右侧详情页显示中文名称，左侧列表显示API ID

### ✅ 7. 最终UI优化和数据同步修复 (2024-12-19 完成)
- **API数据同步修复**: 为mock数据添加缺失的method字段 (TIF_SUBTRACT: POST, FLOOD_TASK_WORKLOAD: GET)
- **参数表格重构为树形**: 改用Semi Design树形表格，按Query/Header/Path分组显示参数，每组可独立添加参数
- **UI交互优化**:
  - URL工具栏按钮顺序调整为：发送、撤销、保存
  - 移除左侧API树的编辑/删除按钮，统一在右侧顶部编辑
  - 添加`labelEllipsis`属性防止API名称换行，显示省略号
- **功能验证**: 两个API都能正确自动选中、显示详情和参数分组

## 组件化架构优势

### 1. 模块化设计
```
expression-list/
├── index.tsx                    # 主入口，数据管理
├── components/
│   ├── api-sidebar.tsx         # 左侧栏：搜索+树形导航
│   ├── api-detail-panel.tsx    # 右侧面板：统筹详情显示
│   ├── api-header.tsx          # 标题编辑组件
│   ├── api-url-toolbar.tsx     # URL工具栏组件
│   ├── api-tabs.tsx            # 标签页容器
│   ├── api-parameters-tab.tsx  # 参数管理组件
│   ├── api-body-tab.tsx        # Body编辑组件
│   └── api-description-tab.tsx # 描述编辑组件
```

### 2. 职责分离
- **主入口**：数据加载、路由管理、状态协调
- **侧边栏**：搜索、导航、创建操作
- **详情面板**：API编辑的统筹管理
- **子组件**：各自专注单一功能模块

### 3. 复用性和维护性
- 每个组件功能单一，易于测试和维护
- 组件间通过props传递数据，依赖关系清晰
- 可以独立修改某个功能而不影响其他模块
- 便于后续功能扩展和优化

### 4. 开发效率
- 避免了在单一大文件中频繁重写
- 每次修改只涉及相关的小组件
- 减少了合并冲突的可能性
- 提高了代码的可读性和可维护性

## 核心技术实现

### API编辑Store架构
```typescript
// 双Store模式
originalApis: Record<string, ApiEditItem>  // 原件列表
editingApis: Record<string, ApiEditItem>   // 编辑副本

// 编辑流程
startEditing() -> updateParameter() -> saveChanges() / revertChanges()
```

### 参数分组逻辑
```typescript
// 按作用域分组
groupedParameters: { Query: [], Header: [], Path: [] }
// 每组独立渲染表格和添加按钮
renderParameterGroup(groupName, parameters)
```

### 组件通信流程
```
主入口 -> 数据加载 -> 传递给子组件 -> 子组件操作 -> 回调更新Store
```

## 已解决的问题

1. ✅ 左侧树形表中，分组支持点击展开切换
2. ✅ 左侧树形表中，分组的右侧按钮正确右对齐
3. ✅ 每个分组都提供"添加分组"和"添加API"按钮，图标与顶部一致
4. ✅ API支持完整编辑功能，使用双Store模式管理状态
5. ✅ 右侧详情页，撤销和保存按钮根据实际编辑状态启用/禁用
6. ✅ 右侧参数tab按Query/Header/Path三组分别显示
7. ✅ Body标签页提供格式化的TextArea编辑区域
8. ✅ 描述tab支持完整编辑功能
9. ✅ 组件化拆分，避免单一大文件的频繁重写问题

## 下一步计划

1. 实现分组的实际创建和管理功能
2. 实现API的实际创建功能
3. 完善搜索和过滤功能
4. 添加API测试发送功能
5. 优化UI交互细节

## 注意事项

- 使用了nanoid作为稳定的React key
- 遵循了用户的日志输出规范：打印完整数据结构而非逐个元素
- 保持了与原有工作流编辑器的兼容性
- 使用Semi Design组件库的正确API和配置
- 组件化设计提高了代码的可维护性和复用性
