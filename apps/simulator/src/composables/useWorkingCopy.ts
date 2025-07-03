import { ref, computed, watch, type Ref } from 'vue'
import { cloneDeep, isEqual } from 'lodash-es'

export interface WorkingCopyOptions<T = any> {
  autoSave?: boolean
  autoSaveDelay?: number
  onSave?: (data: T) => void
  onReset?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onError?: (error: any) => void
}

/**
 * 通用的 working copy hook
 * 可以用于任何数据类型的编辑管理
 */
export function useWorkingCopy<T>(
  source: Ref<T | undefined>,
  saveFunction: (data: T) => Promise<void> | void,
  options: WorkingCopyOptions<T> = {}
) {
  const {
    autoSave = false,
    autoSaveDelay = 1000,
    onSave,
    onReset,
    onDirtyChange,
    onError
  } = options

  // 工作副本
  const workingCopy = ref<T | undefined>(
    source.value ? cloneDeep(source.value) : undefined
  ) as Ref<T | undefined>

  // 是否有变更
  const isDirty = computed(() => {
    if (!source.value || !workingCopy.value) return false
    return !isEqual(source.value, workingCopy.value)
  })

  // 是否正在保存
  const isSaving = ref(false)

  // 自动保存定时器
  let autoSaveTimer: number | null = null

  // 重置到原始状态
  const reset = () => {
    if (source.value) {
      workingCopy.value = cloneDeep(source.value)
      onReset?.()
    }
  }

  // 保存变更
  const save = async () => {
    if (!workingCopy.value || !isDirty.value) return false

    isSaving.value = true
    try {
      await saveFunction(workingCopy.value)
      onSave?.(workingCopy.value)
      return true
    } catch (error) {
      onError?.(error)
      console.error('保存失败:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // 取消自动保存
  const cancelAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 触发自动保存
  const triggerAutoSave = () => {
    if (!autoSave) return

    cancelAutoSave()
    autoSaveTimer = setTimeout(() => {
      if (isDirty.value) {
        save()
      }
    }, autoSaveDelay)
  }

  // 监听原始数据变化
  watch(source, (newValue) => {
    if (newValue && !isDirty.value) {
      workingCopy.value = cloneDeep(newValue)
    }
  }, { deep: true })

  // 监听工作副本变化
  watch(workingCopy, () => {
    if (autoSave) {
      triggerAutoSave()
    }
  }, { deep: true })

  // 监听 isDirty 变化
  watch(isDirty, (dirty) => {
    onDirtyChange?.(dirty)
  })

  // 清理函数
  const cleanup = () => {
    cancelAutoSave()
  }

  return {
    workingCopy,
    isDirty,
    isSaving,
    reset,
    save,
    cleanup
  }
}
