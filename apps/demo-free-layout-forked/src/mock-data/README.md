# Mock数据管理

## 概述

本目录包含从真实后台API获取的数据，用于离线开发和测试。所有数据都是从运行中的后台服务实时获取的快照。

## 数据文件

- `modules.json` - 模块数据 (来自 `/cm/module/`)
- `entities.json` - 实体数据 (来自 `/cm/entity/`)
- `enums.json` - 枚举数据 (来自 `/cm/enum/`)
- `behaviors.json` - 函数行为数据 (来自 `/hub/behaviors/`)
- `graphs.json` - 工作流图数据 (来自 `/hub/graphs/`)

## 使用方式

### 1. 自动降级模式（推荐）

系统会自动尝试真实API，失败时降级到mock数据：

```typescript
// API服务会自动处理降级
import { moduleApi, entityApi, behaviorApi } from '../services/api-service';

// 这些调用会自动降级到mock数据（如果真实API不可用）
const modules = await moduleApi.getAll();
const entities = await entityApi.getAll();
const behaviors = await behaviorApi.getAll();
```

### 2. 直接使用mock数据

```typescript
import { REAL_MODULES, REAL_ENTITIES, REAL_BEHAVIORS, REAL_GRAPHS } from './mock-data';

// 直接使用mock数据
console.log('模块数量:', REAL_MODULES.length);
console.log('实体数量:', REAL_ENTITIES.length);
```

### 3. 强制mock模式

```typescript
import { toggleMockMode } from '../services/api-service';

// 强制使用mock模式
toggleMockMode(); // 切换到mock模式
```

## 数据更新

当后台数据发生变化时，可以重新获取最新数据：

```bash
# 在项目根目录执行
curl -s http://localhost:9999/cm/module/ > apps/demo-free-layout-forked/src/mock-data/modules.json
curl -s http://localhost:9999/cm/entity/ > apps/demo-free-layout-forked/src/mock-data/entities.json
curl -s http://localhost:9999/cm/enum/ > apps/demo-free-layout-forked/src/mock-data/enums.json
curl -s http://localhost:9999/hub/behaviors/ > apps/demo-free-layout-forked/src/mock-data/behaviors.json
curl -s http://localhost:9999/hub/graphs/ > apps/demo-free-layout-forked/src/mock-data/graphs.json
```

## 数据统计

当前数据快照统计：

- **模块**: 6个
- **实体**: 多个（包含载具、直升机等）
- **枚举**: 可能为错误对象（后台接口问题）
- **函数行为**: 100+个Java函数
- **工作流图**: 多个实体的工作流

## 注意事项

1. **枚举数据异常**: `/cm/enum/` 接口返回错误信息，系统会自动处理
2. **类型兼容**: 使用系统现有的类型定义，无需额外转换
3. **自动降级**: 优先使用真实API，失败时自动使用mock数据
4. **数据新鲜度**: mock数据是实时快照，定期更新以保持同步

## 测试

运行测试脚本验证mock数据：

```typescript
// 在浏览器控制台或Node.js中运行
import './test-mock';
```

## 离线开发

有了这些mock数据，即使后台服务不可用，前端也能正常开发和测试所有功能。
