<template>
  <div class="api-detail h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="toolbar bg-white border-b border-gray-200 p-4 flex-shrink-0">
      <div class="flex items-center space-x-4">
        <!-- HTTP方法选择 -->
        <el-select v-model="localApi.method" size="small" style="width: 100px">
          <el-option value="GET" label="GET" />
          <el-option value="POST" label="POST" />
          <el-option value="PUT" label="PUT" />
          <el-option value="DELETE" label="DELETE" />
          <el-option value="PATCH" label="PATCH" />
        </el-select>

        <!-- URL输入 -->
        <div class="flex-1 flex items-center space-x-2">
          <el-select
            v-model="localApi.protocol"
            size="small"
            style="width: 80px">
            <el-option value="https" label="HTTPS" />
            <el-option value="http" label="HTTP" />
          </el-select>
          <span class="text-gray-500">://</span>
          <el-input
            v-model="localApi.endpoint"
            placeholder="api.example.com"
            size="small"
            style="width: 200px" />
          <el-input
            v-model="localApi.url"
            placeholder="/api/users"
            size="small"
            class="flex-1" />
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center space-x-2">
          <el-button
            type="primary"
            size="small"
            :loading="loading"
            @click="handleTest">
            发送
          </el-button>
          <el-button size="small" @click="handleSave"> 保存 </el-button>
          <el-button size="small" :icon="Clock" @click="showHistory = true">
            历史
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Tab页 -->
      <el-tabs v-model="activeTab" class="flex-1 flex flex-col">
        <!-- 参数页 -->
        <el-tab-pane label="参数" name="params" class="flex-1 overflow-hidden">
          <div class="h-full flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium">请求参数</h3>
              <el-button size="small" :icon="Plus" @click="handleAddParameter">
                添加参数
              </el-button>
            </div>

            <div class="flex-1 overflow-auto">
              <el-table :data="localApi.parameters" size="small" class="w-full">
                <el-table-column width="50">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.enabled" />
                  </template>
                </el-table-column>

                <el-table-column label="范畴" width="100">
                  <template #default="{ row }">
                    <el-select v-model="row.scope" size="small">
                      <el-option value="query" label="Query" />
                      <el-option value="header" label="Header" />
                      <el-option value="path" label="Path" />
                      <el-option value="body" label="Body" />
                    </el-select>
                  </template>
                </el-table-column>

                <el-table-column label="参数名">
                  <template #default="{ row }">
                    <el-input
                      v-model="row.id"
                      size="small"
                      placeholder="参数名" />
                  </template>
                </el-table-column>

                <el-table-column label="参数值">
                  <template #default="{ row }">
                    <el-input
                      v-model="row.defaultValue"
                      size="small"
                      placeholder="参数值" />
                  </template>
                </el-table-column>

                <el-table-column label="描述">
                  <template #default="{ row }">
                    <el-input
                      v-model="row.description"
                      size="small"
                      placeholder="描述" />
                  </template>
                </el-table-column>

                <el-table-column width="80">
                  <template #default="{ $index }">
                    <el-button
                      size="small"
                      type="danger"
                      text
                      :icon="Delete"
                      @click="handleDeleteParameter($index)" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- Body页 -->
        <el-tab-pane label="Body" name="body" class="flex-1 overflow-hidden">
          <div class="h-full flex flex-col">
            <div class="mb-4">
              <h3 class="text-lg font-medium mb-2">请求体</h3>
              <el-radio-group v-model="bodyType" size="small">
                <el-radio-button value="none">None</el-radio-button>
                <el-radio-button value="json">JSON</el-radio-button>
                <el-radio-button value="form">Form Data</el-radio-button>
                <el-radio-button value="raw">Raw</el-radio-button>
              </el-radio-group>
            </div>

            <div class="flex-1 overflow-hidden">
              <el-input
                v-if="bodyType !== 'none'"
                v-model="bodyContent"
                type="textarea"
                :rows="20"
                placeholder="请输入请求体内容..."
                class="h-full" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 描述页 -->
        <el-tab-pane
          label="描述"
          name="description"
          class="flex-1 overflow-hidden">
          <div class="h-full flex flex-col">
            <h3 class="text-lg font-medium mb-4">API描述</h3>
            <el-input
              v-model="localApi.description"
              type="textarea"
              :rows="20"
              placeholder="请输入API描述..."
              class="flex-1" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 历史记录弹窗 -->
    <el-drawer v-model="showHistory" title="请求历史" size="50%">
      <div class="space-y-4">
        <div
          v-for="record in historyRecords"
          :key="record._indexId"
          class="border rounded p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium">{{ formatTime(record.timestamp) }}</span>
            <el-tag :type="record.result.success ? 'success' : 'danger'">
              {{ record.result.success ? "成功" : "失败" }}
            </el-tag>
          </div>
          <div class="text-sm text-gray-600">
            <p>状态: {{ record.result.status }}</p>
            <p>耗时: {{ record.result.duration }}ms</p>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Plus, Delete, Clock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { nanoid } from "nanoid";
import type { ApiItem, ApiParameter } from "../types/api";

// Props
interface Props {
  api: ApiItem;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: "save", api: ApiItem): void;
  (e: "test", api: ApiItem): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const localApi = ref<ApiItem>({ ...props.api });
const activeTab = ref("params");
const bodyType = ref("json");
const bodyContent = ref("");
const loading = ref(false);
const showHistory = ref(false);

// 模拟历史记录
const historyRecords = ref([
  {
    _indexId: nanoid(),
    apiId: props.api._indexId,
    timestamp: Date.now() - 3600000,
    parameters: {},
    result: {
      success: true,
      status: 200,
      duration: 245,
      timestamp: Date.now() - 3600000,
    },
  },
]);

// 方法
const handleAddParameter = () => {
  const newParam: ApiParameter = {
    _indexId: nanoid(),
    id: "",
    name: "新参数",
    type: "string",
    scope: "query",
    required: false,
    enabled: true,
    description: "",
  };

  localApi.value.parameters = localApi.value.parameters || [];
  localApi.value.parameters.push(newParam);
};

const handleDeleteParameter = (index: number) => {
  if (localApi.value.parameters) {
    localApi.value.parameters.splice(index, 1);
  }
};

const handleSave = () => {
  emit("save", localApi.value);
  ElMessage.success("保存成功");
};

const handleTest = async () => {
  loading.value = true;
  try {
    await emit("test", localApi.value);
    ElMessage.success("测试完成");
  } catch (error) {
    ElMessage.error("测试失败");
  } finally {
    loading.value = false;
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

// 监听props变化
watch(
  () => props.api,
  (newApi) => {
    localApi.value = { ...newApi };
  },
  { deep: true }
);
</script>

<style scoped>
.api-detail {
  background-color: #fff;
}

.toolbar {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  padding: 16px;
}

:deep(.el-table) {
  border: 1px solid var(--el-border-color);
}

:deep(.el-textarea__inner) {
  resize: none;
}
</style>
