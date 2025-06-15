// 统一的API服务管理器
// 处理真实请求和mock备选，在真实请求失败时自动使用mock数据

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

// Mock API处理函数
const mockApiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  console.log(`[MOCK] ${options?.method || 'GET'} ${url}`);

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  const method = options?.method || 'GET';

  // 模块API - 使用真实数据
  if (url.includes('/cm/module/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/module/') ? REAL_MODULES : REAL_MODULES[0];
    }
    return { success: true };
  }

  // 实体API - 使用真实数据
  if (url.includes('/cm/entity/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/entity/') ? REAL_ENTITIES : REAL_ENTITIES[0];
    }
    return { success: true };
  }

  // 枚举API - 使用真实数据（可能是错误对象）
  if (url.includes('/cm/enum/')) {
    if (method === 'GET') {
      // 如果是错误对象，返回空数组
      return Array.isArray(REAL_ENUMS) ? REAL_ENUMS : [];
    }
    return { success: true };
  }

  // 函数行为API - 使用真实数据
  if (url.includes('/hub/behaviors/')) {
    if (method === 'GET') {
      return url.endsWith('/hub/behaviors/') ? REAL_BEHAVIORS : REAL_BEHAVIORS[0];
    }
    return { success: true };
  }

  // 工作流图API - 使用真实数据
  if (url.includes('/hub/graphs/')) {
    if (method === 'GET') {
      return url.endsWith('/hub/graphs/') ? REAL_GRAPHS : REAL_GRAPHS[0];
    }
    return { success: true };
  }

  throw new Error(`Mock not implemented for: ${url}`);
};

// 统一的API请求入口
export const apiRequest = async (url: string, options?: RequestInit) => {
  // 如果是mock模式，直接使用mock数据
  if (isMockMode) {
    return mockApiRequest(url, options);
  }

  // 尝试真实API请求，失败时使用mock作为备选
  try {
    console.log(`[API] ${options?.method || 'GET'} ${url}`);
    return await realApiRequest(url, options);
  } catch (error) {
    console.warn(`真实API请求失败，使用Mock数据作为备选:`, error);
    console.log(`[FALLBACK] 切换到Mock模式处理请求`);
    return mockApiRequest(url, options);
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
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.FUNCTION);
    const rawData = await apiRequest(url);

    // 如果是后台真实数据，需要转换格式
    if (Array.isArray(rawData) && rawData.length > 0 && 'returns' in rawData[0]) {
      console.log(`[BehaviorAPI] 检测到后台数据格式，转换中... (${rawData.length} 条记录)`);
      return rawData.map((item: BackendBehaviorDef) => transformBackendBehavior(item));
    }

    // 如果是Mock数据，直接返回
    console.log(`[BehaviorAPI] 使用Mock数据格式 (${rawData.length} 条记录)`);
    return rawData;
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
