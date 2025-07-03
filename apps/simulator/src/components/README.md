# 组件说明

## RelationshipChart 关系图表组件

### 概述
`RelationshipChart` 是一个基于 ECharts 的关系图表组件，专门用于展示实体、模块、系统之间的关系网络。

### 特性
- 🎨 **样式封装**：所有 ECharts 相关样式和配置封装在组件内部
- 🔧 **高度可配置**：支持自定义节点、连线、布局等配置
- 📱 **响应式设计**：自动适配容器大小变化
- 🎯 **事件支持**：支持节点点击、连线点击等交互事件
- 🌙 **主题适配**：支持深色模式自动切换
- 📤 **导出功能**：内置图片导出功能

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `Array` | `[]` | 节点数据数组 |
| `links` | `Array` | `[]` | 连线数据数组 |
| `title` | `string` | `'关系图'` | 图表标题 |
| `chartHeight` | `number` | `600` | 图表高度(px) |
| `forceConfig` | `object` | 见下方 | 力导向布局配置 |
| `scaleLimit` | `object` | `{min: 0.4, max: 2}` | 缩放限制 |

#### forceConfig 默认值
```typescript
{
  repulsion: 1000,    // 节点间斥力
  gravity: 0.1,       // 重力
  edgeLength: 150,    // 连线长度
  layoutAnimation: true // 布局动画
}
```

#### nodes 数据格式
```typescript
{
  id: string,                    // 节点唯一标识
  name: string,                  // 节点显示名称
  type: 'entity' | 'module' | 'system', // 节点类型
  category: number,              // 分类索引
  symbolSize: number,            // 节点大小
  itemStyle: { color: string },  // 节点样式
  data: any                      // 节点原始数据
}
```

#### links 数据格式
```typescript
{
  source: string,                // 源节点ID
  target: string,                // 目标节点ID
  lineStyle: {
    type: 'solid' | 'dashed',   // 线条类型
    width: number,              // 线条宽度
    color: string               // 线条颜色
  }
}
```

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `node-click` | `nodeData` | 节点被点击时触发 |
| `link-click` | `linkData` | 连线被点击时触发 |
| `chart-ready` | `chart` | 图表初始化完成时触发 |

### 暴露的方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `resetLayout` | - | `void` | 重置布局 |
| `exportImage` | `filename?` | `string \| null` | 导出图片 |
| `resizeChart` | - | `void` | 调整图表大小 |
| `dispose` | - | `void` | 销毁图表实例 |
| `getChart` | - | `ECharts \| null` | 获取图表实例 |

### 使用示例

```vue
<template>
  <RelationshipChart
    ref="chartRef"
    :nodes="graphNodes"
    :links="graphLinks"
    title="实体关系图"
    :chart-height="800"
    :force-config="{ repulsion: 1500 }"
    @node-click="handleNodeClick"
    @chart-ready="handleChartReady"
  />
</template>

<script setup>
import RelationshipChart from '@/components/RelationshipChart.vue'

const chartRef = ref()

const graphNodes = ref([
  {
    id: 'node1',
    name: '实体A',
    type: 'entity',
    category: 0,
    symbolSize: 50,
    itemStyle: { color: '#409EFF' },
    data: { /* 原始数据 */ }
  }
])

const graphLinks = ref([
  {
    source: 'node1',
    target: 'node2',
    lineStyle: {
      type: 'solid',
      width: 2,
      color: '#606266'
    }
  }
])

const handleNodeClick = (nodeData) => {
  console.log('节点被点击:', nodeData)
}

const handleChartReady = (chart) => {
  console.log('图表已准备就绪')
}

// 重置布局
const resetLayout = () => {
  chartRef.value?.resetLayout()
}

// 导出图片
const exportChart = () => {
  chartRef.value?.exportImage('my-chart.png')
}
</script>
```

### 样式定制

组件内部使用 CSS 变量适配主题：
- `--el-text-color-primary`：主要文字颜色
- `--el-text-color-regular`：常规文字颜色
- `--el-bg-color-page`：页面背景色

支持深色模式自动切换，无需额外配置。

### 性能优化

- 使用 Canvas 渲染器提升性能
- 支持脏矩形检测减少重绘
- 自动清理事件监听器防止内存泄漏
- 组件销毁时自动释放图表实例

### 注意事项

1. 确保传入的 `nodes` 和 `links` 数据格式正确
2. 节点 ID 必须唯一，连线的 source/target 必须对应存在的节点
3. 大量数据时建议适当调整 `forceConfig` 参数优化性能
4. 组件会自动处理窗口大小变化，无需手动调用 resize 