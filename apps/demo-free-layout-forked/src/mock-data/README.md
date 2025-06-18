# 统一数据管理 - 唯一数据源

## 🎯 数据整合完成

**✅ 已整合完成**：所有数据现在统一存放在此目录中，`/datas` 目录已删除。

## 📁 数据文件 (唯一数据源)

### 1. behaviors.json (70个函数)
**Expression格式** - 直接从后端API获取
```json
{
  "id": "vehicle.before",
  "name": "before",
  "desc": "函数: before",
  "output": {
    "id": "return",
    "type": "u",
    "desc": "void"
  },
  "inputs": [
    {
      "id": "context",
      "type": "u",
      "desc": "Context"
    }
  ]
}
```

### 2. graphs.json (20个图)
实体行为树图结构，使用条件树模式

### 3. workflow-example.json
工作流转换示例，展示从后端图到前端工作流的转换结果

### 4. entities.json
实体定义数据

### 5. modules.json
模块定义数据

### 6. enums.json
枚举类型定义数据

## 🔄 数据同步

### 一键更新脚本
```bash
./update-mock-data.sh
```

### API数据源
- **Behaviors**: `http://localhost:9999/hub/behaviors/`
- **Graphs**: `http://localhost:9999/hub/graphs/`

## 📊 使用方式

```typescript
import {
  REAL_BEHAVIORS,
  REAL_GRAPHS,
  WORKFLOW_EXAMPLE,
  findBehavior,
  findGraph,
  getDataStats
} from './mock-data';

// 查找函数
const vehicleBefore = findBehavior('vehicle.before');

// 获取图数据
const vehicleGraph = findGraph('vehicle');

// 数据统计
console.log(getDataStats());
```

## ✨ 整合优势

1. **单一数据源**：所有数据集中管理，避免重复
2. **自动同步**：脚本化更新，保持与后端一致
3. **类型安全**：TypeScript支持，便于开发
4. **便捷查询**：提供查找函数，简化使用

## 🎉 数据统计

- **Functions**: 70个 (Expression格式)
- **Graphs**: 20个实体图
- **Workflow Example**: 1个转换示例
- **数据目录**: 1个 (已整合)

**不再有多个数据目录的混乱！**
