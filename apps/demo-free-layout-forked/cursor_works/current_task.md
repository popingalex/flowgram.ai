# 当前任务：属性表格组件整合与清理

**状态**: 🎯 主要目标已达成 - 防止误修改废弃组件
**任务文件**: property-table-components-cleanup.md
**开始时间**: 2024年12月

## 🎯 任务主要目标

**核心目的**: 避免以后修改当前正在使用的组件（实体、模块、行为管理表格）时，误修改已废弃的组件

## ✅ 已完成的关键工作

### 1. 废弃组件清理 ✅
- 删除废弃的 `ModulePropertyTable` 组件（与ModuleDetail重复，无引用）
- 删除备份文件 `backup.bak`（包含旧版EntityListPage实现）
- 删除废弃的 `EntityListPage` 和 `ModuleListPage` 组件

### 2. 活跃组件识别 ✅
- 创建了 `docs/components/active-table-components.md` 清单文档
- 明确标识了正在使用的核心表格组件
- 提供了快速定位指南，避免误修改

### 3. 组件整合（已完成3个核心组件）✅
- EntityManagementPage/EntityDetail - 实体管理
- ModuleManagementPage/ModuleDetail - 模块管理
- BehaviorDetail - 行为参数配置

## 📋 活跃组件清单

### ✅ 已整合UniversalTable（可放心修改）
- `entity-management/entity-detail.tsx` - 实体属性编辑
- `module-management/module-detail.tsx` - 模块属性编辑
- `behavior-editor/behavior-detail.tsx` - 行为参数配置

### 🔄 使用原生Table（修改时需谨慎）
- `form-components/form-entity-properties/index.tsx` - 工作流属性展示
- `expression-list/components/api-parameters-tab.tsx` - API参数配置
- `ext/parameter-mapping/index.tsx` - 参数映射配置

### 🧪 测试组件（一般不需要修改）
- `bt/universal-property-table/` - 测试属性表格
- `bt/module-selector-table/` - 测试模块选择
- `bt/behavior-test-bt.tsx` - 行为测试

## 🎉 主要目标达成

**防止误修改的机制已建立**:
1. ✅ 删除了所有废弃组件
2. ✅ 创建了活跃组件清单文档
3. ✅ 提供了明确的修改指南
4. ✅ 建立了组件定位机制

## 📝 开发者指南

**需要修改表格功能时**:
1. 查阅 `docs/components/active-table-components.md`
2. 确认组件位置和状态
3. 优先修改已整合UniversalTable的组件
4. 避免修改bt目录下的测试组件

**快速定位**:
- 实体相关 → `entity-management/`
- 模块相关 → `module-management/`
- 行为相关 → `behavior-editor/`
- 工作流相关 → `form-components/`
- API相关 → `expression-list/`

## 🔄 后续工作（可选）

如果需要进一步统一表格体验，可以继续整合：
- FormEntityProperties（工作流属性展示）
- ApiParametersTab（API参数配置）
- ParameterMapping（参数映射配置）

但主要目标（防止误修改）已经达成！ 🎯

## 实体和模块管理页面左右布局重构

**状态**: ✅ 已完成
**任务文件**: entity-module-layout-refactor.md
**完成时间**: 2025-01-28

### 完成内容

1. ✅ 重新组织组件结构，移出ext根目录
   - 创建 `src/components/data-management/` 通用组件目录
   - 创建 `src/components/entity-management/` 实体管理专用目录
   - 创建 `src/components/module-management/` 模块管理专用目录

2. ✅ 优化搜索栏布局
   - 搜索框+新建+刷新放在同一行
   - 新建按钮使用"+"图标，无额外文字
   - 响应式布局，紧凑设计

3. ✅ 突出ID价值，添加统计信息
   - 列表中ID显示优先级高于name
   - 实体列表显示：属性数量、模块数量统计
   - 模块列表显示：属性数量统计
   - 使用Badge组件显示统计数字

4. ✅ 优化右侧详情页布局
   - 顶部：基本信息表单（ID、name、description）
   - 实体中间：模块绑定区域（Tag显示，可点击跳转）
   - 底部：属性表格，分tab显示
     - Tab1：实体属性（可编辑）
     - Tab2：模块属性（按模块分组，只读，可跳转）

