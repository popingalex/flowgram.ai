# API Platform

基于 Vue3 + Element Plus 的现代化实体管理平台，实现了严格的数据结构设计和响应式状态管理。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **工具库**: VueUse + Lodash-ES + Nanoid
- **样式**: UnoCSS
- **路由**: Vue Router 4

## 功能特性

### 🏗️ 数据结构设计

#### 核心原则
- **通用特性**: 所有元素都有 `_indexId`（nanoid索引）+ 支持通过路径修改属性
- **具体业务**: 各对象直接定义自己需要的字段，无伪通用抽象接口

#### 基础类型
```typescript
// 基础索引接口
interface Indexed {
  _indexId: string; // nanoid索引，用于数组索引和React key
}

// 实体类型 - 直接定义具体字段
interface Entity extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  attributes: Attribute[];
  bundles?: string[]; // 关联的模块ID（业务ID）
  deprecated?: boolean;
}
```

### 🎯 实体管理功能

#### 左右布局设计
- **顶部导航**: 链接模式导航（实体列表/模块列表/表达式管理/API工作台）
- **左侧面板**:
  - 搜索框 + 添加实体按钮
  - 实体列表（显示ID、名称、属性/模块统计）
  - 状态标签（新增/已修改）
- **右侧详情**:
  - 详情头部（实体名称 + 操作按钮）
  - 基本信息编辑（ID、名称、描述）
  - 属性表格（可添加、编辑、删除属性）
  - 模块绑定信息

#### 核心特性
- **nanoid 索引**: 使用稳定的 nanoid 作为元素索引，支持 ID 修改
- **响应式状态**: 基于 Pinia 的现代状态管理
- **本地编辑**: 支持本地编辑状态，保存/撤销功能
- **类型安全**: 完整的 TypeScript 类型定义

## 项目结构

```
src/
├── components/          # 组件目录（暂未使用）
├── stores/             # Pinia状态管理
│   └── entities.ts     # 实体管理Store
├── types/              # TypeScript类型定义
│   ├── base.ts         # 基础类型（Indexed等）
│   └── entities.ts     # 业务实体类型
├── views/              # 页面组件
│   ├── EntitiesView.vue    # 实体管理页面
│   ├── ModulesView.vue     # 模块管理页面（占位）
│   ├── ExpressionsView.vue # 表达式管理页面（占位）
│   └── ApiPlatform.vue     # API工作台页面
├── mock-data/          # Mock数据
│   ├── entities.json   # 实体数据
│   ├── modules.json    # 模块数据
│   └── ...            # 其他数据文件
├── router/             # 路由配置
│   └── index.ts
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

## 开发指南

### 启动开发服务器

#### 方式一：使用 Rush（推荐）
```bash
# 在项目根目录执行
rush dev:api-platform
```
应用将在 http://localhost:13001 启动

#### 方式二：直接启动
```bash
# 在 apps/api-platform 目录执行
cd apps/api-platform
npm run dev
```

### 其他命令
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check
```

## 数据结构设计

### 实体类型
```typescript
interface Entity extends EditableIndexed {
  id: string;             // 业务ID
  name: string;           // 实体名称
  description?: string;   // 描述
  attributes: Attribute[]; // 属性列表
  bundles?: string[];     // 关联的模块ID
  deprecated?: boolean;   // 是否废弃
}
```

### 属性类型
```typescript
interface Attribute extends EditableIndexed {
  id: string;            // 属性ID
  name: string;          // 属性名称
  type: string;          // 属性类型
  description?: string;  // 描述
  enumClassId?: string;  // 枚举类ID
  displayId?: string;    // 显示用的简化ID
}
```

### 编辑状态
```typescript
type EditStatus = 'saved' | 'modified' | 'new' | 'saving' | 'error';
```

## 设计原则

1. **严格数据结构**: 遵循用户要求，只有 `Indexed` 接口提供数组索引，业务类型直接定义字段
2. **响应式优先**: 充分利用 Vue3 的响应式特性和 Pinia 状态管理
3. **类型安全**: 完整的 TypeScript 类型定义，确保开发时的类型安全
4. **组件化**: 合理的组件拆分，提高代码复用性和维护性
5. **用户体验**: 左右布局，直观的操作流程

## 已实现功能

- ✅ 基础类型定义（Indexed + 业务类型）
- ✅ Pinia Store（实体CRUD操作）
- ✅ 顶部导航（链接模式）
- ✅ 左右布局（实体列表 + 详情页）
- ✅ 实体管理（添加、编辑、删除、保存、撤销）
- ✅ 属性管理（添加、编辑、删除属性）
- ✅ 搜索过滤功能
- ✅ 状态管理（新增/修改状态显示）
- ✅ Mock 数据集成

## 待开发功能

- [ ] 模块管理页面
- [ ] 表达式管理页面
- [ ] 模块绑定功能
- [ ] 数据持久化（API集成）
- [ ] 数据验证和错误处理
- [ ] 批量操作功能
- [ ] 导入/导出功能

## 开发注意事项

- 使用 Element Plus 的内置组件和功能，避免重复造轮子
- 保持与原有项目的数据结构兼容性
- 充分利用 VueUse 提供的组合式 API
- 使用 UnoCSS 进行样式开发，保持一致的设计系统
- 严格遵循数据结构设计原则，不创建不必要的抽象接口
