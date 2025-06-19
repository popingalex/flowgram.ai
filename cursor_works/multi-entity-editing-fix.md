# 多实体编辑架构重构任务

## 问题描述

用户发现修改实体A的属性时，会导致实体B的未保存修改被撤销。这是一个严重的架构问题。

## 根本原因分析

**CurrentEntityStore只支持单一实体编辑**：
```javascript
interface CurrentEntityState {
  selectedEntityId: string | null;  // ❌ 只能选中一个实体
  originalEntity: Entity | null;    // ❌ 只有一个原始副本
  editingEntity: Entity | null;     // ❌ 只有一个编辑副本
  isDirty: boolean;                 // ❌ 只有一个dirty状态
}
```

### 数据丢失流程
1. 用户编辑实体A，修改保存在CurrentEntityStore中
2. 用户开始编辑实体B，调用`selectEntity(entityB)`
3. `selectEntity`覆盖了所有编辑状态：
   ```javascript
   state.originalEntity = cloneDeep(entityB);  // ❌ 覆盖实体A的原始数据
   state.editingEntity = cloneDeep(entityB);   // ❌ 覆盖实体A的编辑数据
   state.isDirty = false;                      // ❌ 重置dirty状态
   ```
4. 实体A的所有未保存修改丢失！

## 架构重构方案

### 方案选择：简化架构，直接在EntityListStore管理编辑状态

**原架构**：
```
EntityListStore (只读数据) → CurrentEntityStore (单一编辑副本) → UI
```

**新架构**：
```
EntityListStore (包含每个实体的编辑副本) → UI
```

### 新的数据结构

```javascript
interface EntityWithEditingState extends Entity {
  // 原有字段...
  _indexId: string;
  _status: ItemStatus;

  // 新增编辑状态字段
  _editing?: {
    originalEntity: Entity;     // 原始数据副本
    editingEntity: Entity;      // 编辑中的数据副本
    isDirty: boolean;          // 是否有未保存修改
    isSaving: boolean;         // 是否正在保存
    error: string | null;      // 错误信息
  };
}
```

### 重构步骤

1. **扩展Entity接口**：添加`_editing`字段
2. **修改EntityListStore**：
   - 添加`startEditing(entityId)`方法
   - 添加`updateEntityField(entityId, field, value)`方法
   - 添加`updateAttributeField(entityId, attrId, field, value)`方法
   - 添加`saveEntityChanges(entityId)`方法
   - 添加`resetEntityChanges(entityId)`方法
3. **更新UI组件**：
   - 移除对CurrentEntityStore的依赖
   - 使用EntityListStore的编辑方法
   - 显示每个实体的独立编辑状态
4. **逐步废弃CurrentEntityStore**

### 优势

1. **多实体编辑**：每个实体都有独立的编辑状态
2. **数据安全**：编辑实体A不会影响实体B的未保存修改
3. **架构简化**：减少Store间的数据同步复杂性
4. **状态可见**：每个实体的编辑状态在UI中清晰可见

### 实施计划

- [x] 1. 扩展Entity接口，添加_editing字段
- [x] 2. 扩展EntityListStore，添加编辑相关方法
- [x] 3. 创建新的编辑操作hooks
- [x] 4. 更新UI组件使用新的编辑API
- [ ] 5. 测试多实体同时编辑功能
- [ ] 6. 移除CurrentEntityStore依赖（可选）

## 已完成的工作

### 1. 数据结构扩展 ✅
- 添加了`EntityEditingState`接口
- 扩展了`Entity`接口，添加`_editing`字段
- 每个实体都可以有独立的编辑状态

### 2. EntityListStore扩展 ✅
新增方法：
- `startEditing(entityId)` - 开始编辑实体
- `stopEditing(entityId)` - 停止编辑实体
- `updateEntityField(entityId, field, value)` - 更新实体字段
- `updateAttributeField(entityId, attributeId, field, value)` - 更新属性字段
- `addAttributeToEntity(entityId)` - 添加属性
- `removeAttributeFromEntity(entityId, attributeId)` - 删除属性
- `saveEntityChanges(entityId)` - 保存实体修改
- `resetEntityChanges(entityId)` - 重置实体修改
- `getEditingEntity(entityId)` - 获取编辑中的实体

### 3. UI组件更新 ✅
- 更新了`entity-list-page.tsx`使用新的多实体编辑API
- 移除了对`CurrentEntityStore`的依赖
- 更新了字段变更处理逻辑
- 更新了保存/重置/添加/删除操作

### 4. 技术优化 ✅
- 实现了自定义的`deepClone`函数，避免引入lodash依赖
- 修复了所有TypeScript和ESLint错误
- 保持了向后兼容性

### 5. ID重复校验功能 ✅
- 扩展了`EntityEditingState`接口，添加`validationErrors`字段
- 在`updateEntityField`中添加实体ID重复校验
- 在`updateAttributeField`中添加属性ID重复校验
- 校验错误实时显示在Input组件的Tooltip中
- 更新了`canSaveEntity`函数，有校验错误时禁用保存按钮

#### 校验规则
- **实体ID校验**：不能为空，不能与其他实体ID重复
- **属性ID校验**：不能为空，在同一实体内不能重复

#### 错误显示
- Input组件边框变红，显示错误状态
- Tooltip显示具体错误信息
- 保存按钮在有错误时被禁用

## 风险评估

**风险**：大规模重构可能引入新的bug
**缓解**：分步实施，保持向后兼容，充分测试

**预期收益**：解决严重的数据丢失问题，提升用户体验

## 测试验证

### 问题重现步骤（修复前）
1. 打开实体列表页面
2. 修改实体A的某个属性（如名称）
3. 开始修改实体B的某个属性
4. 🚨 **问题**：实体A的未保存修改被撤销

### 预期修复效果（修复后）
1. 打开实体列表页面
2. 修改实体A的某个属性（如名称）
3. 开始修改实体B的某个属性
4. ✅ **期望**：实体A的修改仍然保留，两个实体可以同时编辑

### 验证要点
- [ ] 多个实体可以同时处于编辑状态
- [ ] 编辑实体A时，实体B的未保存修改不会丢失
- [ ] 每个实体的dirty状态独立显示
- [ ] 保存操作只影响对应的实体
- [ ] 重置操作只影响对应的实体
- [ ] 添加/删除属性不会影响其他实体的编辑状态
- [x] 实体ID重复校验：不能与其他实体ID重复
- [x] 属性ID重复校验：在同一实体内不能重复
- [x] 校验错误实时显示在Input组件上
- [x] 有校验错误时保存按钮被禁用

### 架构优势
1. **数据安全**：每个实体有独立的编辑副本，互不影响
2. **用户体验**：可以同时编辑多个实体，不会意外丢失数据
3. **代码简化**：减少了Store间的复杂数据同步
4. **状态透明**：每个实体的编辑状态在UI中清晰可见

## 后续优化建议

1. **性能优化**：考虑对编辑状态进行懒加载，只在需要时创建编辑副本
2. **持久化**：考虑将编辑状态保存到localStorage，防止页面刷新丢失
3. **冲突检测**：添加并发编辑冲突检测机制
4. **批量操作**：支持批量保存多个实体的修改