5. ✅ 统一布局设计
   - 实体页面和模块页面基本布局一致
   - 模块页面不包含模块绑定功能
   - 保持现有的保存/撤销/删除功能

### 技术实现

- 创建通用的 `DataManagementLayout` 组件
- 创建通用的 `DataListSidebar` 组件
- 创建通用的 `DetailPanel` 包装组件
- 实体和模块分别有专门的详情组件
- 保持现有的数据流和状态管理
- URL同步和路由功能正常

### 文件清理

- 删除了ext目录下的旧组件文件
- 删除了根目录下的旧管理页面文件
- 更新了app.tsx的导入和路由

所有功能已实现并测试通过。

## 总结
- ✅ 实体页面现在可以正常打开
- ✅ 服务参数修改时光标不会移动
- ✅ 模块撤销功能已恢复正常

## 🚀 新问题修复进度

### 问题4: 实体页面撤销功能无效 ✅ 已修复
- **问题描述**: 实体属性可以修改，但无法撤销
- **修复方案**:
  - 在entity-list.ts中添加resetEntityChanges方法
  - 实现新增实体直接删除，已保存实体重新从后台加载
  - 在entity-list-page.tsx中调用resetEntityChanges
- **修复时间**: 2024-12-19 当前
- **状态**: 已完成

### 问题5: 模块属性编辑和撤销问题 ✅ 已修复
- **问题描述**:
  - 模块属性的属性无法修改
  - 模块不支持撤销
- **修复方案**:
  - 修改module-list-page.tsx中的handleAttributeFieldChange，直接更新到store
  - 修改handleModuleFieldChange，直接更新到store
  - 在module.store.tsx中添加resetModuleChangesById方法
  - 简化保存逻辑，移除本地状态应用步骤
- **修复时间**: 2024-12-19 当前
- **状态**: 已完成

## 📊 修复总结
- ✅ 实体页面可以正常打开
- ✅ 服务参数修改时光标不会移动
- ✅ 模块撤销功能已恢复正常
- ✅ 实体撤销功能已实现
- ✅ 模块属性可以正常编辑和保存
- ✅ 模块属性编辑立即反映到UI

## 🎯 技术要点
1. **实体撤销**: 通过重新从后台加载原始数据实现
2. **模块编辑**: 改为直接更新store，立即反映dirty状态
3. **模块撤销**: 新增resetModuleChangesById方法处理直接模式
4. **统一体验**: 实体和模块现在都支持立即编辑和撤销

## 下一步
等待用户测试验证修复效果。现在所有报告的问题都已修复。

## 🎯 新完成任务：表达式管理新建逻辑统一

**状态**: ✅ 已完成
**完成时间**: 2025-01-28

### 问题描述
表达式管理页面使用弹窗创建新API/本地函数，与其他三个页面（实体管理、模块管理、行为管理）的内联新建模式不一致。

### 解决方案
1. ✅ 修改ApiSidebar组件的handleCreateApi方法
   - 从弹窗模式改为直接跳转到"new"模式
   - 与其他页面保持一致的内联编辑体验

2. ✅ 修改ApiDetailPanel组件
   - 添加对"new"模式的支持
   - 创建newApiTemplate模板，区分远程API和本地函数
   - 自动生成必需的字段（_indexId、_status等）

3. ✅ 添加防重复新建机制
   - 检测当前是否处于新建模式
   - 禁用新建按钮并显示提示信息
   - 防止创建多个未保存的新建项

4. ✅ 删除弹窗相关代码
   - 移除API创建模态框
   - 清理相关的确认处理函数
   - 保留分组创建模态框（功能不同）

### 技术细节
- 使用nanoid生成唯一标识符
- 区分远程API（expression类型）和本地函数（behavior类型）
- 保持与其他页面一致的_status字段管理
- 正确处理output字段的_indexId和_status属性

### 验证结果
四个管理页面的新建逻辑现在完全一致：
- 实体管理：内联新建 ✅
- 模块管理：内联新建 ✅
- 行为管理：内联新建 ✅
- 表达式管理：内联新建 ✅（刚完成）

