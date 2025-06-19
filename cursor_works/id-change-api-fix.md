# ID变更API调用修复任务

## 问题描述

用户发现了一个严重的数据更新逻辑错误：当修改实体或模块的ID时，系统使用新的ID调用后台API，这会导致后台认为是在创建新元素，而不是修改现有元素的ID。

## 根本原因

### 错误的API调用方式
```javascript
// ❌ 错误：使用新ID调用API
await entityApi.update(entity.id, entity);  // entity.id是用户修改后的新ID
```

### 正确的API调用方式
```javascript
// ✅ 正确：使用原始ID调用API
await entityApi.update(originalId, entity);  // originalId是原始ID，entity包含新数据
```

## 修复范围

### 1. ✅ EntityListStore (entity-list.ts)
- `saveEntity` 方法：区分新增和更新，使用原始ID调用API
- 添加详细日志记录ID变更情况

### 2. ✅ ModuleStore (module.store.tsx)
- `saveModule` 方法：使用原始ID调用API
- `updateModule` 方法：使用原始ID调用API
- `addAttributeToModule` 方法：使用原始ID调用API
- `removeAttributeFromModule` 方法：使用原始ID调用API

### 3. ✅ GraphStore (graph.store.ts)
- `saveGraph` 方法：区分新增和更新，使用原始ID调用API
- 添加`_indexId`类型定义到WorkflowGraph接口

### 4. ✅ 其他Store检查完成
- EnumStore: 使用React Context，暂无update API调用
- BehaviorStore: 暂无update API调用
- 所有主要Store已修复完成

## 技术细节

### API服务架构
- 系统首先尝试真实API (`http://localhost:9999`)
- 失败时自动降级到Mock模式
- Mock数据是可变副本，支持真实CRUD操作

### 数据结构设计
- `_indexId`: nanoid生成的稳定React key
- `id`: 业务ID，用户可修改
- `originalEntity`: 保存原始数据状态

### 修复后的逻辑
1. **新增数据**: 使用 `entityApi.create()`
2. **更新数据**: 使用 `entityApi.update(originalId, newData)`
3. **ID变更**: 后台理解为"把originalId的记录更新为newData"

## 验证测试

### 测试场景
1. 修改实体ID后保存 → 应该更新而非创建新记录
2. 修改模块ID后保存 → 应该更新而非创建新记录
3. 修改属性ID后保存 → 应该正确更新
4. 刷新页面后检查 → 数据应该正确保存

### 预期结果
- 修改ID后不会产生重复记录
- 后台数据正确反映ID变更
- 刷新页面后显示正确的修改结果

## 状态

- [x] 识别问题
- [x] 修复EntityListStore
- [x] 修复ModuleStore
- [x] 修复GraphStore
- [x] 检查其他Store
- [x] 修复删除操作数据同步问题
- [x] 修复新建实体属性更新问题
- [x] 修复属性排序和实体切换数据丢失问题
- [ ] 完整测试验证

## 影响

这个修复解决了数据完整性的核心问题，确保：
1. ID修改不会创建重复记录
2. 后台数据与前端状态一致
3. 用户修改能够正确持久化

## 删除操作数据同步修复

### 问题描述
用户发现删除操作后，虽然发送了API请求，但前端表格中没有移除对应元素，导致前端状态与后台不一致。

### 根本原因
- 真实后台删除操作可能只是标记`deprecated`，而不是真正删除
- 前端只是简单地从本地状态中移除元素，没有重新查询后台

### 修复方案
采用用户建议的方案：删除后重新查询后台数据来同步状态

**修复前：**
```javascript
// ❌ 只更新本地状态
await entityApi.delete(entityId);
set(state => ({
  entities: state.entities.filter(e => e.id !== entityId)
}));
```

**修复后：**
```javascript
// ✅ 重新查询后台数据同步状态
await entityApi.delete(entityId);
await get().loadEntities(); // 重新查询，确保状态一致
```

