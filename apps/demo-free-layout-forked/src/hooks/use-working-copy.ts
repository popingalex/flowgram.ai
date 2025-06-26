import { useState, useCallback, useMemo } from 'react';

import { cloneDeep, isEqual } from 'lodash-es';

// 通用的working copy状态
export interface WorkingCopyState<T> {
  // 原始数据（只读）
  original: T | null;
  // 编辑中的数据（可修改）
  current: T | null;
  // 状态标记
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// working copy操作
export interface WorkingCopyActions<T> {
  // 设置原始数据（创建working copy）
  setOriginal: (data: T | null) => void;
  // 更新当前数据
  updateCurrent: (updates: Partial<T> | ((current: T) => T)) => void;
  // 重置到原始状态
  reset: () => void;
  // 保存变化
  save: (saveFunction: (data: T) => Promise<void>) => Promise<void>;
  // 设置错误
  setError: (error: string | null) => void;
  // 设置保存状态
  setSaving: (saving: boolean) => void;
  // 验证数据
  validate: (validator?: (data: T) => { isValid: boolean; errors: string[] }) => {
    isValid: boolean;
    errors: string[];
  };
}

// 完整的working copy hook返回值
export type WorkingCopyHook<T> = WorkingCopyState<T> & WorkingCopyActions<T>;

// 默认的深度比较函数
const defaultCompare = <T>(a: T | null, b: T | null): boolean => {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return isEqual(a, b);
};

// 默认的数据清理函数（用于比较时忽略某些字段）
const defaultCleanForComparison = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data;

  // 移除可能影响比较的临时字段
  const cleaned = { ...data };
  const fieldsToIgnore = ['_timestamp', '_version', 'lastModified', 'updatedAt'];

  fieldsToIgnore.forEach((field) => {
    if (field in cleaned) {
      delete (cleaned as any)[field];
    }
  });

  return cleaned;
};

/**
 * 通用的working copy hook
 *
 * @param options 配置选项
 * @returns working copy状态和操作函数
 */
export function useWorkingCopy<T extends Record<string, any>>(options?: {
  // 自定义比较函数
  compare?: (a: T | null, b: T | null) => boolean;
  // 数据清理函数（用于比较）
  cleanForComparison?: (data: T) => T;
  // 默认验证器
  defaultValidator?: (data: T) => { isValid: boolean; errors: string[] };
  // 调试名称
  debugName?: string;
}): WorkingCopyHook<T> {
  const {
    compare = defaultCompare,
    cleanForComparison = defaultCleanForComparison,
    defaultValidator,
    debugName = 'WorkingCopy',
  } = options || {};

  // 状态管理
  const [state, setState] = useState<{
    original: T | null;
    current: T | null;
    isSaving: boolean;
    error: string | null;
  }>({
    original: null,
    current: null,
    isSaving: false,
    error: null,
  });

  // 计算是否有变化
  const isDirty = useMemo(() => {
    if (!state.original || !state.current) return false;

    const cleanOriginal = cleanForComparison(state.original);
    const cleanCurrent = cleanForComparison(state.current);

    const result = !compare(cleanOriginal, cleanCurrent);

    if (debugName) {
      console.log(`🔍 [${debugName}] isDirty计算:`, {
        result,
        hasOriginal: !!state.original,
        hasCurrent: !!state.current,
      });
    }

    return result;
  }, [state.original, state.current, compare, cleanForComparison, debugName]);

  // 设置原始数据
  const setOriginal = useCallback(
    (data: T | null) => {
      setState((prev) => ({
        ...prev,
        original: data ? cloneDeep(data) : null,
        current: data ? cloneDeep(data) : null,
        error: null,
      }));

      if (debugName) {
        console.log(`📝 [${debugName}] 设置原始数据:`, data);
      }
    },
    [debugName]
  );

  // 更新当前数据
  const updateCurrent = useCallback(
    (updates: Partial<T> | ((current: T) => T)) => {
      setState((prev) => {
        if (!prev.current) {
          console.warn(`⚠️ [${debugName}] 尝试更新空的current数据`);
          return prev;
        }

        let newCurrent: T;

        if (typeof updates === 'function') {
          newCurrent = updates(prev.current);
        } else {
          newCurrent = { ...prev.current, ...updates };
        }

        if (debugName) {
          console.log(`🔄 [${debugName}] 更新当前数据:`, {
            updates: typeof updates === 'function' ? '[Function]' : updates,
          });
        }

        return {
          ...prev,
          current: newCurrent,
          error: null, // 清除错误
        };
      });
    },
    [debugName]
  );

  // 重置到原始状态
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      current: prev.original ? cloneDeep(prev.original) : null,
      error: null,
    }));

    if (debugName) {
      console.log(`🔄 [${debugName}] 重置到原始状态`);
    }
  }, [debugName]);

  // 保存变化
  const save = useCallback(
    async (saveFunction: (data: T) => Promise<void>) => {
      if (!state.current || state.isSaving) {
        console.warn(`⚠️ [${debugName}] 无法保存: 没有数据或正在保存中`);
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        if (debugName) {
          console.log(`💾 [${debugName}] 开始保存:`, state.current);
        }

        await saveFunction(state.current);

        // 保存成功，更新原始数据
        setState((prev) => ({
          ...prev,
          original: prev.current ? cloneDeep(prev.current) : null,
          isSaving: false,
        }));

        if (debugName) {
          console.log(`✅ [${debugName}] 保存成功`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '保存失败';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isSaving: false,
        }));

        if (debugName) {
          console.error(`❌ [${debugName}] 保存失败:`, error);
        }

        throw error;
      }
    },
    [state.current, state.isSaving, debugName]
  );

  // 设置错误
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // 设置保存状态
  const setSaving = useCallback((saving: boolean) => {
    setState((prev) => ({ ...prev, isSaving: saving }));
  }, []);

  // 验证数据
  const validate = useCallback(
    (validator?: (data: T) => { isValid: boolean; errors: string[] }) => {
      if (!state.current) {
        return { isValid: false, errors: ['没有数据'] };
      }

      const validatorToUse = validator || defaultValidator;
      if (!validatorToUse) {
        return { isValid: true, errors: [] };
      }

      const result = validatorToUse(state.current);

      if (debugName) {
        console.log(`✅ [${debugName}] 验证结果:`, result);
      }

      return result;
    },
    [state.current, defaultValidator, debugName]
  );

  return {
    // 状态
    original: state.original,
    current: state.current,
    isDirty,
    isSaving: state.isSaving,
    error: state.error,

    // 操作
    setOriginal,
    updateCurrent,
    reset,
    save,
    setError,
    setSaving,
    validate,
  };
}

// 🔑 通用验证器：适用于大部分有id和name的数据
export const commonValidator = (data: any) => {
  const errors: string[] = [];

  if (!data.id || !data.id.trim()) {
    errors.push('ID不能为空');
  }

  if (!data.name || !data.name.trim()) {
    errors.push('名称不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 🔑 通用数据清理：移除影响比较的临时字段
export const commonCleanForComparison = (data: any) => {
  const { _timestamp, _version, lastModified, updatedAt, ...cleaned } = data;
  return cleaned;
};
