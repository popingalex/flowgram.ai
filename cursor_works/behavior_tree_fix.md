# 行为树生成逻辑修复

## 🎯 问题总结

1. **前端变量选择器不加载** - 修改了前端文件导致
2. **单行为阶段创建不必要的phase节点** - 浪费资源和结构复杂
3. **错误的连接逻辑** - 阶段2直接连接到阶段3行为，跳过了阶段3
4. **End节点连接错误** - 连接到最后阶段节点而不是行为节点

## ✅ 解决方案

### 1. 前端修复
```bash
git checkout -- src/components/workflow-editor/workflow-editor.tsx src/stores/current-entity.store.ts
```

### 2. Java后端核心修改

#### A. 智能阶段节点创建
- **修改前**: 每个order都创建phase节点
- **修改后**: 只有多个行为的阶段才创建phase节点

```java
// 只为多行为的阶段创建阶段节点
if (actionNodeIds.size() > 1) {
    // 创建阶段节点并连接
} else {
    // 单行为直接使用行为节点
}
```

#### B. 正确的阶段间连接
- **修改前**: 阶段2 → 阶段3行为 (错误)
- **修改后**: 阶段2 → 阶段3 → 阶段3行为 (正确)

```java
// 确定下一阶段的入口节点
String nextEntryNodeId;
if (nextPhaseNodeId != null) {
    // 下一阶段有多个行为，连接到阶段节点
    nextEntryNodeId = nextPhaseNodeId;
} else {
    // 下一阶段只有一个行为，直接连接到行为节点
    nextEntryNodeId = stateIdToRepresentativeNodeIdMap.get(nextStateId);
}
```

#### C. 修正Start节点连接
- 如果第一阶段有多个行为 → 连接到phase节点
- 如果第一阶段只有一个行为 → 直接连接到行为节点

#### D. 修正End节点连接
- **修改前**: 连接到最后阶段节点
- **修改后**: 连接到最后阶段的所有行为节点

```java
// 找到最后阶段的所有行为节点并连接到$end
for (StateVO svo : lastOrderStates) {
    String actionNodeId = graphName + "." + svo.getId();
    graph.getEdges().add(new Edge(
        new Edge.Port(actionNodeId, "$out"),
        new Edge.Port(endNodeId, "$in")
    ));
}
```

## 🔄 修改的文件

1. `Graph.java` - 主要修改
   - `processStatesAsGroupedNodes()` - 重写阶段创建和连接逻辑
   - `addStartEndNodes()` - 修正Start和End节点连接

## 🎯 预期结果

1. **结构优化**: 单行为阶段不再创建不必要的phase节点
2. **连接正确**: 阶段A → 阶段B → 阶段B行为
3. **Start/End正确**: 智能连接到合适的入口/出口
4. **前端恢复**: 变量选择器正常工作

## 📊 测试验证

需要验证：
1. Vehicle行为树生成正确
2. 不同类型载具的条件-行为执行正确
3. 前端变量选择器正常加载
4. 整体工作流执行逻辑正确

状态: **已完成修改，等待测试验证**
