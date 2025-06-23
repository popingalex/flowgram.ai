<template>
  <div class="api-tree">
    <!-- 搜索框 -->
    <div class="mb-4">
      <el-input
        v-model="localSearchText"
        placeholder="搜索 API..."
        :prefix-icon="Search"
        size="small"
        clearable />
    </div>

    <!-- 树形结构 -->
    <el-tree
      ref="treeRef"
      :data="filteredTreeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :highlight-current="true"
      node-key="_indexId"
      @node-click="handleNodeClick">
      <template #default="{ data }">
        <div class="tree-node flex items-center justify-between w-full">
          <!-- 左侧内容 -->
          <div class="flex items-center flex-1 min-w-0">
            <!-- 图标 -->
            <div class="flex-shrink-0 mr-2">
              <el-icon v-if="data.type === 'group'" class="text-blue-500">
                <Folder />
              </el-icon>
              <el-tag
                v-else
                :type="getMethodTagType(data.method)"
                size="small"
                class="method-tag">
                {{ data.method }}
              </el-tag>
            </div>

            <!-- 可编辑标题 -->
            <div class="flex-1 min-w-0">
              <el-input
                v-if="editingNodeId === data._indexId"
                v-model="editingName"
                size="small"
                @blur="handleNameBlur"
                @keyup.enter="handleNameBlur"
                @keyup.esc="cancelEdit"
                ref="editInputRef" />
              <span
                v-else
                class="node-title cursor-pointer truncate"
                @dblclick="startEdit(data)"
                :title="data.name">
                {{ data.name }}
              </span>
            </div>
          </div>

          <!-- 右侧操作按钮 -->
          <div
            class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <el-tooltip content="添加 API" v-if="data.type === 'group'">
              <el-button
                size="small"
                text
                :icon="Plus"
                @click.stop="handleAddApi(data._indexId)" />
            </el-tooltip>
            <el-tooltip content="添加分组" v-if="data.type === 'group'">
              <el-button
                size="small"
                text
                :icon="FolderAdd"
                @click.stop="handleAddGroup(data._indexId)" />
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button
                size="small"
                text
                type="danger"
                :icon="Delete"
                @click.stop="handleDelete(data)" />
            </el-tooltip>
          </div>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  Search,
  Folder,
  Plus,
  FolderAdd,
  Delete,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApiStore } from "../stores/api";
import type { ApiItem, HttpMethod } from "../types/api";

// Props
interface Props {
  searchText?: string;
  selectedApi?: ApiItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  searchText: "",
  selectedApi: null,
});

// Emits
interface Emits {
  (e: "select-api", api: ApiItem): void;
  (e: "add-api", parentId?: string): void;
  (e: "add-group", parentId?: string): void;
  (e: "delete-item", item: ApiItem): void;
}

const emit = defineEmits<Emits>();

// Store
const apiStore = useApiStore();

// 响应式数据
const treeRef = ref();
const editInputRef = ref();
const localSearchText = ref(props.searchText);
const editingNodeId = ref<string | null>(null);
const editingName = ref("");

// 树形配置
const treeProps = {
  children: "children",
  label: "name",
};

// 计算属性
const filteredTreeData = computed(() => {
  if (!localSearchText.value) {
    return apiStore.apiTree;
  }

  const filterTree = (nodes: ApiItem[]): ApiItem[] => {
    return nodes.reduce((filtered: ApiItem[], node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(localSearchText.value.toLowerCase()) ||
        node.id.toLowerCase().includes(localSearchText.value.toLowerCase());

      if (matchesSearch) {
        filtered.push({ ...node });
      } else if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children);
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren });
        }
      }

      return filtered;
    }, []);
  };

  return filterTree(apiStore.apiTree);
});

// 方法
const getMethodTagType = (method?: HttpMethod): "success" | "primary" | "warning" | "info" | "danger" | undefined => {
  const typeMap: Record<string, "success" | "primary" | "warning" | "info" | "danger" | undefined> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
    HEAD: undefined,
    OPTIONS: undefined,
  };
  return typeMap[method as keyof typeof typeMap];
};

const handleNodeClick = (data: ApiItem) => {
  if (data.type === "api") {
    emit("select-api", data);
  }
};

const startEdit = (data: ApiItem) => {
  editingNodeId.value = data._indexId;
  editingName.value = data.name;
  nextTick(() => {
    editInputRef.value?.focus();
  });
};

const handleNameBlur = () => {
  if (editingNodeId.value && editingName.value.trim()) {
    // TODO: 更新节点名称
    apiStore.updateApi(editingNodeId.value, { name: editingName.value.trim() });
  }
  cancelEdit();
};

const cancelEdit = () => {
  editingNodeId.value = null;
  editingName.value = "";
};

const handleAddApi = (parentId?: string) => {
  emit("add-api", parentId);
};

const handleAddGroup = (parentId?: string) => {
  emit("add-group", parentId);
};

const handleDelete = async (data: ApiItem) => {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${data.type === "group" ? "分组" : "API"} "${data.name}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    emit("delete-item", data);
    ElMessage.success("删除成功");
  } catch {
    // 用户取消删除
  }
};

// 监听搜索文本变化
watch(
  () => props.searchText,
  (newVal) => {
    localSearchText.value = newVal;
  }
);
</script>

<style scoped>
.api-tree {
  height: 100%;
}

.tree-node {
  padding: 4px 0;
}

.tree-node:hover {
  background-color: var(--el-fill-color-light);
}

.method-tag {
  min-width: 45px;
  text-align: center;
  font-size: 10px;
  font-weight: bold;
}

.node-title {
  font-size: 13px;
  line-height: 1.4;
}

:deep(.el-tree-node__content) {
  padding: 2px 8px;
  height: auto;
  min-height: 32px;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-light);
}

.group-hover\:opacity-100 {
  transition: opacity 0.2s;
}

.tree-node:hover .group-hover\:opacity-100 {
  opacity: 1 !important;
}
</style>
