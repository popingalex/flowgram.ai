# Invoke节点开发总结

## 🎯 目标实现

基于LLM节点复制开发了新的**Invoke节点**，用于调用函数或远程API，支持参数映射和结果输出到工作流。

## ✅ 已完成的功能

### 1. 节点注册和基础结构 ✅
- ✅ 创建了 `WorkflowNodeType.Invoke` 节点类型
- ✅ 实现了 `InvokeNodeRegistry` 节点注册器
- ✅ 添加到节点注册列表中
- ✅ 设置了节点大小 (400x350) 和基础配置

### 2. 函数管理系统 ✅
- ✅ 创建了 `function.store.ts` 函数管理Store
- ✅ 定义了完整的函数数据结构：
  - `FunctionParameter` - 函数参数定义
  - `FunctionReturn` - 函数返回值定义
  - `FunctionDef` - 完整函数定义
- ✅ 实现了函数CRUD操作
- ✅ 包含了3个示例函数：用户信息获取、数据转换、邮件发送

### 3. 节点配置Schema ✅
- ✅ 定义了完整的输入参数Schema：
  - `functionId` - 函数选择
  - `endpoint` - API端点
  - `method` - HTTP方法
  - `headers` - 请求头
  - `timeout` - 超时设置
- ✅ 定义了输出结果Schema：
  - `success` - 调用成功状态
  - `result` - 调用结果数据
  - `error` - 错误信息
  - `statusCode` - HTTP状态码
  - `responseTime` - 响应时间

### 4. 函数选择器组件 🔧
- ✅ 创建了 `function-selector` 组件基础结构
- ⚠️ 存在一些类型错误，需要进一步完善

### 5. 边栏显示逻辑修复 ✅
- ✅ **问题发现**: 所有节点边栏都显示实体属性表，应该只有Start节点显示
- ✅ **根因分析**: `FormOutputs`组件对非Start节点返回`true`，显示所有属性
- ✅ **解决方案**: 修改过滤逻辑，非Start节点只显示节点自身的输出属性
- ✅ **修改文件**: `form-components/form-outputs/index.tsx`
- ✅ **修改内容**: 将`return true`改为`return !prop.isEntityProperty && !prop.isModuleProperty`

## 📁 创建的文件列表

### 核心节点文件
1. **`src/nodes/constants.ts`** - 添加了 `Invoke` 节点类型
2. **`src/nodes/invoke/index.ts`** - Invoke节点注册器实现
3. **`src/nodes/index.ts`** - 注册了新节点到系统中
4. **`src/assets/icon-invoke.jpg`** - 临时图标 (复制自LLM)

### 数据管理文件
5. **`src/stores/function.store.ts`** - 函数管理Store (完整实现，兼容性包装)
6. **`src/stores/behavior.store.ts`** ✅ 新增 - 后台函数行为API管理Store
7. **`src/services/types.ts`** ✅ 更新 - 添加了BehaviorDef相关类型定义
8. **`src/services/api-service.ts`** ✅ 更新 - 添加了behaviorApi接口
9. **`src/services/mock-data.ts`** ✅ 更新 - 添加了MOCK_BEHAVIORS数据

### UI组件文件
10. **`src/components/ext/function-selector/index.tsx`** - 函数选择器组件 (需完善)
11. **`src/components/ext/behavior-test.tsx`** ✅ 新增 - API测试页面

### 应用集成文件
12. **`src/stores/index.ts`** ✅ 更新 - 导出behavior store hooks
13. **`src/app.tsx`** ✅ 更新 - 添加BehaviorStoreInitializer和测试页面路由

## 🎯 核心设计特点

### 1. 参数映射机制
- 支持将工作流上游数据映射到函数参数
- 类似LLM节点的变量绑定方式
- 支持复杂对象和数组参数类型

### 2. 多类型函数支持
- **用户类函数**: 获取用户信息等
- **工具类函数**: 数据转换、格式化等
- **通知类函数**: 邮件、短信发送等
- 支持按分类管理和搜索

### 3. 丰富的输出信息
- 不仅返回函数结果，还包含：
  - 调用成功状态
  - HTTP状态码
  - 响应时间
  - 错误信息
- 便于工作流的错误处理和监控

### 4. 灵活的API配置
- 支持自定义HTTP方法
- 支持自定义请求头
- 支持超时配置
- 支持参数验证和枚举值

### 5. 边栏显示控制 ✅
- **Start节点**: 显示实体基本信息 + 实体属性 + 模块属性
- **其他节点**: 只显示节点自身的输入/输出参数
- **智能过滤**: 根据属性标记自动过滤显示内容

