<template>
  <div class="module-management">
    <ManagementSidebar
      title="模块管理"
      :items="filteredModules"
      :selected-id="selectedModuleId"
      v-model:search-text="searchText"
      search-placeholder="搜索模块..."
      create-button-text="新建模块"
      :loading="loading"
      @select="selectModule"
      @create="createModule"
      @refresh="refreshModules"
    >
      <template #default="{ items, selectedId, onSelect }">
        <div class="module-list">
          <UniversalTable
            :data="treeData"
            :columns="moduleColumns"
            :max-rows="10"
            :height="400"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :default-expand-all="false"
            add-button-text="添加模块"
            @add="createModule"
            @edit="editModule"
            @delete="deleteModule"
            @row-click="handleRowClick"
          >
            <template #name="scope: any">
              <div class="module-name">
                <el-icon v-if="scope.row.type === 'module'" class="module-icon">
                  <Folder />
                </el-icon>
                <el-icon v-else-if="scope.row.type === 'attribute'" class="attribute-icon">
                  <Document />
                </el-icon>
                <el-icon v-else-if="scope.row.type === 'behavior'" class="behavior-icon">
                  <Setting />
                </el-icon>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>

            <template #type="scope: any">
              <el-tag
                v-if="scope.row.type === 'module'"
                type="primary"
                size="small"
              >
                模块
              </el-tag>
              <el-tag
                v-else-if="scope.row.type === 'attribute'"
                type="success"
                size="small"
              >
                属性
              </el-tag>
              <el-tag
                v-else-if="scope.row.type === 'behavior'"
                type="warning"
                size="small"
              >
                行为
              </el-tag>
            </template>

            <template #value="scope: any">
              <span v-if="scope.row.type === 'attribute'">
                {{ formatAttributeValue(scope.row.value) }}
              </span>
              <span v-else-if="scope.row.type === 'behavior'">
                {{ scope.row.behaviorType }}
              </span>
              <span v-else>-</span>
            </template>
          </UniversalTable>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="items.length === 0"
          description="暂无模块数据"
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
import { ElMessageBox } from 'element-plus'
import { Folder, Document, Setting } from '@element-plus/icons-vue'
import { useModuleStore } from '../stores/moduleStore'
import { ManagementSidebar, UniversalTable, type TableColumn } from '../components/common'

const router = useRouter()
const route = useRoute()
const moduleStore = useModuleStore()

const modules = computed(() => moduleStore.modules)
const searchText = ref('')
const loading = computed(() => moduleStore.loading)
const isDirty = computed(() => false) // 暂时设为false

const selectedModuleId = computed(() => {
  return route.params.id as string
})

// 过滤后的模块列表
const filteredModules = computed(() => {
  if (!searchText.value) return modules.value

  const searchLower = searchText.value.toLowerCase()
  return modules.value.filter((module: any) => {
    const searchLower = searchText.value.toLowerCase()
    return (
      module._indexId?.toLowerCase().includes(searchLower) ||
      module.name?.toLowerCase().includes(searchLower) ||
      module.description?.toLowerCase().includes(searchLower)
    )
  })
})

// 表格列定义
const moduleColumns: TableColumn[] = [
  {
    prop: 'name',
    label: '名称',
    minWidth: 200,
    slot: 'name'
  },
  {
    prop: 'type',
    label: '类型',
    width: 100,
    slot: 'type'
  },
  {
    prop: 'value',
    label: '值/类型',
    width: 150,
    slot: 'value'
  },
  {
    prop: 'description',
    label: '描述',
    minWidth: 250
  }
]

// 转换为树形数据
const treeData = computed(() => {
  return filteredModules.value.map((module: any) => {
    const children: any[] = []

    // 添加属性子节点
    if (module.attributes?.length > 0) {
      children.push({
        _indexId: `${module._indexId}_attrs_header`,
        name: '属性',
        type: 'header',
        description: `${module.attributes.length} 个属性`,
        children: module.attributes.map((attr: any) => ({
          _indexId: attr._indexId,
          name: attr.name,
          type: 'attribute',
          value: attr.value,
          description: attr.description,
          parentId: module._indexId
        }))
      })
    }

    // 添加行为子节点
    if (module.behaviors?.length > 0) {
      children.push({
        _indexId: `${module._indexId}_behaviors_header`,
        name: '行为',
        type: 'header',
        description: `${module.behaviors.length} 个行为`,
        children: module.behaviors.map((behavior: any) => ({
          _indexId: behavior._indexId,
          name: behavior.name,
          type: 'behavior',
          behaviorType: behavior.type,
          description: behavior.description,
          parentId: module._indexId
        }))
      })
    }

    return {
      _indexId: module._indexId,
      name: module.name,
      type: 'module',
      description: module.description,
      children: children.length > 0 ? children : undefined,
      hasChildren: children.length > 0
    }
  })
})

// 格式化属性值
const formatAttributeValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

// 选择模块
const selectModule = (module: any) => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      '当前有未保存的修改，是否继续？',
      '提示',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push(`/management/modules/${module._indexId}`)
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.push(`/management/modules/${module._indexId}`)
  }
}

// 创建新模块
const createModule = () => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      '当前有未保存的修改，是否继续？',
      '提示',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push('/management/modules/new')
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.push('/management/modules/new')
  }
}

// 刷新模块列表
const refreshModules = () => {
  moduleStore.fetchModules()
}

// 编辑模块
const editModule = (row: any) => {
  if (row.type === 'module') {
    router.push(`/management/modules/${row._indexId}`)
  }
}

// 删除模块
const deleteModule = (row: any) => {
  if (row.type === 'module') {
    ElMessageBox.confirm(
      `确定要删除模块 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    ).then(() => {
      // TODO: 实现删除逻辑
      console.log('删除模块:', row._indexId)
    }).catch(() => {
      // 用户取消
    })
  }
}

// 处理行点击
const handleRowClick = (row: any) => {
  if (row.type === 'module') {
    selectModule(row)
  }
}

// 默认选中逻辑：有模块时选第一个，没有模块时跳转新建
watch(
  () => [modules.value, route.params.id, loading.value],
  ([newModules, newId, isLoading]) => {
    if (isLoading) return

    if (!newId) {
      if (Array.isArray(newModules) && newModules.length > 0) {
        const firstModule = newModules[0] as any
        router.replace(`/management/modules/${firstModule._indexId}`)
      } else {
        // 没有模块时跳转到新建页面
        createModule()
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  moduleStore.fetchModules()
})
</script>

<style scoped>
.module-management {
  height: 100%;
  display: flex;
}

.module-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.module-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-icon {
  color: var(--el-color-primary);
}

.attribute-icon {
  color: var(--el-color-success);
}

.behavior-icon {
  color: var(--el-color-warning);
}

.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
