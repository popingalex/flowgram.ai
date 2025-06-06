import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// 枚举类接口
export interface EnumClass {
  id: string;
  name: string;
  description: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
}

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
  enumClasses: {
    'vehicle-types': {
      id: 'vehicle-types',
      name: '车辆类型',
      description: '工程车辆分类',
      values: ['推土机', '挖掘机', '装载机', '压路机', '起重机'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    colors: {
      id: 'colors',
      name: '颜色',
      description: '常用颜色选项',
      values: ['红色', '蓝色', '绿色', '黄色', '黑色', '白色'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sizes: {
      id: 'sizes',
      name: '尺寸',
      description: '标准尺寸规格',
      values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
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
  // 未来可以添加与服务器同步的方法
  syncWithServer?: () => Promise<void>;
}

const EnumStoreContext = createContext<EnumStoreContextType | undefined>(undefined);

// Provider组件
interface EnumStoreProviderProps {
  children: ReactNode;
}

export const EnumStoreProvider: React.FC<EnumStoreProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(enumStoreReducer, initialState);

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

  // 未来可以实现与服务器同步
  const syncWithServer = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: 实现与服务器的同步逻辑
      // const response = await fetch('/api/enum-classes');
      // const enumClasses = await response.json();
      // dispatch({ type: 'SET_ENUM_CLASSES', payload: enumClasses });
      console.log('同步功能待实现');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '同步失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const contextValue: EnumStoreContextType = {
    state,
    dispatch,
    getEnumClass,
    getEnumValues,
    getAllEnumClasses,
    addEnumClass,
    updateEnumClass,
    deleteEnumClass,
    syncWithServer,
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
