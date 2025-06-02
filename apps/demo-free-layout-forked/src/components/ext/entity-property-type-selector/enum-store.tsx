import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

import type { EnumClass } from '../../../services/types';
import { enumApi } from '../../../services/api-service';

// 重新导出类型
export type { EnumClass };

// 状态接口
interface EnumStoreState {
  enumClasses: Record<string, EnumClass>;
  loading: boolean;
  error: string | null;
}

// 动作类型
type EnumStoreAction =
  | { type: 'SET_ENUM_CLASSES'; payload: EnumClass[] }
  | { type: 'ADD_ENUM_CLASS'; payload: EnumClass }
  | { type: 'UPDATE_ENUM_CLASS'; payload: { id: string; updates: Partial<EnumClass> } }
  | { type: 'DELETE_ENUM_CLASS'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// 初始状态
const initialState: EnumStoreState = {
  enumClasses: {},
  loading: false,
  error: null,
};

// Reducer
function enumStoreReducer(state: EnumStoreState, action: EnumStoreAction): EnumStoreState {
  switch (action.type) {
    case 'SET_ENUM_CLASSES':
      return {
        ...state,
        enumClasses: action.payload.reduce((acc, enumClass) => {
          acc[enumClass.id] = enumClass;
          return acc;
        }, {} as Record<string, EnumClass>),
      };

    case 'ADD_ENUM_CLASS':
      return {
        ...state,
        enumClasses: {
          ...state.enumClasses,
          [action.payload.id]: {
            ...action.payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case 'UPDATE_ENUM_CLASS':
      const existingClass = state.enumClasses[action.payload.id];
      if (!existingClass) return state;

      return {
        ...state,
        enumClasses: {
          ...state.enumClasses,
          [action.payload.id]: {
            ...existingClass,
            ...action.payload.updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case 'DELETE_ENUM_CLASS':
      const { [action.payload]: deleted, ...remainingClasses } = state.enumClasses;
      return {
        ...state,
        enumClasses: remainingClasses,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

// Context
interface EnumStoreContextType {
  state: EnumStoreState;
  dispatch: React.Dispatch<EnumStoreAction>;
  // 便捷方法
  getEnumClass: (id: string) => EnumClass | undefined;
  getEnumValues: (id: string) => string[];
  getAllEnumClasses: () => EnumClass[];
  addEnumClass: (enumClass: Omit<EnumClass, 'createdAt' | 'updatedAt'>) => void;
  updateEnumClass: (id: string, updates: Partial<EnumClass>) => void;
  deleteEnumClass: (id: string) => void;
  refreshEnumClasses: () => Promise<void>;
}

const EnumStoreContext = createContext<EnumStoreContextType | undefined>(undefined);

// Provider组件
interface EnumStoreProviderProps {
  children: ReactNode;
}

export const EnumStoreProvider: React.FC<EnumStoreProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(enumStoreReducer, initialState);

  // 从API加载枚举类
  const refreshEnumClasses = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const enumClasses = await enumApi.getAll();
      dispatch({ type: 'SET_ENUM_CLASSES', payload: enumClasses });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 便捷方法
  const getEnumClass = (id: string): EnumClass | undefined => state.enumClasses[id];

  const getEnumValues = (id: string): string[] => {
    const enumClass = state.enumClasses[id];
    return enumClass ? enumClass.values : [];
  };

  const getAllEnumClasses = (): EnumClass[] => Object.values(state.enumClasses);

  const addEnumClass = (enumClass: Omit<EnumClass, 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_ENUM_CLASS', payload: enumClass as EnumClass });
  };

  const updateEnumClass = (id: string, updates: Partial<EnumClass>) => {
    dispatch({ type: 'UPDATE_ENUM_CLASS', payload: { id, updates } });
  };

  const deleteEnumClass = (id: string) => {
    dispatch({ type: 'DELETE_ENUM_CLASS', payload: id });
  };

  // 初始化时加载数据
  useEffect(() => {
    refreshEnumClasses();
  }, []);

  const contextValue: EnumStoreContextType = {
    state,
    dispatch,
    getEnumClass,
    getEnumValues,
    getAllEnumClasses,
    addEnumClass,
    updateEnumClass,
    deleteEnumClass,
    refreshEnumClasses,
  };

  return <EnumStoreContext.Provider value={contextValue}>{children}</EnumStoreContext.Provider>;
};

// Hook
export const useEnumStore = (): EnumStoreContextType => {
  const context = useContext(EnumStoreContext);
  if (!context) {
    throw new Error('useEnumStore must be used within an EnumStoreProvider');
  }
  return context;
};

// 导出类型
export type { EnumStoreState, EnumStoreAction, EnumStoreContextType };
