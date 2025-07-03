<template>
  <div class="test-view">
    <h1>测试页面</h1>

    <el-card>
      <template #header>
        <span>数据加载测试</span>
      </template>

      <div>
        <p>实体数量: {{ entities.length }}</p>
        <p>模块数量: {{ modules.length }}</p>
        <p>系统数量: {{ systems.length }}</p>
        <p>加载状态: {{ loading ? '加载中...' : '已完成' }}</p>
      </div>

      <el-button @click="loadData" type="primary">重新加载数据</el-button>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>实体列表</span>
      </template>

      <el-table :data="entities" style="width: 100%">
        <el-table-column prop="_indexId" label="索引ID" width="200" />
        <el-table-column prop="id" label="实体ID" width="150" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="description" label="描述" />
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>路由测试</span>
      </template>

      <div>
        <p>当前路由: {{ route.path }}</p>
        <p>路由参数: {{ JSON.stringify(route.params) }}</p>
        <p>路由查询: {{ JSON.stringify(route.query) }}</p>
      </div>

      <div style="margin-top: 10px;">
        <el-button @click="goToManagement">跳转到管理页面</el-button>
        <el-button @click="goToEntities">跳转到实体管理</el-button>
        <el-button @click="goToFirstEntity" :disabled="entities.length === 0">跳转到第一个实体</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEntityStore } from '../stores/entityStore'
import { useModuleStore } from '../stores/moduleStore'
import { useSystemStore } from '../stores/systemStore'

const route = useRoute()
const router = useRouter()
const entityStore = useEntityStore()
const moduleStore = useModuleStore()
const systemStore = useSystemStore()

const loading = ref(false)

const entities = computed(() => entityStore.entities)
const modules = computed(() => moduleStore.modules)
const systems = computed(() => systemStore.systems)

const loadData = async () => {
  loading.value = true
  try {
    console.log('开始加载数据...')
    await Promise.all([
      entityStore.fetchEntities(),
      moduleStore.fetchModules(),
      systemStore.fetchSystems()
    ])
    console.log('数据加载完成')
    console.log('实体:', entities.value)
    console.log('模块:', modules.value)
    console.log('系统:', systems.value)
  } catch (error) {
    console.error('数据加载失败:', error)
  } finally {
    loading.value = false
  }
}

const goToManagement = () => {
  router.push('/management')
}

const goToEntities = () => {
  router.push('/management/entities')
}

const goToFirstEntity = () => {
  if (entities.value.length > 0) {
    const firstEntity = entities.value[0] as any
    router.push(`/management/entities/${firstEntity.id}`)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.test-view {
  padding: 20px;
}
</style>
