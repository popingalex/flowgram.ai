# 数据结构管理系统 - 简洁版

## 📋 概述

这是一个基于 TypeScript 的数据结构管理系统，专为仿真应用设计。系统采用简洁的设计理念，去除了所有无意义的别名和过度设计的工具类，专注于核心数据结构和实用的 Store 管理。

## 🎯 核心特性

### 1. 简洁的类型定义
- **Indexed**: 唯一通用的基础接口，提供 `_indexId` 索引
- **Typed**: 可与字符串相互转换的类型系统（不需要索引）
- **Attribute**: 带类型和值的属性（需要索引）
- **Entity**: 统一的实体/模块结构（需要索引）
- **Behavior**: 三种行为类型（远程、内置、脚本）（需要索引）
- **System**: 与模块关联，包含行为的系统（需要索引）

### 2. 实用的 Store 管理
- 使用 Pinia 进行状态管理
- 提供完整的 CRUD 操作
- 内置 JSON 序列化/反序列化
- 数据校验功能
- 统一的 ID 生成机制

### 3. vueuse 风格的 useCloned
- 提供工作副本和变更检查
- 支持数据重置和同步
- 自动监听原始数据变化

## 📁 项目结构

```
src/
├── types/
│   └── index.ts           # 核心类型定义（简洁版）
├── stores/
│   └── simulation-store.ts # Pinia Store + 数据管理
├── composables/
│   └── useCloned.ts       # vueuse 风格的组合式函数
└── demo.ts                # 使用演示
```

## 🚀 快速开始

### 基本使用

```typescript
import { useSimulationStore } from './stores/simulation-store'

const store = useSimulationStore()

// 创建实体
const entity = store.addEntity({
  id: 'fire-station',
  name: '消防站',
  category: 'entity',
  attributes: []
})

// 创建属性
const attribute = store.addAttribute({
  id: 'location',
  name: '位置',
  type: { primitive: 'string', dimensions: [] },
  value: '北京市朝阳区'
})
```

### 使用 useCloned 进行编辑

```typescript
import { useEntityEditor } from './stores/simulation-store'

const editor = useEntityEditor(entityId)

// 修改数据
editor.entity.value.name = '新名称'

// 检查是否有变更
console.log(editor.isDirty.value) // true

// 保存变更
editor.save()

// 或重置变更
editor.reset()
```

### 数据序列化

```typescript
// 导出数据
const jsonData = store.toJSON()

// 导入数据
store.fromJSON(jsonData)
```

## 🔧 类型定义

### 核心接口

```typescript
// 基础索引接口
interface Indexed {
  _indexId: string
}

// 统一的实体/模块结构
interface Entity extends Indexed {
  id: string
  name: string
  category: 'entity' | 'module' | 'system'
  attributes: Attribute[]
  children?: string[]
  parent?: string
}

// 属性定义
interface Attribute extends Indexed {
  id: string
  name?: string
  type: Typed
  value?: any
}
```

## 📊 设计原则

### ✅ 保留的特性
- **_indexId**: 唯一通用的索引机制
- **核心数据结构**: 实体、属性、行为、系统
- **Store 层面的工具**: 数据转换、校验、变更检查
- **实用的组合式函数**: useCloned 提供编辑功能

### ❌ 移除的冗余
- 无意义的类型别名（如 `UniqueId`, `Name` 等）
- 过度设计的工具类（Parser、Factory、List 类）
- 重复的数据结构（实体和模块合并）
- 分散的工具方法（统一到 Store 中）

## 🎯 版本历史

### v2.0.0 - 简洁重构版
- 彻底重构，去除所有冗余设计
- 统一实体和模块数据结构
- 将工具方法集中到 Store 中
- 引入 vueuse 风格的 useCloned

### v1.1.0 - 清理版（已废弃）
- 清理了部分冗余类型别名
- 但仍保留过多无用的工具类

### v1.0.0 - 初始版（已废弃）
- 过度设计，包含大量无用的别名和工具类

## 🛠 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 🌐 API配置

### 当前API端点
系统使用以下API端点获取数据：
- **模块API**: `GET http://localhost:8080/api/modular/modules/`
- **实体API**: `GET http://localhost:8080/api/modular/entities`
- **系统API**: `GET http://localhost:8080/api/systems`
- **场景API**: `GET http://localhost:8080/api/scenarios`

### API模式
- **真实API模式**: 优先尝试连接后端服务器
- **Mock模式**: API失败时自动降级到本地mock数据
- 可以通过 `apiService.toggleMockMode()` 手动切换模式

### 环境配置
可以通过环境变量覆盖默认配置：
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=5000
VITE_API_RETRY_COUNT=3
VITE_API_RETRY_DELAY=1000
```

## 📝 最佳实践

1. **数据操作**: 统一使用 Store 中的方法
2. **编辑功能**: 使用 useEntityEditor 进行安全编辑
3. **类型安全**: 充分利用 TypeScript 类型检查
4. **数据持久化**: 使用 toJSON/fromJSON 进行序列化

这个简洁版本专注于实用性，去除了所有花里胡哨的设计，让代码更清晰、更易维护。
