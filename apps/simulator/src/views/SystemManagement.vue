<template>
  <div class="system-management">
    <ManagementSidebar
      title="系统管理"
      :items="filteredSystems"
      :selected-id="selectedSystemId"
      v-model:search-text="searchText"
      search-placeholder="搜索系统..."
      create-button-text="新建系统"
      :loading="loading"
      @select="selectSystem"
      @create="createSystem"
      @refresh="refreshSystems"
    >
      <template #default="{ items, selectedId, onSelect }">
        <div v-for="system in items" :key="system._indexId">
          <ManagementListItem
            :item="system"
            :is-selected="selectedId === system._indexId"
            @select="onSelect"
          >
            <template #stats="{ item }">
              <el-tag
                v-if="item.moduleIds && item.moduleIds.length > 0"
                type="success"
                size="small"
              >
                模: {{ item.moduleIds.length }}
              </el-tag>
              <el-tag
                v-if="item.behaviors && item.behaviors.length > 0"
                type="warning"
                size="small"
              >
                行: {{ item.behaviors.length }}
              </el-tag>
            </template>
          </ManagementListItem>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="items.length === 0"
          description="暂无系统数据"
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
import { systemApi } from '../services/api'
import { ManagementSidebar, ManagementListItem } from '../components/common'

const router = useRouter()
const route = useRoute()

const systems = ref<any[]>([])
const searchText = ref('')
const loading = ref(false)

const selectedSystemId = computed(() => {
  return route.params.id as string
})

const filteredSystems = computed(() => {
  if (!searchText.value) return systems.value

  const searchLower = searchText.value.toLowerCase()
  return systems.value.filter((system: any) => {
    const matchesBasic =
      system._indexId?.toLowerCase().includes(searchLower) ||
      system.name?.toLowerCase().includes(searchLower) ||
      system.description?.toLowerCase().includes(searchLower)

    return matchesBasic
  })
})

// 获取系统列表
const fetchSystems = async () => {
  loading.value = true
  try {
    const response = await systemApi.getAll()
    systems.value = response.data || []
  } catch (error) {
    console.error('获取系统列表失败:', error)
    systems.value = []
  } finally {
    loading.value = false
  }
}

// 选择系统
const selectSystem = (system: any) => {
  router.push(`/management/systems/${system._indexId}`)
}

// 创建新系统
const createSystem = () => {
  router.push('/management/systems/new')
}

// 刷新系统列表
const refreshSystems = () => {
  fetchSystems()
}

// 默认选中逻辑：有系统时选第一个，没有系统时跳转新建
watch(
  () => [systems.value, route.params.id, loading.value],
  ([newSystems, newId, isLoading]) => {
    if (isLoading) return

    if (!newId) {
      if (Array.isArray(newSystems) && newSystems.length > 0) {
        const firstSystem = newSystems[0] as any
        router.replace(`/management/systems/${firstSystem._indexId}`)
      } else {
        // 没有系统时跳转到新建页面
        createSystem()
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchSystems()
})
</script>

<style scoped>
.system-management {
  height: 100%;
  display: flex;
}

.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
