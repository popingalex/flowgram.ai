<template>
  <el-container class="relationship-management">
    <!-- 左侧树形列表和图表 -->
    <el-aside
      :width="activeTab === 'graph' ? 'max(800px, 50vw)' : '400px'"
      class="left-panel"
    >
      <!-- 搜索框和操作按钮 - 在tabs上方 -->
      <div class="search-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索实体、模块、系统..."
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <div class="action-buttons">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          />
          <el-button
            :icon="Refresh"
            @click="handleRefresh"
            :loading="loading"
          />
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="tabs-container">
        <el-tab-pane label="数据列表" name="list">
            <!-- 树形列表 -->
            <div class="tree-container">
              <el-tree
                ref="treeRef"
                :data="treeData"
                :props="treeProps"
                :filter-node-method="filterNode"
                :default-expand-all="false"
                :expand-on-click-node="true"
                node-key="id"
                highlight-current
                @node-click="handleNodeClick"
              >
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <el-icon v-if="data.type === 'root'" class="node-icon">
                      <Folder />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'entity'" class="node-icon entity-icon">
                      <Box />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'module'" class="node-icon module-icon">
                      <Document />
                    </el-icon>
                    <el-icon v-else-if="data.type === 'system'" class="node-icon system-icon">
                      <Setting />
                    </el-icon>
                    <div class="node-content">
                      <div class="node-id">{{ node.label }}</div>
                      <div class="node-name" v-if="data.name">{{ data.name }}</div>
                    </div>
                    <div class="node-stats" v-if="data.stats">
                      <el-tag
                        v-for="stat in data.stats"
                        :key="stat.label"
                        :type="stat.type"
                        size="small"
                      >
                        {{ stat.label }}: {{ stat.value }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-tree>
            </div>
          </el-tab-pane>

          <el-tab-pane label="关系图" name="graph">
            <!-- 关系图 -->
            <div class="graph-container">
              <RelationshipChart
                ref="chartRef"
                :nodes="chartNodes"
                :links="chartLinks"
                :selected-node-id="selectedNodeId"
                title="实体-模块-系统关系图"
                @node-click="handleChartNodeClick"
                @chart-ready="handleChartReady"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
    </el-aside>

    <!-- 右侧详情面板 -->
    <el-main class="right-panel">
      <router-view :selected-entity="selectedItem" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElTree } from 'element-plus'
import { Search, Plus, Refresh, Edit, Delete, Folder, Box, Document, Setting } from '@element-plus/icons-vue'
import RelationshipChart from '@/components/RelationshipChart.vue'
import { useEntityStore } from '@/stores/entityStore'
import { useModuleStore } from '@/stores/moduleStore'
import { useSystemStore } from '@/stores/systemStore'
import type { Entity, Module, System } from '@/types'

// Stores
const entityStore = useEntityStore()
const moduleStore = useModuleStore()
const systemStore = useSystemStore()

// Router
const route = useRoute()
const router = useRouter()

// Refs
const treeRef = ref<InstanceType<typeof ElTree>>()
const chartRef = ref()

// 状态
const searchText = ref('')
const activeTab = ref('list')
const selectedItem = ref<any>(null)
const loading = ref(false)

// 计算属性
const entities = computed(() => entityStore.entities)
const modules = computed(() => moduleStore.modules)
const systems = computed(() => systemStore.systems)

// 选中项类型
const selectedItemType = computed(() => {
  if (!selectedItem.value) return ''
  if (selectedItem.value.modules !== undefined) return 'entity'
  if (selectedItem.value.attributes !== undefined && selectedItem.value.behaviors !== undefined) return 'module'
  if (selectedItem.value.moduleIds !== undefined) return 'system'
  return ''
})

// 选中的节点ID（用于图表同步）
const selectedNodeId = computed(() => {
  if (!selectedItem.value) return ''

  const type = selectedItemType.value
  const id = selectedItem.value._indexId

  if (type === 'entity') {
    return `entity-${id}`
  } else if (type === 'module') {
    return `module-${id}`
  } else if (type === 'system') {
    return `system-${id}`
  }
  return ''
})

