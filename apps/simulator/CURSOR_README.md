# FlowGram Simulator 开发文档

## 项目简介

Simulator 是一个基于 Vue 3 + TypeScript + Vite 的流程仿真器应用，用于复刻和迁移 demo-free-layout-forked 的功能。

## 技术栈

- **框架**: Vue 3.5+ (Composition API)
- **构建工具**: Vite 6.0
- **语言**: TypeScript 5.8
- **UI 库**: Element Plus 2.9+
- **样式**: UnoCSS 0.65+ (原子化 CSS)
- **状态管理**: Pinia 3.0+
- **路由**: Vue Router 4.5+
- **工具库**: 
  - VueUse 11.3+ (Vue 组合式工具库)
  - Lodash 4.17+ (JavaScript 工具库)
  - Axios 1.7+ (HTTP 客户端)
  - ECharts 5.5+ (图表库)

## 开发环境

### 启动开发服务器

```bash
# 在项目根目录
rush dev:simulator

# 或者直接在 simulator 目录
cd apps/simulator
npm run dev
```

开发服务器运行在: http://localhost:13002

### 构建生产版本

```bash
cd apps/simulator
npm run build
```

## 项目结构

```
apps/simulator/
├── src/
│   ├── components/     # 可复用组件
│   ├── views/         # 页面组件
│   ├── stores/        # Pinia 状态管理
│   ├── utils/         # 工具函数
│   ├── styles/        # 全局样式
│   ├── router/        # 路由配置
│   ├── App.vue        # 根组件
│   └── main.ts        # 应用入口
├── public/            # 静态资源
├── vite.config.ts     # Vite 配置
├── uno.config.ts      # UnoCSS 配置
├── tsconfig.json      # TypeScript 配置
└── package.json       # 项目依赖
```

## 开发注意事项

### 样式开发

1. **优先使用 UnoCSS**: 使用原子化 CSS 类名进行样式开发
2. **Element Plus 自动导入**: 组件和样式已配置自动导入，无需手动引入
3. **响应式设计**: 使用 UnoCSS 的响应式前缀 (sm:, md:, lg:, xl:)

### 组件开发

1. **自动导入**: Vue 组合式 API 和 VueUse 已配置自动导入
2. **TypeScript**: 严格类型检查，确保类型安全
3. **组件命名**: 使用 PascalCase 命名组件文件

### 状态管理

1. **Pinia**: 使用 Pinia 进行状态管理
2. **组合式 API**: 推荐使用 setup() 语法

### 迁移计划

将从 demo-free-layout-forked 逐步迁移以下功能:

1. **基础界面布局**
2. **流程图编辑器**
3. **节点管理**
4. **连接线管理**
5. **属性面板**
6. **工具栏**
7. **数据持久化**

## 依赖版本兼容性

- Node.js: 18.20.8+ (当前环境)
- Vite: 6.0 (降级以兼容 UnoCSS)
- UnoCSS: 0.65 (最新兼容 Vite 6 的版本)

## 已知问题

1. **Node.js 版本警告**: 当前使用 Node.js 18.20.8，部分依赖推荐 Node.js 20+
2. **UnoCSS 版本**: 为保证兼容性，使用 0.65 版本而非最新版本

## 下一步计划

1. 完成基础 Vue 应用框架搭建 ✅
2. 集成 Element Plus 和 UnoCSS ✅
3. 配置路由和状态管理 ✅
4. 开始功能迁移工作 🔄

## 联系方式

如有问题请在项目中提 Issue 或联系开发团队。 