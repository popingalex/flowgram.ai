<template>
  <div class="h-screen flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-gray-800">API Platform</h1>
          <div class="flex items-center space-x-2">
            <el-button
              size="small"
              type="primary"
              :icon="Plus"
              @click="handleAddApi">
              添加 API
            </el-button>
            <el-button size="small" :icon="FolderAdd" @click="handleAddGroup">
              添加分组
            </el-button>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <el-input
            v-model="searchText"
            placeholder="搜索 API..."
            :prefix-icon="Search"
            size="small"
            style="width: 300px"
            clearable />
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1 flex overflow-hidden">
      <!-- 左侧API树 -->
      <aside class="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div class="flex-1 overflow-auto p-4">
          <ApiTree
            :search-text="searchText"
            :selected-api="selectedApi"
            @select-api="handleSelectApi"
            @add-api="handleAddApi"
            @add-group="handleAddGroup"
            @delete-item="handleDeleteItem" />
        </div>
      </aside>

      <!-- 右侧详情区域 -->
      <section class="flex-1 flex flex-col overflow-hidden">
        <ApiDetail
          v-if="selectedApi"
          :api="selectedApi"
          @save="handleSaveApi"
          @test="handleTestApi" />
        <div
          v-else
          class="flex-1 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <el-icon :size="64" class="mb-4">
              <Document />
            </el-icon>
            <p class="text-lg">选择一个 API 开始编辑</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Plus, FolderAdd, Search, Document } from "@element-plus/icons-vue";
import ApiTree from "../components/ApiTree.vue";
import ApiDetail from "../components/ApiDetail.vue";
import { useApiStore } from "../stores/api";
import type { ApiItem } from "../types/api";

// 使用store
const apiStore = useApiStore();

// 响应式数据
const searchText = ref("");
const selectedApi = ref<ApiItem | null>(null);

// 事件处理函数
const handleSelectApi = (api: ApiItem) => {
  selectedApi.value = api;
};

const handleAddApi = () => {
  apiStore.addApi();
};

const handleAddGroup = () => {
  apiStore.addGroup();
};

const handleDeleteItem = (item: ApiItem) => {
  apiStore.deleteItem(item._indexId);
};

const handleSaveApi = (api: ApiItem) => {
  apiStore.saveApi(api);
};

const handleTestApi = (api: ApiItem) => {
  apiStore.testApi(api);
};
</script>