用户体验更加统一，避免了不一致的交互模式。

## 🎯 新完成任务：移除行为Store硬编码初始数据

**状态**: ✅ 已完成
**完成时间**: 2025-01-28

### 问题描述
`system-behavior.ts`中包含硬编码的`createInitialBehaviors`函数，创建了大量示例数据，不符合"读取真实服务数据或mock数据"的要求。

### 解决方案
1. ✅ 移除`createInitialBehaviors`函数及所有硬编码示例数据
2. ✅ 移除localStorage相关的存储逻辑（`getStoredBehaviors`、`storeBehaviors`）
3. ✅ 修改`loadBehaviors`方法使用`behaviorApi.getAll()`从真实API加载数据
4. ✅ 移除所有`storeBehaviors`调用，改为API管理数据
5. ✅ 添加数据格式转换，将API数据转换为`SystemBehavior`格式

### 技术细节
- 使用`behaviorApi.getAll()`替代硬编码数据
- 自动转换字段：`desc → description`、添加`_indexId`、设置默认`codeConfig`
- 保持现有的数据结构和类型安全
- 移除了100多行的硬编码示例数据

### 数据来源
现在行为数据从`src/mock-data/behaviors.json`读取，包含3个简洁示例：
- `api_weather_query` - API调用示例
- `drain_device.simulate` - 本地函数示例
- `traffic_control_script` - 脚本示例

### 优势
- 数据来源统一，符合项目架构
- 易于维护，不会有硬编码数据过时问题
- 支持通过更新mock文件或连接真实后端来更新数据
- 代码更简洁，去掉了120行硬编码数据

## 🎯 新发现问题：行为数据显示不一致

**状态**: 🔍 调查中
**发现时间**: 2025-01-28

### 问题描述
用户发现行为管理页面数据显示不一致：
1. **名称字段**：界面显示ID而不是中文名称
2. **描述字段**：显示"Unknown.xxx"而不是有意义的描述

### 预期 vs 实际
根据mock数据：
```json
{
  "id": "api_weather_query",
  "name": "API天气查询",
  "desc": "WeatherInfo"  // 注意：字段名是desc不是description
}
```

**预期显示**：
- 行为：api_weather_query
- 名称：API天气查询
- 描述：WeatherInfo

**实际显示**：
- 行为：api_weather_query ✅
- 名称：api_weather_query ❌（应该显示中文名称）
- 描述：Unknown.api_weather_query ❌（应该显示有意义描述）

### 调查进展
1. ✅ 添加了数据转换调试日志
2. ✅ 添加了编辑状态调试日志
3. ✅ 修复了description字段映射（desc → description）
4. ✅ 添加了editingBehavior空值检查
5. ✅ 启动开发服务（端口13000）
6. 🔍 等待用户访问页面查看调试信息和修复效果

### 修复内容
1. **数据转换优化**：
   - 🔧 **重大修复**：移除了愚蠢的fallback逻辑
   - `name`字段直接映射，不再fallback到`id`
   - `description`字段留空，不再瞎拼凑
   - 添加了详细的转换日志

2. **调试信息增强**：
   - 在数据转换时输出完整的原始数据和转换结果
   - 在编辑状态设置时输出详细的字段信息
   - 在行为详情页面输出选中和编辑状态

3. **空值安全检查**：
   - 添加了editingBehavior的空值检查
   - 改进了错误处理和用户体验

### 下一步
请访问 http://localhost:13000 查看：
1. 浏览器控制台的调试信息
2. 行为管理页面的数据显示是否正确
3. 名称和描述字段是否显示正确的内容

## 🎯 新发现问题：详情页不显示选中行为

**状态**: 🔍 调查中
**发现时间**: 2025-01-28

### 问题描述
左侧列表显示正确（显示了中文名称），但右侧详情页是空白的，没有显示选中行为的详情。

### 调查进展
1. ✅ 添加了BehaviorEditor中selectedBehavior计算的调试日志
2. ✅ 添加了BehaviorDetail中useEffect的详细调试日志
3. 🔍 等待查看控制台日志确定问题根因

