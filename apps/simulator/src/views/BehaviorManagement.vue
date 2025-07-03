<template>
  <div class="behavior-management">
    <ManagementSidebar
      title="行为管理"
      :items="filteredBehaviors"
      :selected-id="selectedBehaviorId"
      v-model:search-text="searchText"
      search-placeholder="搜索行为..."
      create-button-text="新建行为"
      :loading="loading"
      :tabs="behaviorTabs"
      v-model:active-tab="activeTab"
      @select="selectBehavior"
      @create="createBehavior"
      @refresh="refreshBehaviors"
      @tab-change="handleTabClick"
    >
      <template #default="{ items, selectedId, onSelect }">
        <div v-for="behavior in items" :key="behavior._indexId">
          <ManagementListItem
            :item="behavior"
            :is-selected="selectedId === behavior._indexId"
            @select="onSelect"
          >
            <template #stats="{ item }">
              <el-tag :type="getBehaviorTagType(item.type)" size="small">
                {{ getBehaviorTypeLabel(item.type) }}
              </el-tag>
            </template>
          </ManagementListItem>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="items.length === 0"
          description="暂无行为数据"
          :image-size="100"
        />
      </template>
    </ManagementSidebar>

    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { behaviorApi } from '../services/api'
import { ManagementSidebar, ManagementListItem } from '../components/common'

const router = useRouter()
const route = useRoute()

const behaviors = ref<any[]>([])
const searchText = ref('')
const loading = ref(false)
const activeTab = ref('remote')

// 标签页配置
const behaviorTabs = [
  { name: 'remote', label: '远程行为' },
  { name: 'local', label: '本地行为' },
  { name: 'script', label: '脚本行为' }
]

const selectedBehaviorId = computed(() => {
  return route.params.id as string
})

const filteredBehaviors = computed(() => {
  if (!searchText.value) return behaviors.value

  const searchLower = searchText.value.toLowerCase()
  return behaviors.value.filter((behavior: any) => {
    const matchesBasic =
      behavior._indexId?.toLowerCase().includes(searchLower) ||
      behavior.name?.toLowerCase().includes(searchLower) ||
      behavior.description?.toLowerCase().includes(searchLower)

    return matchesBasic
  })
})

// 获取行为类型标签类型
const getBehaviorTagType = (type: string) => {
  switch (type) {
    case 'remote':
      return 'primary'
    case 'local':
      return 'success'
    case 'script':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取行为类型标签文本
const getBehaviorTypeLabel = (type: string) => {
  switch (type) {
    case 'remote':
      return '远程'
    case 'local':
      return '本地'
    case 'script':
      return '脚本'
    default:
      return '未知'
  }
}

// 获取行为列表
const fetchBehaviors = async () => {
  loading.value = true
  try {
    let response
    switch (activeTab.value) {
      case 'remote':
        response = await behaviorApi.getRemoteBehaviors()
        break
      case 'local':
        response = await behaviorApi.getLocalBehaviors()
        break
      case 'script':
        response = await behaviorApi.getScriptBehaviors()
        break
      default:
        response = { data: [] }
    }
    behaviors.value = response.data || []
  } catch (error) {
    console.error('获取行为列表失败:', error)
    behaviors.value = []
  } finally {
    loading.value = false
  }
}

// 处理标签页切换
const handleTabClick = (tab: any) => {
  activeTab.value = tab.props.name
  router.push(`/management/behaviors/${tab.props.name}`)
}

// 选择行为
const selectBehavior = (behavior: any) => {
  router.push(`/management/behaviors/${activeTab.value}/${behavior._indexId}`)
}

// 创建新行为
const createBehavior = () => {
  router.push(`/management/behaviors/${activeTab.value}/new`)
}

// 刷新行为列表
const refreshBehaviors = () => {
  fetchBehaviors()
}

// 默认选中逻辑：有行为时选第一个，没有行为时跳转新建
watch(
  () => [behaviors.value, route.params.id, loading.value],
  ([newBehaviors, newId, isLoading]) => {
    if (isLoading) return

    if (!newId) {
      if (Array.isArray(newBehaviors) && newBehaviors.length > 0) {
        const firstBehavior = newBehaviors[0] as any
        router.replace(`/management/behaviors/${activeTab.value}/${firstBehavior._indexId}`)
      } else {
        // 没有行为时跳转到新建页面
        createBehavior()
      }
    }
  },
  { immediate: true }
)

// 监听路由变化，同步标签页
watch(() => route.params.type, (newType) => {
  if (newType && ['remote', 'local', 'script'].includes(newType as string)) {
    activeTab.value = newType as string
    fetchBehaviors()
  }
}, { immediate: true })

onMounted(() => {
  // 根据路由设置初始标签页
  const routeType = route.params.type as string
  if (routeType && ['remote', 'local', 'script'].includes(routeType)) {
    activeTab.value = routeType
  }
  fetchBehaviors()
})
</script>

<style scoped>
.behavior-management {
  height: 100%;
  display: flex;
}

.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
