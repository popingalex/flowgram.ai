# API和Mock机制 - 简化版本

为simulator项目提供基本的API调用和mock数据降级功能。

## 功能概览

- **API配置管理**: 统一管理API根URL和请求参数
- **自动降级机制**: API请求失败时自动使用mock数据
- **基础CRUD操作**: 支持模块、实体、系统、场景的基本操作
- **使用现有类型**: 复用simulator项目的类型系统

## 项目结构

```
src/
├── config/
│   └── api.ts                 # API配置管理
├── services/
│   ├── types.ts              # 简化的API类型定义
│   ├── api-service.ts        # API服务类
│   └── index.ts              # 统一导出
├── mock-data/
│   ├── modules.json          # 模块数据
│   ├── entities.json         # 实体数据
│   ├── systems.json          # 系统数据
│   ├── scenarios.json        # 场景数据
│   └── index.ts              # 数据管理
└── demo-api.ts               # 使用演示
```

## 配置管理

### API配置 (`src/config/api.ts`)

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  ENDPOINTS: {
    MODULE: '/api/modules',
    ENTITY: '/api/entities',
    SYSTEM: '/api/systems',
    SCENARIO: '/api/scenarios',
  },
  TIMEOUT: 5000,
  RETRY_COUNT: 3,
}
```

### 环境变量支持

- `VITE_API_BASE_URL`: 覆盖默认的API基础URL
- `VITE_API_TIMEOUT`: 覆盖默认的请求超时时间

## API服务使用

### 基本用法

```typescript
import { apiService } from '@/services/api-service'

// 获取模块列表
const modulesResponse = await apiService.getModules()
if (modulesResponse.success) {
  console.log(modulesResponse.data)
}

// 创建模块
const createResponse = await apiService.createModule({
  name: '新模块',
  description: '模块描述',
  attributes: [],
  behaviors: []
})
```

### 自动降级机制

当真实API请求失败时，系统会自动切换到mock数据：

```typescript
// 尝试真实API，失败时自动使用mock数据
const response = await apiService.getModules()
// 无论API是否可用，都会返回数据
```

### 模式切换

```typescript
// 查看当前模式
console.log(apiService.getApiMode()) // 'real' 或 'mock'

// 强制切换到mock模式
apiService.toggleMockMode()
```

## Mock数据

### 数据结构

Mock数据完全符合simulator项目的类型定义：

- **modules.json**: 3个基础模块（移动、容器、受控）
- **entities.json**: 4个实体（直升机、消防车、救护车、指挥中心）
- **systems.json**: 4个系统（移动、交互、仿真、日志）
- **scenarios.json**: 3个场景（山区救援、城市火灾、多点应急）

### 数据查询

```typescript
import { MOCK_MODULES, findModule, getDataStats } from '@/mock-data'

// 直接访问数据
console.log(MOCK_MODULES)

// 查询特定数据
const module = findModule('module_mobile_001')

// 获取统计信息
console.log(getDataStats())
```

## 运行演示

```bash
# 类型检查
npm run type-check

# 构建测试
npm run build

# 运行演示
npx jiti src/demo-api.ts
```

## 扩展指南

### 添加新的API端点

1. 在`API_CONFIG.ENDPOINTS`中添加新端点
2. 在`ApiService`类中添加对应方法
3. 在mock数据降级中添加对应处理

### 添加新的mock数据

1. 在`mock-data/`目录下创建JSON文件
2. 在`mock-data/index.ts`中导出数据
3. 在`api-service.ts`中添加降级处理

### 自定义请求选项

```typescript
const response = await apiService.getModules({
  timeout: 10000,
  retries: 5,
  headers: { 'Custom-Header': 'value' }
})
```

## 最佳实践

1. 始终检查API响应的`success`字段
2. 使用环境变量配置不同环境的API地址
3. 利用自动降级机制确保开发阶段的稳定性
4. 保持mock数据与真实API数据结构的一致性 