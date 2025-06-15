// 统一的API服务管理器
// 处理真实请求和mock备选，在真实请求失败时自动使用mock数据

import { nanoid } from 'nanoid';

import type { Module, Entity, EnumClass, BehaviorDef, BehaviorParameter } from './types';
import { MOCK_MODULES, MOCK_ENTITIES, MOCK_ENUM_CLASSES, MOCK_BEHAVIORS } from './mock-data';
import { REAL_MODULES, REAL_ENTITIES, REAL_ENUMS, REAL_BEHAVIORS, REAL_GRAPHS } from '../mock-data';

// 后台返回的Java行为数据格式
interface BackendBehaviorDef {
  id: string;
  returns: {
    // 修正：真实API返回的是 "returns" 而不是 "returnAttr"
    id: string;
    type: string;
    name?: string;
  };
  params: Array<{
    id: string;
    type: string;
    desc?: string; // 真实数据类型
    name?: string;
  }>;
  javadoc: string;
  type: 'normal' | 'contract';
}

// 将后台数据转换为前端格式
const transformBackendBehavior = (backendBehavior: BackendBehaviorDef): BehaviorDef => {
  // 从Java全限定ID提取信息: com.gsafety.simulation.behavior.entity.Rain.simulateRain
  const idParts = backendBehavior.id.split('.');
  const methodName = idParts[idParts.length - 1] || 'unknown'; // 最后一个是方法名
  const fullClassName = idParts.slice(0, -1).join('.'); // 除了最后一个都是完整类名
  const classNameParts = fullClassName.split('.');
  const className = classNameParts[classNameParts.length - 1] || 'Unknown'; // 类名是完整类名的最后一部分

  // 转换参数 - 保持原始type
  const parameters: BehaviorParameter[] = backendBehavior.params.map((param) => ({
    name: param.id,
    type: param.type, // 使用原始type
    description: param.desc || param.id, // desc作为描述
  }));

  return {
    id: backendBehavior.id,
    name: methodName,
    description: backendBehavior.javadoc || '',
    className: className, // Rain
    fullClassName: fullClassName, // com.gsafety.simulation.behavior.entity.Rain
    methodName: methodName, // simulateRain
    category: className, // 🔧 添加category字段，使用className作为分类
    parameters,
    returns: {
      type: backendBehavior.returns.type,
      description: '',
    },
  };
};

// API配置
const API_CONFIG = {
  BASE_URL: 'http://localhost:9999',
  ENDPOINTS: {
    MODULE: '/cm/module/',
    ENTITY: '/cm/entity/',
    ENUM: '/cm/enum/',
    FUNCTION: '/hub/behaviors/',
  },
  TIMEOUT: 5000, // 5秒超时
};

// 全局mock模式状态
let isMockMode = false; // 尝试使用真实API，失败时自动降级到Mock

// 切换mock模式
export const toggleMockMode = () => {
  isMockMode = !isMockMode;
  console.log(`API模式已切换为: ${isMockMode ? 'Mock模式' : '真实API模式'}`);
  return isMockMode;
};

// 获取当前模式
export const getApiMode = () => ({
  isMockMode,
  mode: isMockMode ? 'Mock模式' : '真实API模式',
});

// 构建完整的API URL
const buildApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// 带超时的fetch请求
const fetchWithTimeout = async (url: string, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// 真实API请求函数
const realApiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Mock API请求处理
const mockApiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const method = options?.method || 'GET';

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  if (url.includes('/hub/behaviors/')) {
    return REAL_BEHAVIORS;
  }

  if (url.includes('/hub/graphs/')) {
    return REAL_GRAPHS;
  }

  if (url.includes('/cm/entity/')) {
    return REAL_ENTITIES;
  }

  if (url.includes('/cm/module/')) {
    return REAL_MODULES;
  }

  if (url.includes('/cm/enum/')) {
    return REAL_ENUMS;
  }

  throw new Error(`Mock API: 未找到匹配的路由 ${method} ${url}`);
};

// 统一的API请求函数
const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  try {
    // 尝试真实API请求
    const response = await realApiRequest(url, options);
    return response;
  } catch (error) {
    // 真实API失败，切换到Mock模式
    return await mockApiRequest(url, options);
  }
};

