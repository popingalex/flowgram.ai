# Mock数据系统总结

## 概述

我已经为您的工作流引擎UI创建了一个完整的mock数据系统，让您在没有后台服务的情况下也能继续开发。

## 已创建的文件

### 1. 核心文件
- `src/components/ext/api/mock-data.ts` - Mock数据定义
- `src/components/ext/api/mock-config.ts` - Mock配置和工具函数
- `src/components/ext/api/config.ts` - 更新的API配置，支持mock模式
- `src/components/ext/api/README.md` - 详细使用说明

### 2. 测试文件
- `src/components/ext/mock-test-page.tsx` - Mock系统测试页面

### 3. 更新的文件
- `src/components/ext/entity-property-type-selector/enum-store.tsx` - 使用mock数据

## Mock数据内容

### 模块 (6个)
1. **用户信息模块** - 姓名、邮箱、手机号、年龄
2. **地址信息模块** - 省份、城市、区县、街道、邮政编码
3. **车辆信息模块** - 品牌、型号、年份、颜色、车牌号
4. **订单信息模块** - 订单号、总金额、状态、创建时间、商品列表
5. **商品信息模块** - 商品名称、价格、分类、描述、库存
6. **支付信息模块** - 支付方式、支付金额、交易号、支付状态

### 实体 (5个)
1. **客户** - 关联用户信息和地址信息模块
2. **车辆** - 关联车辆信息模块
3. **订单** - 关联订单信息和支付信息模块
4. **商品** - 关联商品信息模块
5. **员工** - 关联用户信息模块

### 枚举类 (10个)
- 车辆类型、颜色、尺寸、VIP等级、燃料类型
- 订单优先级、配送方式、品牌、部门、职位

## 功能特性

### 1. 智能切换
- 通过 `mock-config.ts` 中的 `ENABLED` 配置一键切换mock/真实API
- 无需修改业务代码

### 2. 数据持久化
- 支持localStorage持久化，刷新页面数据不丢失
- 可配置是否启用持久化

### 3. 完整的CRUD操作
- 支持创建、读取、更新、删除操作
- 模拟真实API的响应格式和延迟

### 4. 开发者工具
- 控制台 `mockUtils` 对象提供数据管理功能
- 支持数据导出/导入、重置、清除等操作

### 5. 请求日志
- 可配置的API调用日志，方便调试
- 模拟网络延迟，接近真实环境

## 使用方法

### 启用Mock模式
```typescript
// 编辑 src/components/ext/api/mock-config.ts
export const MOCK_CONFIG = {
  ENABLED: true,  // 启用mock模式
  // ...
};
```

### 切换到真实API
```typescript
// 编辑 src/components/ext/api/mock-config.ts
export const MOCK_CONFIG = {
  ENABLED: false,  // 使用真实API
  // ...
};
```

### 开发者工具使用
在浏览器控制台中：
```javascript
// 查看配置
mockUtils.config

// 清除所有数据
mockUtils.clearAllMockData()

// 重置到初始状态
mockUtils.resetMockData()

// 导出数据备份
const backup = mockUtils.exportMockData()

// 导入数据
mockUtils.importMockData(backupData)
```

## 测试验证

1. 启动开发服务器：`rush dev:demo-free-layout-forked`
2. 访问测试页面查看mock系统状态
3. 在模块选择器和实体编辑器中测试CRUD操作
4. 查看浏览器控制台的API调用日志

## 配置选项

```typescript
export const MOCK_CONFIG = {
  ENABLED: true,           // 是否启用mock模式
  DELAY: 300,             // API延迟时间(ms)
  LOG_REQUESTS: true,     // 是否打印请求日志
  PERSIST_DATA: true,     // 是否持久化数据
  STORAGE_PREFIX: 'flowgram_mock_',  // localStorage前缀
};
```

## 优势

1. **无依赖开发** - 不需要后台服务即可开发UI
2. **数据完整性** - 提供了丰富的测试数据
3. **真实体验** - 模拟网络延迟和真实API响应
4. **易于切换** - 一键切换mock/真实API
5. **数据管理** - 完善的数据管理工具
6. **持久化** - 支持数据持久化，保持工作状态

## 注意事项

1. Mock数据仅用于开发环境
2. localStorage有存储限制
3. 不同浏览器的数据是独立的
4. 清除浏览器数据会删除所有mock数据

现在您可以在任何地方继续开发工作流引擎UI，无需依赖后台服务！
