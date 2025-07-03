<template>
  <div class="universal-table">
    <el-table
      ref="tableRef"
      :data="displayData"
      :height="tableHeight"
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-expand-all="defaultExpandAll"
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        :selectable="selectable"
      />

      <!-- 索引列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="60"
        :index="indexMethod"
      />

      <!-- 动态列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :sortable="column.sortable"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
        :align="column.align || 'left'"
        :header-align="column.headerAlign || column.align || 'left'"
      >
        <template #default="scope" v-if="column.slot">
          <slot
            :name="column.slot"
            :row="scope.row"
            :column="scope.column"
            :$index="scope.$index"
          />
        </template>
                 <template #default="scope" v-else-if="column.formatter">
           {{ column.formatter?.(scope.row, scope.column, scope.row[column.prop], scope.$index) }}
         </template>
        <template #header="scope" v-if="column.headerSlot">
          <slot
            :name="column.headerSlot"
            :column="scope.column"
            :$index="scope.$index"
          />
        </template>
      </el-table-column>

      <!-- 按钮列 -->
      <el-table-column
        v-if="showActions"
        :label="actionsLabel"
        :width="actionsWidth"
        :min-width="actionsMinWidth"
        :fixed="actionsFixed"
        align="center"
        header-align="center"
      >
        <template #header>
          <div class="actions-header">
            <span>{{ actionsLabel }}</span>
            <el-button
              v-if="showAddButton"
              type="primary"
              :icon="Plus"
              size="small"
              @click="$emit('add')"
            >
              {{ addButtonText }}
            </el-button>
          </div>
        </template>
        <template #default="scope">
          <slot
            name="actions"
            :row="scope.row"
            :column="scope.column"
            :$index="scope.$index"
          >
            <div class="default-actions">
              <el-button
                type="primary"
                :icon="Edit"
                size="small"
                text
                @click="$emit('edit', scope.row, scope.$index)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                text
                @click="$emit('delete', scope.row, scope.$index)"
              />
            </div>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-if="showPagination && total > pageSize"
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :page-sizes="pageSizes"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  formatter?: (row: any, column: any, cellValue: any, index: number) => string
  slot?: string
  headerSlot?: string
}

interface Props {
  data: any[]
  columns: TableColumn[]
  height?: number | string
  maxRows?: number
  showSelection?: boolean
  showIndex?: boolean
  showActions?: boolean
  actionsLabel?: string
  actionsWidth?: number | string
  actionsMinWidth?: number | string
  actionsFixed?: boolean | 'left' | 'right'
  showAddButton?: boolean
  addButtonText?: string
  rowKey?: string
  treeProps?: { children?: string; hasChildren?: string }
  defaultExpandAll?: boolean
  showPagination?: boolean
  pageSize?: number
  pageSizes?: number[]
  selectable?: (row: any, index: number) => boolean
  indexMethod?: (index: number) => number
  defaultSelection?: any[] // 默认选中的行
}

const props = withDefaults(defineProps<Props>(), {
  height: 400,
  maxRows: 10,
  showSelection: false,
  showIndex: false,
  showActions: true,
  actionsLabel: '',
  actionsWidth: 120,
  actionsMinWidth: 120,
  actionsFixed: 'right',
  showAddButton: true,
  addButtonText: '添加',
  rowKey: '_indexId',
  defaultExpandAll: false,
  showPagination: false,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  defaultSelection: () => []
})

const emit = defineEmits<{
  add: []
  edit: [row: any, index: number]
  delete: [row: any, index: number]
  'selection-change': [selection: any[]]
  'row-click': [row: any, column: any, event: Event]
  'size-change': [size: number]
  'current-change': [current: number]
}>()

// 分页状态
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)

// 表格引用
const tableRef = ref()

// 计算表格高度
const tableHeight = computed(() => {
  if (typeof props.height === 'number') {
    return props.height
  }
  if (typeof props.height === 'string') {
    return props.height
  }
  // 根据最大行数计算高度
  const rowHeight = 40 // 估算每行高度
  const headerHeight = 40 // 表头高度
  const maxHeight = props.maxRows * rowHeight + headerHeight
  return maxHeight
})

// 计算显示数据
const displayData = computed(() => {
  if (!props.showPagination) {
    return props.data.slice(0, props.maxRows)
  }

  const start = (currentPage.value - 1) * currentPageSize.value
  const end = start + currentPageSize.value
  return props.data.slice(start, end)
})

// 总数据量
const total = computed(() => props.data.length)

// 事件处理
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

const handleSizeChange = (size: number) => {
  currentPageSize.value = size
  emit('size-change', size)
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  emit('current-change', current)
}

// 监听数据变化，重置分页
watch(
  () => props.data.length,
  () => {
    currentPage.value = 1
  }
)

// 监听默认选中变化，更新表格选中状态
watch(
  () => props.defaultSelection,
  (newSelection) => {
    if (tableRef.value && newSelection && newSelection.length > 0) {
      // 清除当前选中
      tableRef.value.clearSelection()

      // 设置新的选中项
      displayData.value.forEach(row => {
        const isSelected = newSelection.some(selected => {
          if (props.rowKey) {
            return row[props.rowKey] === selected[props.rowKey]
          }
          return row === selected
        })
        if (isSelected) {
          tableRef.value.toggleRowSelection(row, true)
        }
      })
    }
  },
  { immediate: true, deep: true }
)

// 暴露表格方法
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: any, selected?: boolean) => tableRef.value?.toggleRowSelection(row, selected),
  toggleAllSelection: () => tableRef.value?.toggleAllSelection(),
  setCurrentRow: (row: any) => tableRef.value?.setCurrentRow(row),
  clearSort: () => tableRef.value?.clearSort(),
  clearFilter: (columnKeys?: string[]) => tableRef.value?.clearFilter(columnKeys),
  doLayout: () => tableRef.value?.doLayout(),
  sort: (prop: string, order: string) => tableRef.value?.sort(prop, order)
})
</script>

<style scoped>
.universal-table {
  width: 100%;
}

.actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.default-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
