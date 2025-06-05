# FormOutputs 重构任务

## 问题背景
- FormOutputs承担了过多职责，既展示实体meta信息，又展示实体属性作为节点输出
- 实体meta信息（id/name/desc）不应该在FormOutputs中展示
- 实体属性被错误地当作了所有节点的outputs，导致展示和数据耦合

## 解决方案

### 1. 创建 FormEntityMetas 组件
- 路径：`src/form-components/form-entity-metas/index.tsx`
- 职责：专门显示实体的meta信息（id/name/description）
- 特点：只读展示，带有表单样式

### 2. 创建 FormEntityProperties 组件
- 路径：`src/form-components/form-entity-properties/index.tsx`
- 职责：专门显示实体的属性信息
- 特点：使用PropertyTableAdapter，紧凑只读模式

### 3. 重构 FormOutputs 组件
- 移除了实体相关的展示逻辑
- 回归本职：只处理节点的 `data.outputs` 字段
- 简化了代码结构，职责更加单一

### 4. 修改 Start 节点表单结构
- 在节点模式下依次显示：
  1. FormEntityMetas - 实体meta信息
  2. FormEntityProperties - 实体属性
  3. FormOutputs - 节点真正的输出

## 完成状态

### 第一阶段重构
- [x] 创建 FormEntityMetas 组件
- [x] 创建 FormEntityProperties 组件
- [x] 重构 FormOutputs 组件
- [x] 修改 form-components 导出
- [x] 更新 Start 节点表单结构

### 第二阶段优化（用户建议）
- [x] 删除重复的 FormEntityProperties 组件
- [x] 创建 FormModuleOutputs 组件，专门给Start节点使用
- [x] 在属性ID上添加tooltip显示描述信息
- [x] 在模块属性计数上添加tooltip显示模块内属性列表（三列格式）
- [x] 修改NodePropertyTable支持描述tooltip
- [x] 修改DrawerPropertyTable支持描述tooltip

### 第三阶段重构（专用组件设计）
- [x] 删除复杂的PropertyTableAdapter，避免强行复用
- [x] 创建EntityAttributeTable - 节点中的实体属性表（两列）
- [x] 创建EntityModuleTable - 节点中的实体模块表（两列）
- [x] 创建SidebarPropertyEditor - 边栏中的属性编辑器（三列树形）
- [x] 更新FormModuleOutputs使用专用组件
- [x] 更新FormOutputs使用专用组件

## 效果

### 职责分离
- **FormEntityMetas**: 专门显示实体基本信息（id/name/description）
- **FormModuleOutputs**: 专门显示实体的完整属性（用于Start节点）
- **FormOutputs**: 只处理节点真正的输出数据

### 用户体验优化
- 去掉了重复的实体属性显示
- 属性ID支持描述tooltip，信息更丰富
- 模块计数标签支持详细属性列表tooltip
- 属性表格界面更简洁，信息密度更高

### 技术改进
- 代码结构更清晰，便于维护
- 组件职责单一，符合设计原则
- tooltip功能提升了信息展示密度
- 避免强行复用，每个场景使用专用组件
- 四个专用组件各司其职，功能聚焦
