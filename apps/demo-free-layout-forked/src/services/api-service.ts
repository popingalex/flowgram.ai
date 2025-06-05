// 统一的API服务管理器
// 处理真实请求和mock备选，在真实请求失败时自动使用mock数据

import type { Module, Entity, EnumClass } from './types';
import { MOCK_MODULES, MOCK_ENTITIES, MOCK_ENUM_CLASSES } from './mock-data';

// API配置
const API_CONFIG = {
  BASE_URL: 'http://localhost:9999',
  ENDPOINTS: {
    MODULE: '/cm/module/',
    ENTITY: '/cm/entity/',
    ENUM: '/cm/enum/',
  },
  TIMEOUT: 5000, // 5秒超时
};

// 全局mock模式状态
let isMockMode = true; // 临时启用Mock模式避免API错误

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

  // 模块API
  if (url.includes('/cm/module/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/module/') ? MOCK_MODULES : MOCK_MODULES[0];
    }
    return { success: true };
  }

  // 实体API
  if (url.includes('/cm/entity/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/entity/') ? MOCK_ENTITIES : MOCK_ENTITIES[0];
    }
    return { success: true };
  }

  // 枚举API
  if (url.includes('/cm/enum/')) {
    if (method === 'GET') {
      return Object.values(MOCK_ENUM_CLASSES);
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
