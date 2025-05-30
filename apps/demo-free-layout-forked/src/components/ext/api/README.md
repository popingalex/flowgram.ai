# Mock数据系统使用说明

这个mock数据系统让您在没有后台服务的情况下也能继续开发工作流引擎UI。

## 快速开始

### 1. 启用/禁用Mock模式

编辑 `mock-config.ts` 文件：

```typescript
export const MOCK_CONFIG = {
  ENABLED: true,  // true: 使用mock数据, false: 使用真实API
  // ... 其他配置
};
```

### 2. Mock数据内容

系统包含以下mock数据：

#### 模块 (Modules)
- **用户信息模块**: 姓名、邮箱、手机号、年龄
- **地址信息模块**: 省份、城市、区县、街道、邮政编码
- **车辆信息模块**: 品牌、型号、年份、颜色、车牌号
- **订单信息模块**: 订单号、总金额、状态、创建时间、商品列表
- **商品信息模块**: 商品名称、价格、分类、描述、库存
- **支付信息模块**: 支付方式、支付金额、交易号、支付状态

#### 实体 (Entities)
- **客户**: 关联用户信息和地址信息模块
- **车辆**: 关联车辆信息模块
- **订单**: 关联订单信息和支付信息模块
- **商品**: 关联商品信息模块
- **员工**: 关联用户信息模块

#### 枚举类 (Enum Classes)
- 车辆类型、颜色、尺寸、VIP等级、燃料类型
- 订单优先级、配送方式、品牌、部门、职位

## 配置选项

### mock-config.ts 配置说明

```typescript
export const MOCK_CONFIG = {
  // 是否启用mock模式
  ENABLED: true,

  // Mock API延迟时间（毫秒）
  DELAY: 300,

  // 是否在控制台打印API调用日志
  LOG_REQUESTS: true,

  // 是否持久化数据到localStorage
  PERSIST_DATA: true,

  // localStorage的key前缀
  STORAGE_PREFIX: 'flowgram_mock_',
};
```

## 开发者工具

在浏览器控制台中，您可以使用 `mockUtils` 对象来管理mock数据：

### 清除所有mock数据
```javascript
mockUtils.clearAllMockData()
```

### 重置数据到初始状态
```javascript
mockUtils.resetMockData()
```

### 导出当前数据（用于备份）
```javascript
const backup = mockUtils.exportMockData()
console.log(backup)
```

### 导入数据（用于恢复）
```javascript
const backupData = '{"modules":[...],"entities":[...],...}'
mockUtils.importMockData(backupData)
```

### 查看当前配置
```javascript
console.log(mockUtils.config)
```

## 数据持久化

当 `PERSIST_DATA: true` 时：
- 您对数据的修改会保存在浏览器的localStorage中
- 刷新页面后数据不会丢失
- 可以继续之前的工作状态

当 `PERSIST_DATA: false` 时：
- 每次刷新页面都会重置为初始mock数据
- 适合测试场景

## 切换到真实API

当您需要连接真实后台服务时：

1. 确保后台服务运行在 `http://localhost:9999`
2. 修改 `mock-config.ts`：
   ```typescript
   ENABLED: false
   ```
3. 重新启动开发服务器

## API接口映射

Mock系统模拟了以下API接口：

### 模块接口
- `GET /cm/module/` - 获取所有模块
- `GET /cm/module/{id}/` - 获取单个模块
- `POST /cm/module/` - 创建新模块
- `PUT /cm/module/{id}/` - 更新模块
- `DELETE /cm/module/{id}/` - 删除模块

### 实体接口
- `GET /cm/entity/` - 获取所有实体
- `GET /cm/entity/{id}/` - 获取单个实体
- `POST /cm/entity/` - 创建新实体
- `PUT /cm/entity/{id}/` - 更新实体
- `DELETE /cm/entity/{id}/` - 删除实体

## 添加新的Mock数据

如需添加新的mock数据，编辑 `mock-data.ts` 文件：

```typescript
// 添加新模块
export const MOCK_MODULES: Module[] = [
  // ... 现有模块
  {
    id: 'new-module',
    name: '新模块',
    description: '新模块描述',
    attributes: [
      // ... 属性定义
    ],
  },
];

// 添加新实体
export const MOCK_ENTITIES: Entity[] = [
  // ... 现有实体
  {
    id: 'new-entity',
    name: '新实体',
    description: '新实体描述',
    bundles: ['new-module'],
    attributes: [
      // ... 属性定义
    ],
  },
];
```

## 故障排除

### 1. Mock数据没有加载
- 检查 `mock-config.ts` 中的 `ENABLED` 是否为 `true`
- 查看浏览器控制台是否有错误信息

### 2. 数据修改没有保存
- 检查 `PERSIST_DATA` 配置
- 确认浏览器支持localStorage

### 3. API调用失败
- 查看控制台的 `[MOCK API]` 日志
- 确认URL格式是否正确

### 4. 切换到真实API后出错
- 确认后台服务正在运行
- 检查API接口格式是否匹配

## 注意事项

1. Mock数据仅用于开发环境，生产环境请使用真实API
2. localStorage有存储限制，大量数据可能会超出限制
3. 不同浏览器的localStorage是独立的
4. 清除浏览器数据会删除所有mock数据