### 6. 后台API集成 ✅ 新增
- ✅ **API配置扩展**: 在`api-service.ts`中添加了`/hub/behaviors/`端点
- ✅ **类型定义**: 新增`BehaviorDef`、`BehaviorParameter`、`BehaviorReturn`类型
- ✅ **Mock数据**: 添加了5个示例函数行为的mock数据
- ✅ **API封装**: 创建了`behaviorApi`的完整CRUD接口
- ✅ **Behavior Store**: 创建了新的`behavior.store.ts`管理后台函数API
- ✅ **Store初始化**: 在app.tsx中添加了`BehaviorStoreInitializer`组件
- ✅ **兼容性包装**: 更新`function.store.ts`使用behavior store作为数据源
- ✅ **测试页面**: 创建了`behavior-test.tsx`用于验证API调用和数据展示

### 7. 数据管理架构优化 ✅ 新增
- ✅ **Store索引导出**: 将behavior store添加到主stores/index.ts中
- ✅ **nanoid支持**: 为BehaviorDef添加了`_indexId`字段用于稳定的React key
- ✅ **缓存机制**: 实现了5分钟缓存避免重复API请求
- ✅ **错误处理**: 完整的加载状态、错误状态管理
- ✅ **数据转换**: 创建了BehaviorDef到FunctionDef的映射函数保持向后兼容

## 🔧 待完善的功能

### 1. 函数选择器组件修复 🔧
- ⚠️ 修复类型错误 (IconFunction, Tag color等) - 部分已修复
- ⚠️ 完善Card组件的onClick事件处理
- ⚠️ 优化UI交互体验

### 2. 参数映射UI
- 实现参数到工作流数据的映射界面
- 类似LLM节点的变量选择器
- 支持复杂数据结构的映射

### 3. 测试和验证 ✅ 部分完成
- ✅ 创建了behavior测试页面验证API调用
- ✅ 可以通过"测试页面 > 函数行为测试"访问
- 📋 测试参数映射功能
- 📋 验证错误处理机制

### 4. 运行时实现
- 实现实际的API调用逻辑
- 处理认证和授权
- 实现重试机制

## 🎯 下一步计划

1. **修复函数选择器** - 解决类型错误，完善UI
2. **实现参数映射** - 创建参数绑定界面
3. **添加运行时逻辑** - 实现真实的API调用
4. **测试验证** - 端到端测试整个流程
5. **文档完善** - 添加使用文档和示例

## 💡 技术亮点

- **基于LLM节点复制**: 快速复用成熟的架构模式
- **类型安全**: 完整的TypeScript类型定义
- **模块化设计**: Store、组件、节点分离，便于维护
- **扩展性**: 支持任意函数和API的接入
- **监控友好**: 丰富的输出信息便于调试和监控
- **智能边栏**: 根据节点类型智能显示相关属性

## 🔍 编译状态

✅ **当前编译通过** - 基础框架已就绪，边栏显示逻辑已修复

## 🐛 修复记录

### 边栏实体属性表显示问题 (已修复)
- **问题**: 所有节点的边栏都显示实体属性表，应该只有Start节点显示
- **影响**: 用户在查看LLM、Condition等节点时也会看到实体属性，造成界面混乱
- **原因**: `FormOutputs`组件对非Start节点的过滤逻辑返回`true`，显示所有属性
- **修复**: 修改过滤逻辑为`!prop.isEntityProperty && !prop.isModuleProperty`
- **结果**: 现在只有Start节点显示实体属性，其他节点只显示自身的输入输出参数

### 实体属性表展开按钮显示问题 (已修复)
- **问题**: 所有实体属性行都显示展开/收缩按钮，但基础类型不应该可以展开
- **影响**: 用户会看到string、number等基础类型也有展开按钮，点击后无内容显示
- **原因**: Table组件缺少`rowExpandable`属性来控制哪些行可以展开
- **修复**: 添加`rowExpandable`函数，只有复合类型（有子属性的object类型）才可以展开
- **修复文件**: `entity-property-tables/sidebar-editor.tsx`
- **修复内容**:
  ```typescript
  rowExpandable={(record) => {
    if (!record) return false;
    const typedInfo = TypedParser.fromString(record.type);
    return typedInfo.attributes.length > 0; // 只有有子属性的复合类型才可以展开
  }}
  ```
- **额外修复**: 修正了Attribute类型的import路径从`../entity-store`到`../../../services/types`
- **结果**: 现在只有复合类型的属性才显示展开按钮，基础类型不再显示

invoke节点的核心框架已经搭建完成，边栏显示逻辑也已修复。现在可以重点完善函数选择器UI和参数映射功能。
