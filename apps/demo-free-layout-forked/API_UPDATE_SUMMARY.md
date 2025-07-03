# API端点更新总结

## 📅 更新时间
2025年1月27日

## 🎯 更新内容

### API端点变更
将API端点从旧版本更新为新的modular结构：

#### 模块API
- **旧端点**: `GET /api/modules`
- **新端点**: `GET /api/modular/modules/`

#### 实体API  
- **旧端点**: `GET /api/entities`
- **新端点**: `GET /api/modular/entities`

### 基础URL变更
- **旧地址**: `http://192.168.239.7:8080`
- **新地址**: `http://localhost:8080`

## 🔧 修改的文件

### demo-free-layout-forked项目
1. **`src/services/api-service.ts`**
   - 更新API_CONFIG中的BASE_URL和ENDPOINTS
   - 更新mock API处理中的URL匹配逻辑
   - 更新realApiRequest中的数据转换逻辑

2. **`update-mock-data.js`**
   - 更新ENDPOINTS配置
   - 更新API端点总结输出

3. **`README.md`**
   - 添加API端点说明部分
   - 更新服务依赖信息

### simulator项目
1. **`src/config/api.ts`**
   - 更新DEFAULT_CONFIG中的ENDPOINTS

2. **`src/services/api-service.ts`**
   - 更新handleMockFallback中的端点检查逻辑

3. **`README.md`**
   - 添加API配置部分说明

## ✅ 验证结果

### Mock数据更新成功
运行`node update-mock-data.js`后成功获取数据：
- 模块数据：16条记录
- 实体数据：10条记录
- 系统数据：6条记录
- 行为数据：22条记录（20个远程行为，1个本地行为，1个脚本行为）

### API端点测试
创建了`test-api-endpoints.html`测试页面，可以验证：
- ✅ 新端点正常工作
- ❌ 旧端点应该失败（符合预期）

## 🎯 当前API端点

### 生产环境端点
- **模块**: `GET http://localhost:8080/api/modular/modules/`
- **实体**: `GET http://localhost:8080/api/modular/entities`
- **系统**: `GET http://localhost:8080/api/systems`
- **远程行为**: `GET http://localhost:8080/exp/remote`
- **本地行为**: `GET http://localhost:8080/exp/local`
- **脚本行为**: `GET http://localhost:8080/exp/script`

### 测试方式
1. 直接访问API端点
2. 使用`test-api-endpoints.html`测试页面
3. 运行`update-mock-data.js`脚本验证

## 📋 注意事项

1. **向后兼容性**: 旧端点已不再使用，确保所有客户端都更新到新端点
2. **Mock模式**: 两个项目都支持API失败时自动降级到mock数据
3. **数据格式**: 实体数据中的modules字段会自动转换为bundles字段供前端使用
4. **URL路径**: 注意模块端点以`/`结尾，实体端点不以`/`结尾

## 🔄 回滚方案

如需回滚到旧端点，需要修改以下配置：
```javascript
// 在api-service.ts或api.ts中
ENDPOINTS: {
  MODULE: '/api/modules',
  ENTITY: '/api/entities',
  // ...
}
```

## 🐛 问题修复记录

### 控制台错误修复 (2025-01-27)
**问题**: simulator项目控制台报错 `GET http://localhost:8080/entities 404 (Not Found)`

**原因**: simulator项目中的API服务方法使用硬编码的旧端点路径，未使用配置文件中的新端点

**修复内容**:
1. 更新 `simulator/src/services/api-service.ts` 中的所有API方法
2. 将硬编码的端点路径改为使用 `API_CONFIG.ENDPOINTS` 配置
3. 影响的方法：
   - `getModules()`: `/modules` → `API_CONFIG.ENDPOINTS.MODULE`
   - `getEntities()`: `/entities` → `API_CONFIG.ENDPOINTS.ENTITY`
   - `getSystems()`: `/systems` → `API_CONFIG.ENDPOINTS.SYSTEM`
   - `getScenarios()`: `/scenarios` → `API_CONFIG.ENDPOINTS.SCENARIO`

**验证**: 创建了 `simulator/test-api-fix.html` 测试页面验证修复效果

## 🚀 后续计划

1. 监控新端点的性能和稳定性
2. 确认所有相关服务都已更新到新端点
3. 考虑移除对旧端点的兼容性处理代码
4. 定期检查是否有其他硬编码端点需要更新 