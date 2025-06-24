# 实体管理页面 E2E 测试

本项目包含了完整的实体管理页面端到端测试用例，使用 Playwright 框架。

## 测试覆盖范围

### 1. 基本功能测试
- ✅ 页面加载和布局验证
- ✅ 实体创建和基本信息编辑
- ✅ 实体查询和选择功能
- ✅ 表单验证和错误处理

### 2. 实体属性管理
- ✅ 添加属性
- ✅ 编辑属性（ID、名称、类型）
- ✅ 删除属性
- ✅ 属性类型选择

### 3. 模块绑定功能
- ✅ 绑定模块到实体
- ✅ 解绑模块
- ✅ 模块关联状态验证

### 4. 数据持久化
- ✅ 保存实体修改
- ✅ 撤销修改功能
- ✅ 删除实体

### 5. 工作流编辑扩展
- ✅ 进入工作流编辑页面
- ✅ 工作流编辑器加载验证
- 🔄 为未来的工作流测试预留扩展空间

## 运行测试

### 前置条件
1. 确保项目已正确安装依赖：
   ```bash
   rush update
   ```

2. 启动开发服务器：
   ```bash
   rush dev:demo-free-layout-forked
   ```

### 运行测试命令

```bash
# 进入项目目录
cd apps/demo-free-layout-forked

# 运行所有测试（无头模式）
npm run test:e2e

# 运行测试并显示浏览器界面（便于调试）
npx playwright test --headed

# 使用 Playwright UI 模式运行测试
npm run test:e2e:ui

# 调试模式运行测试
npm run test:e2e:debug

# 运行特定测试文件
npx playwright test entity-management.spec.ts

# 运行特定测试用例
npx playwright test -g "创建新实体并编辑基本信息"
```

## 测试数据

测试使用动态生成的测试数据，包括：
- 实体ID：`test_helicopter_${timestamp}`
- 实体名称：`测试直升机`
- 实体描述：`这是一个用于测试的直升机实体`

## 页面对象模型 (POM)

测试采用页面对象模型设计，主要包含：

### EntityManagementPage 类
- `navigate()` - 导航到实体管理页面
- `addEntity()` - 添加新实体
- `editEntityBasicInfo()` - 编辑实体基本信息
- `saveEntity()` - 保存实体
- `undoChanges()` - 撤销修改
- `deleteEntity()` - 删除实体
- `addProperty()` - 添加属性
- `editProperty()` - 编辑属性
- `deleteProperty()` - 删除属性
- `bindModule()` - 绑定模块
- `unbindModule()` - 解绑模块
- `enterWorkflowEdit()` - 进入工作流编辑
- 各种验证方法

## 测试用例详情

### 1. `基本页面加载和布局验证`
验证页面标题、侧边栏、详情面板和操作按钮是否正确显示。

### 2. `创建新实体并编辑基本信息`
测试完整的实体创建流程，包括添加、编辑和保存。

### 3. `编辑实体属性管理`
测试属性的增删改功能，验证属性管理的完整性。

### 4. `模块绑定和解绑功能`
测试实体与模块的关联管理功能。

### 5. `撤销修改功能`
验证撤销功能是否正确恢复数据。

### 6. `实体查询和选择功能`
测试搜索、过滤和选择实体的功能。

### 7. `工作流编辑扩展功能`
验证从实体管理页面跳转到工作流编辑的功能。

### 8. `删除实体功能`
测试实体删除的完整流程。

### 9. `表单验证和错误处理`
验证表单验证规则和错误提示。

## 测试元素定位

测试使用 `data-testid` 属性进行元素定位，主要标识符包括：

### 页面结构
- `entity-sidebar` - 实体侧边栏
- `entity-detail-panel` - 实体详情面板
- `empty-state` - 空状态显示

### 操作按钮
- `add-entity-btn` - 添加实体按钮
- `save-entity-btn` - 保存实体按钮
- `undo-entity-btn` - 撤销修改按钮
- `delete-entity-btn` - 删除实体按钮
- `workflow-edit-btn` - 工作流编辑按钮

### 输入框
- `entity-id-input` - 实体ID输入框
- `entity-name-input` - 实体名称输入框
- `entity-description-input` - 实体描述输入框
- `entity-search-input` - 实体搜索输入框

### 属性管理
- `add-property-btn` - 添加属性按钮
- `property-row-{index}` - 属性行
- `property-id-input` - 属性ID输入框
- `property-name-input` - 属性名称输入框
- `property-type-selector` - 属性类型选择器
- `delete-property-btn` - 删除属性按钮

### 模块关联
- `module-checkbox-{moduleId}` - 模块关联复选框

### 实体列表
- `entity-item-{entityId}` - 实体列表项

### 工作流编辑
- `workflow-editor` - 工作流编辑器

## 扩展测试

为了支持未来的功能扩展，测试框架已预留以下扩展点：

1. **工作流编辑测试**：可在 `enterWorkflowEdit()` 后添加具体的工作流操作测试
2. **权限管理测试**：可添加不同用户角色的访问权限测试
3. **性能测试**：可添加大量数据下的性能测试
4. **集成测试**：可添加与后端API的集成测试

## 注意事项

1. 测试运行前确保开发服务器已启动且端口为3000
2. 测试数据会在每次运行时动态生成，避免数据冲突
3. 建议在CI/CD环境中使用无头模式运行测试
4. 测试失败时会自动截图和录制视频，便于问题排查
5. 测试设计为幂等的，可重复运行而不影响结果
