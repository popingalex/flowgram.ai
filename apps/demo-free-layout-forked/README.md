# Demo Free Layout Forked

这是Flowgram流程设计器的分支版本，专注于实体和模块的管理，以及基于实体的工作流编辑。

## 🚀 快速开始

### 启动开发服务器
```bash
# 在项目根目录运行
rush dev:demo-free-layout-forked
```

服务器将在 http://localhost:13000 启动

## 🧪 测试

### 运行E2E测试
```bash
# 进入项目目录
cd apps/demo-free-layout-forked

# 🚀 运行所有E2E测试并生成HTML报告（推荐）
npx playwright test --reporter=html

# 运行所有测试（简单模式）
npx playwright test

# 运行特定测试文件
npx playwright test e2e/entity-management.spec.ts
npx playwright test e2e/module-management.spec.ts

# 运行测试并显示浏览器界面（调试模式）
npx playwright test --headed

# 运行特定测试用例
npx playwright test -g "验证错误Badge"

# 运行测试并生成详细报告
npx playwright test --reporter=list

# 并行运行测试（更快）
npx playwright test --workers=3
```

### 查看测试报告
```bash
# 🎯 查看最新的HTML测试报告（推荐）
npx playwright show-report

# 测试报告将在浏览器中自动打开，包含：
# - 测试执行结果和统计
# - 失败测试的详细错误信息
# - 测试执行时的截图和视频
# - 测试执行时间分析
```

### 测试执行完整流程
```bash
# 1️⃣ 确保开发服务器运行
rush dev:demo-free-layout-forked

# 2️⃣ 在新终端中执行全部测试并生成报告
cd apps/demo-free-layout-forked
npx playwright test --reporter=html

# 3️⃣ 查看测试报告
npx playwright show-report
```

### 测试覆盖范围
- ✅ **实体管理功能**: 创建、编辑、删除实体
- ✅ **属性管理功能**: 添加、编辑、删除属性
- ✅ **验证Badge功能**: 表单验证和错误提示
- ✅ **搜索功能**: 实体和模块搜索
- ⚠️ **模块绑定功能**: 实体与模块关联
- ⚠️ **数据持久化**: 跨页面数据保存验证

### 服务依赖
测试需要以下服务运行：
- **前端服务**: http://localhost:13000 (开发服务器)
- **后端API**: http://localhost:8080 (主要API服务器)

### API端点说明
当前使用的API端点：
- **模块API**: `GET http://localhost:8080/api/modular/modules/`
- **实体API**: `GET http://localhost:8080/api/modular/entities`
- **系统API**: `GET http://localhost:8080/api/systems`
- **行为API**: 
  - 远程行为: `GET http://localhost:8080/exp/remote`
  - 本地行为: `GET http://localhost:8080/exp/local`
  - 脚本行为: `GET http://localhost:8080/exp/script`

可以使用 `test-api-endpoints.html` 测试页面验证API端点是否正常工作。

## 📱 页面结构

### 🗺️ 路由系统

应用使用简单的路由系统，支持以下URL：

- **实体列表页面**: `/entities/` 或 `/` (默认首页)
- **模块列表页面**: `/modules/`
- **实体工作流编辑**: `/entities/{entityId}/`

### 📋 主要页面

#### 1. 实体列表页面 (`/entities/`)
- 树形表格展示所有实体和其属性
- 三级结构：实体 → 实体属性/关联模块 → 模块属性
- 支持实体的增删改操作
- 提供"查看工作流"按钮跳转到工作流编辑页面
- 显示实体的完整关联模块（bundles）和部分关联模块

#### 2. 模块列表页面 (`/modules/`)
- 树形表格展示所有模块和其属性
- 两级结构：模块 → 模块属性
- 支持模块的基本管理操作

#### 3. 实体工作流编辑页面 (`/entities/{entityId}/`)
- 基于选中实体的工作流可视化编辑器
- 只能通过实体列表页面的"查看工作流"按钮访问
- 自动选中对应的实体并加载其工作流数据

### 🧭 导航结构

应用导航包含以下主要部分：
- **实体列表**: 管理所有实体和属性
- **模块列表**: 管理所有模块和属性
- **测试页面**: 开发调试用的测试页面

注意：工作流编辑不在主导航中，因为它必须基于特定实体，只能通过实体列表访问。

## 🏗️ 技术架构

### 路由管理
- 使用自定义的 `useRouter` hook 管理路由状态
- 支持浏览器前进后退功能
- 自动同步URL和应用状态

### 数据管理
- 基于现有的Store系统（EntityStore, ModuleStore等）
- 响应式数据更新
- 支持模拟和真实API模式切换

### UI组件
- 基于Semi Design组件库
- 树形表格展示层级数据
- 统一的操作列设计模式

## 🔧 开发说明

### 目录结构
```
src/
├── components/
│   ├── entity-list-page.tsx      # 实体列表页面
│   ├── module-list-page.tsx      # 模块列表页面
│   └── ext/                      # 扩展组件目录
├── hooks/
│   └── use-router.ts             # 路由管理hook
├── stores/                       # 数据存储
└── app.tsx                       # 主应用组件

docs/
├── components/                   # 组件相关文档
├── features/                     # 功能特性文档
├── development/                  # 开发相关文档
└── README.md                     # 详细技术文档

debug/                           # 调试文件和测试页面
cursor_works/                    # 开发任务管理
```

### 修改约束
- ✅ 可以自由修改 `src/components/ext/` 下的扩展代码
- ⚠️ 谨慎修改其他原有的工作流编辑器相关代码
- ❌ 禁止修改 `packages/` 目录下的引擎代码

### 代码组织原则
- **统一Store导入**: 所有store相关导入统一使用 `from '../stores'`
- **避免重复组件**: 删除了重复的选择器组件实现，统一使用 `ext/` 下的版本
- **目录职责明确**: `bt/` 用于业务表格, `ext/` 用于扩展组件

### 调试功能
- API模式切换：在页面右上角可以切换模拟/真实API模式
- 实体选择器：快速切换当前选中的实体
- 测试页面：包含各种开发调试功能

## 📝 使用说明

1. **管理实体**: 在实体列表页面可以添加、编辑、删除实体
2. **查看工作流**: 点击实体的"查看工作流"按钮进入工作流编辑页面
3. **管理模块**: 在模块列表页面管理模块和模块属性
4. **关联模块**: 在实体列表中可以管理实体与模块的关联关系

## 🐛 问题排查

如果遇到问题，请检查：
1. 开发服务器是否正常启动（端口3000）
2. 浏览器控制台是否有错误信息
3. API模式是否正确（模拟/真实）
4. 路由URL是否符合预期格式