// 树形数据
const treeData = computed(() => {
  const data = [
    {
      id: 'entities-root',
      label: `实体 (${entities.value.length})`,
      type: 'root',
      children: entities.value.map(entity => ({
        id: `entity-${entity._indexId}`,
        label: entity._indexId || entity.id || '未命名',
        name: entity.name || '未命名',
        type: 'entity',
        data: entity,
        stats: [
          { label: '模', value: entity.modules?.length || 0, type: 'success' },
          // 实体不再支持属性，移除属性统计
        ].filter(stat => stat.value > 0)
      }))
    },
    {
      id: 'modules-root',
      label: `模块 (${modules.value.length})`,
      type: 'root',
      children: modules.value.map(module => ({
        id: `module-${module._indexId}`,
        label: module._indexId || module.id || '未命名',
        name: module.name || '未命名',
        type: 'module',
        data: module,
        stats: [
          { label: '属', value: module.attributes?.length || 0, type: 'primary' },
          { label: '行', value: module.behaviors?.length || 0, type: 'warning' }
        ].filter(stat => stat.value > 0)
      }))
    },
    {
      id: 'systems-root',
      label: `系统 (${systems.value.length})`,
      type: 'root',
      children: systems.value.map(system => ({
        id: `system-${system._indexId}`,
        label: system._indexId || '未命名',
        name: system.name || '未命名',
        type: 'system',
        data: system,
        stats: [
          { label: '模', value: system.moduleIds?.length || 0, type: 'success' },
          { label: '行', value: system.behaviors?.length || 0, type: 'warning' }
        ].filter(stat => stat.value > 0)
      }))
    }
  ]
  return data
})

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 图表数据
const chartNodes = computed(() => {
  const nodes: any[] = []

  // 实体节点
  entities.value.forEach(entity => {
    const nodeId = `entity-${entity._indexId}`
    nodes.push({
      id: nodeId,
      name: entity.name || entity._indexId,
      type: 'entity',
      category: 0,
      symbolSize: 30,
      itemStyle: { color: '#409EFF' },
      data: {
        ...entity,
        id: entity._indexId, // 确保id字段存在
        type: 'entity'
      }
    })
  })

  // 模块节点
  modules.value.forEach(module => {
    const nodeId = `module-${module._indexId}`
    nodes.push({
      id: nodeId,
      name: module.name || module._indexId,
      type: 'module',
      category: 1,
      symbolSize: 25,
      itemStyle: { color: '#67C23A' },
      data: {
        ...module,
        id: module._indexId, // 确保id字段存在
        type: 'module'
      }
    })
  })

  // 系统节点
  systems.value.forEach(system => {
    const nodeId = `system-${system._indexId}`
    nodes.push({
      id: nodeId,
      name: system.name || system._indexId,
      type: 'system',
      category: 2,
      symbolSize: 35,
      itemStyle: { color: '#E6A23C' },
      data: {
        ...system,
        id: system._indexId, // 确保id字段存在
        type: 'system'
      }
    })
  })

  return nodes
})

const chartLinks = computed(() => {
  const links: any[] = []

  console.log('构建关系图链接:', {
    entities: entities.value.length,
    modules: modules.value.length,
    systems: systems.value.length
  })

  // 调试：打印前几个系统的数据
  console.log('前3个系统数据:', systems.value.slice(0, 3).map(s => ({
    _indexId: s._indexId,
    name: s.name,
    moduleIds: s.moduleIds
  })))

  // 调试：打印前几个模块的数据
  console.log('前3个模块数据:', modules.value.slice(0, 3).map(m => ({
    _indexId: m._indexId,
    id: m.id,
    name: m.name
  })))

    // 实体-模块关系
  entities.value.forEach(entity => {
    // 检查实体的modules字段，现在是对象数组
    const entityModules = entity.modules || []
    entityModules.forEach((moduleRef: any) => {
      // moduleRef可能是字符串或对象
      const moduleId = typeof moduleRef === 'string' ? moduleRef : moduleRef.id

      // 尝试通过不同的ID匹配模块
      const module = modules.value.find(m =>
        m._indexId === moduleId ||
        m.id === moduleId ||
        m._indexId === `module_${moduleId}` ||
        m.id === `module_${moduleId}`
      )
      if (module) {
        links.push({
          source: `entity-${entity._indexId}`,
          target: `module-${module._indexId}`,
          lineStyle: { type: 'solid', width: 2, color: '#409EFF' }
        })

      } else {
        console.log('未找到模块:', moduleId, '在实体:', entity._indexId)
      }
    })
  })

    // 系统-模块关系
  systems.value.forEach(system => {
    const systemModules = system.moduleIds || []

    systemModules.forEach((moduleId: string) => {
      const module = modules.value.find(m =>
        m._indexId === moduleId ||
        m.id === moduleId ||
        m._indexId === `module_${moduleId}` ||
        m.id === `module_${moduleId}`
      )
      if (module) {
        links.push({
          source: `system-${system._indexId}`,
          target: `module-${module._indexId}`,
          lineStyle: { type: 'solid', width: 2, color: '#E6A23C' }
        })

      } else {
        console.log('未找到模块:', moduleId, '在系统:', system._indexId)
      }
    })
  })

  console.log('总共构建关系链接:', links.length)
  console.log('前5个关系链接:', links.slice(0, 5))
  return links
})

// 过滤节点
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

// 监听搜索文本变化
watch(searchText, (val) => {
  treeRef.value?.filter(val)
})

