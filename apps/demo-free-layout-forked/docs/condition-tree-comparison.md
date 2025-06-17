# 条件树解析效果对比

## 核心改进

我们将Vehicle.java中的多条件状态从"总线模式"转换为"条件树模式"。

## dozerAction实例对比

### 原始Java代码
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

### 原始模式（总线）
**生成节点：2个**
- `vehicle.dozer_action.condition` - 包含所有3个条件的复合节点
- `vehicle.dozer_action` - 动作节点

**问题：**
- 条件逻辑难以分解
- 调试时无法单独查看每个条件
- 可视化显示复杂

### 新模式（条件树）
**生成节点：4个**
- `vehicle.dozer_action.condition.0` - 命令包含delivery
- `vehicle.dozer_action.condition.1` - !动作=move
- `vehicle.dozer_action.condition.2` - 车辆类型=dozer
- `vehicle.dozer_action` - 动作节点

**连接关系：**
```
condition.0 → condition.1 → condition.2 → dozer_action
```

## 其他多条件节点示例

### dumperAction (3个条件)
- 命令包含delivery → !动作=move → 车辆类型=dumper → dumperAction

### helicopterAction (3个条件)
- 命令包含delivery → !动作=move → 车辆类型=helicopter → helicopterAction

### moveOnRoad (3个条件)
- 命令包含delivery → 动作=move → 车辆类型=[dozer,dumper] → moveOnRoad

## 统计对比

| 模式 | 总节点数 | 条件节点数 | 动作节点数 | 逻辑清晰度 |
|------|----------|------------|------------|------------|
| 原始总线 | ~46 | ~23 | ~23 | 低 |
| 条件树 | ~69 | ~46 | ~23 | 高 |

## 优势说明

1. **逻辑清晰**：每个条件独立显示，决策路径清楚
2. **调试便利**：可以单独查看每个条件的执行状态
3. **维护性好**：修改单个条件不影响其他条件
4. **可视化友好**：流程图中形成清晰的决策链

## 条件节点命名规则

### ID命名
- 格式：`{graph}.{state}.condition.{index}`
- 示例：`vehicle.dozer_action.condition.0`

### 显示名称
使用智能简化：
- `controlled/commands` → `命令`
- `controlled/action` → `动作`
- `vehicle/type` → `车辆类型`
- `negation=true` → 添加`!`前缀
- `compare=CONTAINS` → `包含`符号

## 实现细节

### ConditionTreeBuilder类
- 按顺序为每个条件创建独立节点
- 自动连接形成条件链
- 智能生成易读的节点名称

### Graph.java修改
- 使用ConditionTreeBuilder替代原有逻辑
- 保持向后兼容性
- 优化了代码结构

这个改进将Vehicle工作流的可读性和可维护性提升到了新的水平。