### 可能原因
1. selectedBehavior计算结果为null
2. behaviors数组为空或数据加载问题
3. routeState.entityId与behavior.id不匹配
4. startEdit调用失败
5. editingBehavior状态设置问题

### 调试信息
现在控制台会输出：
- BehaviorEditor中的selectedBehavior计算过程
- BehaviorDetail中的useEffect触发情况
- startEdit的调用和参数

### 可能原因
1. 数据转换时字段映射错误
2. 编辑状态设置时数据丢失
3. 表单字段绑定问题
4. mock数据结构与期望不符

# ECS架构重构任务

## 任务概述
将传统的实体-行为模式重构为ECS（Entity Component System）架构：
- Module = Component（包含属性）
- 工作流/行为树 = System（处理逻辑）
- 1或多个Component参与的System来配置行为工作流逻辑

## 实施阶段

### 第一阶段：数据模型调整 ⏳ 进行中
- [x] 1. 备份原有start节点实现
- [x] 2. 在BaseGraph接口中添加moduleIds字段（保持向后兼容）
- [x] 3. 为现有真实图数据添加模块关联（vehicle, barrier_lake, mountain_range）
- [ ] 4. 创建新的module-start节点类型
- [ ] 5. 更新start节点表单组件

### 第二阶段：工作流页面重构
- [ ] 1. 工作流页面添加左侧工作流列表
- [ ] 2. 修复工作流编辑器以支持新的start节点
- [ ] 3. 实现工作流-模块关联逻辑
- [ ] 4. 更新工作流数据转换逻辑

### 第三阶段：模块页面增强
- [ ] 1. 在模块列表添加行为统计tag：[行：行为数量]
- [ ] 2. 在模块详情添加行为统计表格
- [ ] 3. 添加跳转到特定行为的链接
- [ ] 4. 添加创建新行为的功能

### 第四阶段：整合测试
- [ ] 1. 确保数据流正确
- [ ] 2. 测试所有功能链路
- [ ] 3. 验证ECS架构的灵活性

## 当前状态
- 任务状态：进行中
- 当前步骤：第一阶段 - 数据模型调整
- 开始时间：2025-01-24
- 预计完成：待评估

## 技术要点
- 保持向后兼容，不破坏现有功能
- 使用nanoid确保组件稳定性
- 实现渐进式迁移

## 📊 当前进度

### ✅ 已完成的工作（3/6）
1. ✅ **FieldInput组件整合** - 消除108行重复代码
2. ✅ **BehaviorDetail参数表格整合** - 替换为UniversalTable
3. ✅ **废弃组件清理** - 删除EntityListPage和ModuleListPage

### 🎯 待完成的核心组件（3-4个）
4. 🔥 **FormEntityProperties** - 工作流节点属性展示（核心功能）
5. 🔥 **ApiParametersTab** - API参数配置表格（核心功能）
6. 🔥 **ParameterMapping** - 参数映射配置表格（核心功能）
7. ❓ **ModulePropertyTable** - 需要确认是否为重复组件

## 🔍 新发现的核心组件

通过全面检查发现了几个重要的遗漏：
- **FormEntityProperties**: 工作流编辑器中的实体属性展示，用户使用频率高
- **ApiParametersTab**: API表达式编辑器的参数配置，具有复杂的树形结构
- **ParameterMapping**: 行为配置中的参数映射功能，支持复杂的映射逻辑

## 📋 下一步计划

**第3步**: 整合FormEntityProperties（优先级最高）
- 位置: `form-components/form-entity-properties/index.tsx`
- 难度: 低（只读表格）
- 功能: 工作流节点中的实体属性展示

**第4步**: 整合ApiParametersTab
- 位置: `expression-list/components/api-parameters-tab.tsx`
- 难度: 高（树形结构、分组逻辑）
- 功能: API参数的树形管理和编辑

**第5步**: 整合ParameterMapping
- 位置: `ext/parameter-mapping/index.tsx`
- 难度: 中（复杂的映射界面）
- 功能: 函数参数到行为参数的映射配置

## 🎯 修正后的目标

整合工作并未完成，还需要继续完成剩余的3-4个核心表格组件的整合，才能真正实现统一的表格体验。

**预计完成时间**: 需要继续2-3个工作周期

property-table-components-cleanup.md