// 监听路由变化，更新选中状态
// 监听路由变化和数据变化，确保同步
watch([() => route.params, () => entities.value, () => modules.value, () => systems.value],
  ([newParams, entitiesData, modulesData, systemsData]) => {
    if (newParams.id && newParams.id !== '$new' &&
        entitiesData.length > 0 && modulesData.length > 0 && systemsData.length > 0) {
      const routePath = route.path
      let item = null
      let nodeId = ''

      if (routePath.includes('/entities/')) {
        item = entitiesData.find(e => e._indexId === newParams.id)
        nodeId = `entity-${newParams.id}`
      } else if (routePath.includes('/modules/')) {
        item = modulesData.find(m => m._indexId === newParams.id)
        nodeId = `module-${newParams.id}`
      } else if (routePath.includes('/systems/')) {
        item = systemsData.find(s => s._indexId === newParams.id)
        nodeId = `system-${newParams.id}`
      }

      if (item) {
        selectedItem.value = item
        nextTick(() => {
          treeRef.value?.setCurrentKey(nodeId)
          // 如果当前在关系图tab，同步图表选中状态
          if (activeTab.value === 'graph' && chartRef.value) {
            chartRef.value.focusNode(nodeId)
          }
        })
      }
    }
}, { immediate: true })

// 事件处理
const handleNodeClick = (data: any) => {
  if (data.type === 'root') return
  selectedItem.value = data.data

  // 直接使用节点的type，不依赖计算属性
  const type = data.type
  const id = data.data._indexId

  console.log('点击节点:', { type, id, data: data.data }) // 调试日志

  if (type === 'entity') {
    router.push(`/management/relationship/entities/${id}`)
  } else if (type === 'module') {
    router.push(`/management/relationship/modules/${id}`)
  } else if (type === 'system') {
    router.push(`/management/relationship/systems/${id}`)
  }
}

const handleChartNodeClick = (params: any) => {
  const nodeId = params.data.id
  const [type, id] = nodeId.split('-')

  console.log('图表节点点击:', { nodeId, type, id, data: params.data })

  // 直接使用节点数据中的完整数据
  const item = params.data.data
  if (item) {
    selectedItem.value = item

    // 同步更新树形选择
    nextTick(() => {
      treeRef.value?.setCurrentKey(nodeId)
    })

    // 导航到对应详情页，实现URL同步
    if (type === 'entity') {
      router.push(`/management/relationship/entities/${id}`)
    } else if (type === 'module') {
      router.push(`/management/relationship/modules/${id}`)
    } else if (type === 'system') {
      router.push(`/management/relationship/systems/${id}`)
    }
  }
}

const handleCreate = () => {
  // 根据当前选中的类型创建对应项目
  if (selectedItem.value) {
    const itemType = selectedItemType.value
    if (itemType === 'entity') {
      router.push('/management/entities/new')
    } else if (itemType === 'module') {
      router.push('/management/modules/new')
    } else if (itemType === 'system') {
      router.push('/management/systems/new')
    }
  } else {
    // 默认创建实体
    router.push('/management/entities/new')
  }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await Promise.all([
      entityStore.fetchEntities(),
      moduleStore.fetchModules(),
      systemStore.fetchSystems()
    ])
    console.log('数据刷新完成 - 系统数据:', systems.value.map(s => ({
      _indexId: s._indexId,
      name: s.name,
      moduleIds: s.moduleIds
    })))
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('数据刷新失败:', error)
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab: any) => {
  activeTab.value = tab.props.name
  if (activeTab.value === 'graph') {
    nextTick(() => {
      chartRef.value?.resizeChart()
    })
  }
}

const handleChartReady = () => {
  console.log('图表初始化完成')
}





// 初始化
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      entityStore.fetchEntities(),
      moduleStore.fetchModules(),
      systemStore.fetchSystems()
    ])

    // 等待数据加载完成后处理默认选中
    await nextTick()

    // 默认选中第一个实体
    if (entities.value.length > 0) {
      const firstEntity = entities.value[0]

      // 如果当前没有子路由或路由参数无效，导航到第一个实体
      if (!route.params.id || route.params.id === 'undefined' || route.path === '/management/relationship') {
        selectedItem.value = firstEntity

        await nextTick()
        const nodeId = `entity-${firstEntity._indexId}`
        treeRef.value?.setCurrentKey(nodeId)

        // 导航到实体详情页
        router.replace(`/management/relationship/entities/${firstEntity._indexId}`)
      }
    }
  } catch (error) {
    console.error('数据加载失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.relationship-management {
  height: 100%;
}

.left-panel {
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  transition: width 0.3s ease;
  overflow: hidden;
}

.search-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color);
}

.search-input {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 68px); /* 减去搜索栏高度 */
  padding: 0 16px; /* 左右添加内边距 */
  overflow: hidden;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.graph-container {
  flex: 1;
  height: 100%;
  min-height: 400px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.node-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.entity-icon {
  color: #409EFF;
}

.module-icon {
  color: #67C23A;
}

.system-icon {
  color: #E6A23C;
}

.node-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-id {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
  align-items: flex-end;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  overflow: hidden;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  flex-shrink: 0;
  order: -1; /* 确保header在顶部 */
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}


</style>
