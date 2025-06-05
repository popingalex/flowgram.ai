import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

export interface UseClonedOptions<T = any> {
  /**
   * 自定义克隆函数
   * 默认使用 JSON.parse(JSON.stringify()) 进行深拷贝
   */
  clone?: (source: T) => T;
  /**
   * 手动同步模式
   * @default false
   */
  manual?: boolean;
}

export interface UseClonedReturn<T> {
  /**
   * 克隆的数据
   */
  cloned: T;
  /**
   * 设置克隆数据
   */
  setCloned: (value: T | ((prev: T) => T)) => void;
  /**
   * dirty状态 - 表示数据已修改但未保存
   */
  isDirty: boolean;
  /**
   * 重置数据到原始状态
   */
  reset: () => void;
  /**
   * 手动同步原始数据到克隆数据
   */
  sync: () => void;
}

/**
 * 默认的JSON克隆函数
 * 使用structuredClone替代JSON方法，更好地保留对象结构
 */
function defaultClone<T>(source: T): T {
  // 使用structuredClone替代JSON.parse(JSON.stringify())
  // structuredClone能更好地处理复杂对象，但仍不能处理函数
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(source);
    } catch (e) {
      // 降级到JSON方法
      return JSON.parse(JSON.stringify(source));
    }
  }
  return JSON.parse(JSON.stringify(source));
}

/**
 * 深度比较两个对象是否相等
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * React版本的useCloned hook
 * 提供reactive的blur属性和reset函数
 */
export function useCloned<T>(source: T, options: UseClonedOptions<T> = {}): UseClonedReturn<T> {
  const { clone = defaultClone, manual = false } = options;

  // 使用ref跟踪上一次的source，避免state更新导致的循环
  const previousSourceRef = useRef<T>(source);
  const [original, setOriginal] = useState(() => clone(source));

  // 克隆数据状态
  const [cloned, setCloned] = useState(() => clone(source));

  // 当source变化时，重新初始化数据
  useEffect(() => {
    if (!deepEqual(previousSourceRef.current, source)) {
      const newOriginal = clone(source);
      previousSourceRef.current = source;
      setOriginal(newOriginal);
      setCloned(clone(source));
    }
  }, [source, clone]);

  // 计算dirty状态 - 表示数据已修改但未保存
  const isDirty = useMemo(() => !deepEqual(original, cloned), [original, cloned]);

  // 重置函数 - 还原到原始状态
  const reset = useCallback(() => {
    setCloned(clone(original));
    console.log('reset', original, cloned);
  }, [original, clone]);

  // 同步函数 - 更新原始数据
  const sync = useCallback(() => {
    // 在这个场景下，sync主要用于重置
    reset();
  }, [reset]);

  return {
    cloned,
    setCloned,
    isDirty,
    reset,
    sync,
  };
}