### 修复范围
- ✅ EntityListStore.removeEntity
- ✅ ModuleStore.deleteModule
- ✅ GraphStore.deleteGraph

### 优势
1. **兼容性强**：同时支持Mock模式（真删除）和真实后台（标记deprecated）
2. **数据一致性**：确保前端显示与后台状态完全一致
3. **简单可靠**：避免复杂的状态对比逻辑，直接同步最新数据

## 新建实体属性更新问题修复

### 问题描述
用户发现新建实体新增属性时无法更新属性的id/name，控制台能看到事件但数据没有真实更新。

### 根本原因
**数据流不一致**导致的问题：
1. **添加属性**：`handleAddAttribute` → `updateEntity` (EntityListStore)
2. **修改属性**：`handleAttributeFieldChange` → `updateAttributeProperty` (CurrentEntityStore)

当添加属性到EntityListStore后，CurrentEntityStore的数据没有同步，导致：
- 新属性只存在于EntityListStore中
- 修改操作在CurrentEntityStore中找不到对应属性
- 表格显示的是EntityListStore数据，但编辑操作作用于CurrentEntityStore

### 修复方案
**统一使用CurrentEntityStore作为数据源**：

**修复前：**
```javascript
// ❌ 数据流不一致
handleAddAttribute → updateEntity(EntityListStore)
handleAttributeFieldChange → updateAttributeProperty(CurrentEntityStore)
```

**修复后：**
```javascript
// ✅ 统一数据流
handleAddAttribute → addAttribute(CurrentEntityStore)
handleAttributeFieldChange → updateAttributeProperty(CurrentEntityStore)
```

### 具体修改
1. **修改handleAddAttribute**：使用CurrentEntityStore.addAttribute
2. **修改tableData构建**：使用getDisplayEntity获取最新编辑数据
3. **更新依赖项**：tableData依赖selectedEntityId和editingEntity

### 修复效果
- ✅ 新建实体可以正常添加和编辑属性
- ✅ 属性修改立即反映在界面上
- ✅ 数据流一致，避免状态不同步问题

## 属性排序和实体切换数据丢失问题修复

### 问题描述
用户发现两个严重问题：
1. **属性排序问题**：新增的属性没有排在顶部，与实体排序不一致
2. **数据丢失问题**：给B实体"添加属性"时，会导致A实体所有未保存的修改被撤销

### 根本原因

**问题1：属性排序**
- `addAttribute`使用`push`添加到末尾，而不是顶部
- `loadEntities`中属性没有排序逻辑

**问题2：数据丢失**
- `handleAddAttribute`强制调用`selectEntity(entity)`切换实体
- `selectEntity`直接覆盖编辑状态，没有保护未保存修改：
```javascript
state.isDirty = false;  // 直接重置，丢失所有未保存修改！
```

### 修复方案

**修复1：属性排序**
```javascript
// CurrentEntityStore.addAttribute: 使用unshift添加到顶部
state.editingEntity.attributes.unshift(newAttribute);

// EntityListStore.loadEntities: 属性排序逻辑
.sort((a, b) => {
  if (a._status === 'new' && b._status !== 'new') return -1;
  if (a._status !== 'new' && b._status === 'new') return 1;
  return a.id.localeCompare(b.id);
})
```

**修复2：避免强制切换实体**
```javascript
// 修复前：强制切换实体，导致数据丢失
if (selectedEntityId !== entityId) {
  selectEntity(entity);  // ❌ 丢失A实体的未保存修改
}

// 修复后：根据情况选择操作方式
if (selectedEntityId === entityId) {
  // 当前选中实体：使用CurrentEntityStore
  addAttribute(newAttribute);
} else {
  // 非选中实体：直接操作EntityListStore，避免切换
  updateEntity(entityId, updatedEntity);
}
```

### 修复效果
1. **属性排序正确**：新增属性始终在顶部，已保存属性按id排序
2. **数据安全**：添加属性不会导致其他实体的未保存修改丢失
3. **用户体验优化**：可以在编辑A实体时快速给B实体添加属性，不打断编辑流程
