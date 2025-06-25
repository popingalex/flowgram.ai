# 实验性Store文件存档

## 文件清单

### 重复/实验性Store
- `current-graph.store.ts` - 重复的图编辑store，功能已合并到current-workflow.ts
- `entity-graph-mapping.store.ts` - 实体图映射store，业务已简化
- `entity-list-new.ts` - 实验性实体列表store
- `module-list-new.ts` - 实验性模块列表store
- `indexed-entity-store.ts` - 索引化实体store实验
- `base-indexed-store.ts` - 索引化store基类实验
- `universal-store-base.ts` - 通用store基类实验

### 基础工具
- `base/` - 基础store工具目录

## 清理原因

按照用户的架构要求，Store应该遵循"4种元素 × 2个store + 基类"的模式：

### 最终架构 (10个文件)
1. **实体**: `entity-list.ts` + `current-entity.ts`
2. **模块**: `module-list.tsx` + `current-module.ts`
3. **API**: `api-list.ts` + `current-api.ts`
4. **工作流**: `workflow-list.ts` + `current-workflow.ts`
5. **函数**: `function-list.ts` (只读)
6. **导出**: `index.ts`

### 移除的文件类型
- 重复功能的store
- 实验性实现
- 过度复杂的基类
- 不再需要的映射store

## 恢复说明

如果需要恢复任何文件，请：
1. 检查文件功能是否在新架构中有替代
2. 更新import路径以匹配新的命名规范
3. 确保符合统一的store模式
