# 条件树解析演示

## 背景

原始的Vehicle工作流解析将多个条件合并到一个节点中，形成"总线模式"。
新的条件树解析将多个条件按层次结构展开，形成"逻辑树模式"。

## dozerAction示例

### 原始代码
```java
@State(order = 3, value = {
    @Condition(segments = "controlled/commands", value = "{'command': 'delivery'}", partial = true, compare = CONTAINS),
    @Condition(segments = "controlled/action", value = "move", negation = true),
    @Condition(segments = "vehicle/type", value = "dozer"),
})
public static void dozerAction(Context context, InstanceIO instance) {
    // 推土机动作逻辑
}
```

### 总线模式（原始）
```
[所有条件合并的单一节点] → [dozerAction]
```

### 逻辑树模式（新设计）
```
[命令包含delivery] → [!动作=move] → [车辆类型=dozer] → [dozerAction]
```

## 条件树节点结构

### 条件节点命名
- 第一个条件：`vehicle.dozer_action.condition.0`
- 第二个条件：`vehicle.dozer_action.condition.1`
- 第三个条件：`vehicle.dozer_action.condition.2`
- 最终动作：`vehicle.dozer_action`

### 条件节点显示名称
- `命令包含{'command': 'delivery'}`
- `!动作=move`
- `车辆类型=dozer`

## 优势

1. **逻辑清晰**：每个条件独立显示，易于理解决策路径
2. **调试便利**：可以单独查看每个条件的执行状态
3. **维护性好**：修改单个条件不影响其他条件
4. **可视化友好**：在流程图中形成清晰的决策链

## 实现

### ConditionTreeBuilder类
负责将StateVO中的多个条件按顺序构建成条件链：

1. 遍历所有条件
2. 为每个条件创建独立的条件节点
3. 按顺序连接条件节点
4. 最后连接到动作节点

### Graph.java修改
- 使用ConditionTreeBuilder替代原有的条件处理逻辑
- 简化processStatesAsConditionNodes方法
- 保持与现有逻辑的兼容性

## 示例输出

dozerAction的条件树将产生4个节点：
- `vehicle.dozer_action.condition.0` (命令包含delivery)
- `vehicle.dozer_action.condition.1` (!动作=move)
- `vehicle.dozer_action.condition.2` (车辆类型=dozer)
- `vehicle.dozer_action` (推土机动作)

以及3条边：
- condition.0 → condition.1
- condition.1 → condition.2
- condition.2 → dozer_action
