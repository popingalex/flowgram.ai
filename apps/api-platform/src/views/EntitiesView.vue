<template>
  <div class="h-full flex">
    <!-- 左侧实体列表 -->
    <div class="w-1/3 border-r border-gray-200 flex flex-col">
      <!-- 搜索和添加区域 -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex gap-2 mb-3">
          <el-input
            v-model="searchText"
            placeholder="搜索实体..."
            clearable
            class="flex-1">
            <template #prefix>
              <el-icon><ElSearch /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleAddEntity">
            <el-icon><ElPlus /></el-icon>
            添加实体
          </el-button>
        </div>
      </div>

      <!-- 实体列表 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="p-4 text-center text-gray-500">
          加载中...
        </div>
        <div
          v-else-if="filteredEntities.length === 0"
          class="p-4 text-center text-gray-500">
          {{ searchText ? "未找到匹配的实体" : "暂无实体" }}
        </div>
        <div v-else>
          <div
            v-for="entity in filteredEntities"
            :key="entity._indexId"
            class="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            :class="{
              'bg-blue-50 border-blue-200':
                currentEntity?._indexId === entity._indexId,
            }"
            @click="selectEntity(entity._indexId)">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 truncate">
                    {{ entity.id || "未命名实体" }}
                  </span>
                  <el-tag
                    v-if="entity._status === 'new'"
                    type="success"
                    size="small"
                    >新增</el-tag
                  >
                  <el-tag
                    v-else-if="entity._status === 'modified'"
                    type="warning"
                    size="small"
                    >已修改</el-tag
                  >
                </div>
                <div class="text-sm text-gray-500 truncate mt-1">
                  {{ entity.name || "无描述" }}
                </div>
                <div class="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>属性: {{ entity.attributeCount }}</span>
                  <span>模块: {{ entity.moduleCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧详情区域 -->
    <div class="flex-1 flex flex-col">
      <div
        v-if="!currentEntity"
        class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <el-icon size="48" class="mb-4"><ElDocument /></el-icon>
          <p>请选择一个实体查看详情</p>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <!-- 详情头部 -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ currentEntity.id || "新实体" }}
            </h2>
            <div class="flex gap-2">
              <el-button
                v-if="
                  currentEntity._status === 'modified' ||
                  currentEntity._status === 'new'
                "
                @click="handleRevert"
                :disabled="loading">
                撤销修改
              </el-button>
              <el-button
                type="primary"
                @click="handleSave"
                :loading="loading"
                :disabled="!canSave">
                保存
              </el-button>
              <el-button
                type="danger"
                @click="handleDelete"
                :disabled="loading">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 详情内容 -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-md font-medium text-gray-900 mb-3">基本信息</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ID</label
                >
                <el-input
                  v-model="currentEntity.id"
                  placeholder="实体ID"
                  @input="updateEntityField('id', $event)" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >名称</label
                >
                <el-input
                  v-model="currentEntity.name"
                  placeholder="实体名称"
                  @input="updateEntityField('name', $event)" />
              </div>
            </div>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >描述</label
              >
              <el-input
                v-model="currentEntity.description"
                type="textarea"
                :rows="3"
                placeholder="实体描述"
                @input="updateEntityField('description', $event)" />
            </div>
          </div>

          <!-- 属性列表 -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-md font-medium text-gray-900">属性列表</h3>
              <el-button size="small" @click="handleAddAttribute">
                <el-icon><ElPlus /></el-icon>
                添加属性
              </el-button>
            </div>

            <el-table :data="currentEntity.attributes" stripe>
              <el-table-column prop="id" label="ID" width="150">
                <template #default="{ row }">
                  <el-input
                    v-model="row.id"
                    size="small"
                    @input="updateAttribute(row._indexId, 'id', $event)" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="名称" width="150">
                <template #default="{ row }">
                  <el-input
                    v-model="row.name"
                    size="small"
                    @input="updateAttribute(row._indexId, 'name', $event)" />
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <el-select
                    v-model="row.type"
                    size="small"
                    @change="updateAttribute(row._indexId, 'type', $event)">
                    <el-option label="字符串" value="string" />
                    <el-option label="数字" value="number" />
                    <el-option label="布尔" value="boolean" />
                    <el-option label="数组" value="array" />
                    <el-option label="对象" value="object" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述">
                <template #default="{ row }">
                  <el-input
                    v-model="row.description"
                    size="small"
                    @input="
                      updateAttribute(row._indexId, 'description', $event)
                    " />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleRemoveAttribute(row._indexId)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 模块绑定 -->
          <div>
            <h3 class="text-md font-medium text-gray-900 mb-3">模块绑定</h3>
            <div class="text-sm text-gray-500">
              已绑定 {{ currentEntity.bundles?.length || 0 }} 个模块
            </div>
            <!-- 这里可以后续添加模块绑定的具体实现 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search as ElSearch,
  Plus as ElPlus,
  Document as ElDocument,
} from "@element-plus/icons-vue";
import { useEntitiesStore } from "../stores/entities";
import type { Entity } from "../types/entities";

const entitiesStore = useEntitiesStore();

// 响应式引用
const searchText = ref("");

// 计算属性
const { entities, loading, currentEntity, entitiesWithStats } =
  storeToRefs(entitiesStore);

const filteredEntities = computed(() => {
  if (!searchText.value) return entitiesWithStats.value;

  const search = searchText.value.toLowerCase();
  return entitiesWithStats.value.filter(
    (entity: Entity & { attributeCount: number; moduleCount: number }) =>
      entity.id.toLowerCase().includes(search) ||
      entity.name?.toLowerCase().includes(search)
  );
});

const canSave = computed(() => {
  return (
    currentEntity.value?.id?.trim() &&
    (currentEntity.value._status === "modified" ||
      currentEntity.value._status === "new")
  );
});

// 方法
const {
  initializeData,
  selectEntity,
  addEntity,
  updateEntityField,
  addAttribute,
  updateAttribute,
  removeAttribute,
  saveEntity,
  revertEntity,
  deleteEntity,
} = entitiesStore;

const handleAddEntity = () => {
  addEntity();
};

const handleAddAttribute = () => {
  addAttribute();
};

const handleRemoveAttribute = async (attributeId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个属性吗？", "确认删除", {
      type: "warning",
    });
    removeAttribute(attributeId);
  } catch {
    // 用户取消删除
  }
};

const handleSave = async () => {
  try {
    await saveEntity();
    ElMessage.success("保存成功");
  } catch (error) {
    ElMessage.error("保存失败");
  }
};

const handleRevert = () => {
  revertEntity();
  ElMessage.info("已撤销修改");
};

const handleDelete = async () => {
  if (!currentEntity.value) return;

  try {
    await ElMessageBox.confirm("确定要删除这个实体吗？", "确认删除", {
      type: "warning",
    });
    await deleteEntity(currentEntity.value._indexId);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 初始化
onMounted(() => {
  initializeData();
});
</script>