// 模块相关API
export const moduleApi = {
  // 获取所有模块
  getAll: (): Promise<Module[]> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
    return apiRequest(url);
  },

  // 获取单个模块
  getById: (id: string): Promise<Module> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${id}/`);
    return apiRequest(url);
  },

  // 创建模块
  create: (module: Omit<Module, 'deprecated'>): Promise<Module> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ ...module, deprecated: false }),
    });
  },

  // 更新模块
  update: (id: string, updates: Partial<Module>): Promise<Module> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${id}/`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除模块
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${id}/`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 实体相关API
export const entityApi = {
  // 获取所有实体
  getAll: (): Promise<Entity[]> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
    return apiRequest(url);
  },

  // 获取单个实体
  getById: (id: string): Promise<Entity> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${id}/`);
    return apiRequest(url);
  },

  // 创建实体
  create: (entity: Omit<Entity, 'deprecated'>): Promise<Entity> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ ...entity, deprecated: false }),
    });
  },

  // 更新实体
  update: (id: string, updates: Partial<Entity>): Promise<Entity> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${id}/`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除实体
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${id}/`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 枚举类相关API
export const enumApi = {
  // 获取所有枚举类
  getAll: (): Promise<EnumClass[]> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENUM);
    return apiRequest(url);
  },

  // 获取单个枚举类
  getById: (id: string): Promise<EnumClass> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENUM}${id}/`);
    return apiRequest(url);
  },

  // 创建枚举类
  create: (enumClass: Omit<EnumClass, 'createdAt' | 'updatedAt'>): Promise<EnumClass> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENUM);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(enumClass),
    });
  },

  // 更新枚举类
  update: (id: string, updates: Partial<EnumClass>): Promise<EnumClass> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENUM}${id}/`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除枚举类
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENUM}${id}/`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 函数行为相关API
export const behaviorApi = {
  // 获取所有函数行为
  getAll: async (): Promise<BehaviorDef[]> => {
    const rawData = await apiRequest('http://localhost:9999/hub/behaviors/');
    console.log('🔍 [behaviorApi] 原始API数据:', {
      isArray: Array.isArray(rawData),
      length: rawData?.length,
      firstItem: rawData?.[0],
    });

    // 检查数据格式并转换
    if (Array.isArray(rawData) && rawData.length > 0) {
      const firstItem = rawData[0];

      // 检查是否是后台数据格式（有fullClassName字段）或者Mock数据格式（有id和params字段）
      if (firstItem.fullClassName) {
        // 后台数据格式，需要转换
        return rawData.map((item: any) => ({
          id: item.id,
          name: item.name || item.methodName || 'Unknown',
          description: item.description || `Action: ${item.methodName || item.name}`,
          functionType: item.functionType || 'backend-action',
          category: item.className || 'Unknown',
          fullClassName: item.fullClassName,
          methodName: item.methodName,
          parameters: item.parameters || [],
          returns: item.returns || { id: 'result', type: 'void', name: 'result' },
          returnType: item.returnType || 'void',
          tags: item.tags || [],
          _indexId: item._indexId || nanoid(),
        }));
      } else if (firstItem.id && firstItem.params) {
        // Mock数据格式（behaviors.json），需要转换为标准格式
        console.log('🔍 [behaviorApi] 检测到Mock数据格式，开始转换...');
        return rawData.map((item: any) => {
          // 从完整的Java类名中提取类名和方法名
          const fullId = item.id || '';
          const parts = fullId.split('.');
          const methodName = parts[parts.length - 1] || 'unknown';
          const className = parts[parts.length - 2] || 'Unknown';

          return {
            id: item.id,
            name: methodName,
            description: item.javadoc || `${className}.${methodName}`,
            functionType: item.type === 'contract' ? 'contract' : 'backend-action',
            category: className,
            fullClassName: fullId,
            methodName: methodName,
            parameters: (item.params || []).map((param: any) => ({
              id: param.id,
              name: param.id,
              type: param.type,
              description: param.desc || '',
              required: true,
            })),
            returns: {
              id: item.returns?.id || 'result',
              type: item.returns?.type || 'void',
              name: item.returns?.name || 'result',
              description: '函数返回值',
            },
            returnType: item.returns?.type || 'void',
            tags: [],
            _indexId: nanoid(),
          };
        });
      } else {
        // 已经是标准格式，直接使用
        console.log('🔍 [behaviorApi] 检测到标准格式，直接使用');
        return rawData;
      }
    }

    console.log('🔍 [behaviorApi] 没有数据或数据格式不正确，返回空数组');
    return [];
  },

  // 获取单个函数行为
  getById: (id: string): Promise<BehaviorDef> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.FUNCTION}${id}/`);
    return apiRequest(url);
  },

  // 创建函数行为
  create: (behavior: Omit<BehaviorDef, 'deprecated'>): Promise<BehaviorDef> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.FUNCTION);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ ...behavior, deprecated: false }),
    });
  },

  // 更新函数行为
  update: (id: string, updates: Partial<BehaviorDef>): Promise<BehaviorDef> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.FUNCTION}${id}/`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除函数行为
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.FUNCTION}${id}/`);
    return apiRequest(url, { method: 'DELETE' });
  },
};
