<template>
  <div class="relationship-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// Props
interface Props {
  nodes: Array<{
    id: string
    name: string
    type: 'entity' | 'module' | 'system'
    category: number
    symbolSize: number
    itemStyle: { color: string }
    data: any
  }>
  links: Array<{
    source: string
    target: string
    lineStyle: {
      type: 'solid' | 'dashed'
      width: number
      color: string
    }
  }>
  selectedNodeId?: string
  title?: string
  chartHeight?: number
  forceConfig?: {
    repulsion?: number
    gravity?: number
    edgeLength?: number
    layoutAnimation?: boolean
  }
  scaleLimit?: {
    min?: number
    max?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  title: '关系图',
  chartHeight: 600,
  forceConfig: () => ({
    repulsion: 1000,
    gravity: 0.1,
    edgeLength: 150,
    layoutAnimation: true
  }),
  scaleLimit: () => ({
    min: 0.4,
    max: 2
  })
})

// Emits
const emit = defineEmits<{
  nodeClick: [node: any]
  linkClick: [link: any]
  chartReady: [chart: echarts.ECharts]
}>()

// 状态
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 图表配置
const getChartOption = () => ({
  title: {
    text: props.title,
    left: 'center',
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'var(--el-text-color-primary)'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.dataType === 'node') {
        const typeMap = {
          entity: '实体',
          module: '模块',
          system: '系统'
        }
        return `${typeMap[params.data.type as keyof typeof typeMap]}: ${params.data.name}`
      } else {
                // 连线的tooltip
        const sourceType = params.data.source.startsWith('entity-') ? '实体' : '系统'
        const targetType = '模块'
        const relationText = params.data.source.startsWith('entity-') ? '包含' : '使用'
        return `${sourceType} ${relationText} ${targetType}`
      }
    },
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'transparent',
    textStyle: {
      color: '#fff'
    }
  },
  legend: {
    data: ['实体', '模块', '系统'],
    bottom: 10,
    textStyle: {
      color: 'var(--el-text-color-regular)'
    }
  },
  graphic: [
    {
      type: 'text',
      left: 20,
      top: 20,
      style: {
        text: '提示：鼠标悬停连线查看关系类型',
        fontSize: 12,
        fill: 'var(--el-text-color-regular)'
      }
    }
  ],
  series: [
    {
      type: 'graph',
      layout: 'force',
      data: props.nodes.map(node => ({
        ...node,
        // 选中状态样式
        itemStyle: props.selectedNodeId === node.id ? {
          ...node.itemStyle,
          borderWidth: 3,
          borderColor: '#fff',
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        } : node.itemStyle
      })),
      links: props.links,
      categories: [
        { name: '实体', itemStyle: { color: '#409EFF' } },
        { name: '模块', itemStyle: { color: '#67C23A' } },
        { name: '系统', itemStyle: { color: '#E6A23C' } }
      ],
      roam: true,
      focusNodeAdjacency: true,
      label: {
        show: true,
        position: 'right',
        formatter: (params: any) => {
          // 上下排列：ID在上，name在下
          const nodeId = params.data.id || params.name
          const nodeName = params.data.name || params.name
          return `${nodeId}\n${nodeName}`
        },
        fontSize: 12,
        color: 'var(--el-text-color-primary)',
        lineHeight: 16
      },
      labelLayout: {
        hideOverlap: true
      },
      scaleLimit: props.scaleLimit,
      force: props.forceConfig,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }
  ]
})

// 方法
const initChart = () => {
  if (!chartRef.value) return

    chart = echarts.init(chartRef.value, undefined, {
    renderer: 'canvas',
    useDirtyRect: false
  })

  updateChart()

  // 绑定事件
  chart.on('click', (params) => {
    if (params.dataType === 'node') {
      console.log('节点点击事件:', params.data)
      emit('nodeClick', params.data)
    } else if (params.dataType === 'edge') {
      emit('linkClick', params.data)
    }
  })

  // 通知父组件图表已准备就绪
  emit('chartReady', chart)
}

const updateChart = () => {
  if (!chart) return

  const option = getChartOption()
  chart.setOption(option, true)
}

const resizeChart = () => {
  chart?.resize()
}

const resetLayout = () => {
  updateChart()
}

const exportImage = (filename = 'relationship-chart.png') => {
  if (!chart) return null

  const url = chart.getDataURL({
    type: 'png',
    backgroundColor: '#fff',
    pixelRatio: 2
  })

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  return url
}

const dispose = () => {
  if (chart) {
    chart.dispose()
    chart = null
  }
}

const focusNode = (nodeId: string) => {
  if (!chart) return

  // 找到对应的节点
  const node = props.nodes.find(n => n.id === nodeId)
  if (!node) {
    console.log('未找到节点:', nodeId, '可用节点:', props.nodes.map(n => n.id))
    return
  }

  console.log('聚焦节点:', nodeId, node)

  // 使用 ECharts 的 dispatchAction 来聚焦节点
  chart.dispatchAction({
    type: 'focusNodeAdjacency',
    seriesIndex: 0,
    dataIndex: props.nodes.findIndex(n => n.id === nodeId)
  })

  // 更新图表以应用选中状态
  updateChart()
}

// 暴露方法给父组件
defineExpose({
  resetLayout,
  exportImage,
  resizeChart,
  dispose,
  focusNode,
  getChart: () => chart
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', resizeChart)

  // 使用ResizeObserver监听容器大小变化
  if (chartRef.value && window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      resizeChart()
    })
    resizeObserver.observe(chartRef.value)

    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  dispose()
})

// 监听数据变化
watch(() => [props.nodes, props.links], () => {
  updateChart()
}, { deep: true })

watch(() => props.chartHeight, () => {
  nextTick(() => {
    resizeChart()
  })
})

// 监听选中节点变化
watch(() => props.selectedNodeId, (newNodeId) => {
  console.log('选中节点ID变化:', newNodeId)
  if (newNodeId) {
    nextTick(() => {
      focusNode(newNodeId)
    })
  }
}, { immediate: true })
</script>

<style scoped>
.relationship-chart {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 8px;
  box-shadow: inset 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .relationship-chart {
    background: transparent;
    box-shadow: inset 0 2px 8px 0 rgba(0, 0, 0, 0.15);
  }
}
</style>
