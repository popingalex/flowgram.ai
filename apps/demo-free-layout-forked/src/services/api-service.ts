// 统一的API服务管理器
// 处理真实请求和mock备选，在真实请求失败时自动使用mock数据

import { nanoid } from 'nanoid';

import type { Module, Entity, EnumClass, BehaviorDef, BehaviorParameter } from './types';
import { REAL_MODULES, REAL_ENTITIES, REAL_ENUMS, REAL_BEHAVIORS, REAL_GRAPHS } from '../mock-data';

// 创建可变的 mock 数据副本用于 CRUD 操作
let mockEntities: Entity[] = [...REAL_ENTITIES];
let mockModules: Module[] = [...REAL_MODULES];
let mockEnums: EnumClass[] = Array.isArray(REAL_ENUMS) ? [...REAL_ENUMS] : [];

// 重置 mock 数据的函数（可用于测试或重新加载）
export const resetMockData = () => {
  mockEntities = [...REAL_ENTITIES];
  mockModules = [...REAL_MODULES];
  mockEnums = Array.isArray(REAL_ENUMS) ? [...REAL_ENUMS] : [];
  console.log('🔄 Mock 数据已重置');
};

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
  const body = options?.body ? JSON.parse(options.body as string) : null;

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  console.log(`🔄 Mock API: ${method} ${url}`, body ? { body } : '');

  // 行为数据 - 只读
  if (url.includes('/hub/behaviors/')) {
    return REAL_BEHAVIORS;
  }

  if (url.includes('/hub/graphs/')) {
    return REAL_GRAPHS;
  }

  // 实体数据 - 支持 CRUD
  if (url.includes('/cm/entity/')) {
    if (method === 'GET') {
      return [...mockEntities]; // 返回副本
    }

    if (method === 'POST') {
      const newEntity = {
        ...body,
        _indexId: body._indexId || nanoid(),
        deprecated: false,
        attributes: (body.attributes || []).map((attr: any) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
        })),
      };
      mockEntities.push(newEntity);
      console.log('✅ Mock API: 创建实体', newEntity.id);
      return newEntity;
    }

    if (method === 'PUT') {
      const entityIdMatch = url.match(/\/cm\/entity\/([^\/]+)\//);
      const entityId = entityIdMatch?.[1];

      if (entityId) {
        const index = mockEntities.findIndex((e) => e.id === entityId || e._indexId === entityId);
        if (index !== -1) {
          // 保持 _indexId 和其他索引字段
          const updatedEntity = {
            ...mockEntities[index],
            ...body,
            _indexId: mockEntities[index]._indexId, // 保持原有索引ID
            attributes: (body.attributes || []).map((attr: any) => ({
              ...attr,
              _indexId: attr._indexId || nanoid(),
            })),
          };
          mockEntities[index] = updatedEntity;
          console.log('✅ Mock API: 更新实体', entityId, updatedEntity);
          return updatedEntity;
        }
      }
      throw new Error(`实体未找到: ${entityId}`);
    }

    if (method === 'DELETE') {
      const entityIdMatch = url.match(/\/cm\/entity\/([^\/]+)\//);
      const entityId = entityIdMatch?.[1];

      if (entityId) {
        const index = mockEntities.findIndex((e) => e.id === entityId || e._indexId === entityId);
        if (index !== -1) {
          mockEntities.splice(index, 1);
          console.log('✅ Mock API: 删除实体', entityId);
          return;
        }
      }
      throw new Error(`实体未找到: ${entityId}`);
    }

    return mockEntities;
  }

  // 模块数据 - 支持 CRUD
  if (url.includes('/cm/module/')) {
    if (method === 'GET') {
      return [...mockModules]; // 返回副本
    }

    if (method === 'POST') {
      const newModule = {
        ...body,
        _indexId: body._indexId || nanoid(),
        deprecated: false,
        attributes: (body.attributes || []).map((attr: any) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
          displayId: attr.displayId || attr.id?.split('/').pop() || attr.id,
        })),
      };
      mockModules.push(newModule);
      console.log('✅ Mock API: 创建模块', newModule.id);
      return newModule;
    }

    if (method === 'PUT') {
      const moduleIdMatch = url.match(/\/cm\/module\/([^\/]+)\//);
      const moduleId = moduleIdMatch?.[1];

      if (moduleId) {
        const index = mockModules.findIndex((m) => m.id === moduleId || m._indexId === moduleId);
        if (index !== -1) {
          // 保持 _indexId 和其他索引字段
          const updatedModule = {
            ...mockModules[index],
            ...body,
            _indexId: mockModules[index]._indexId, // 保持原有索引ID
            attributes: (body.attributes || []).map((attr: any) => ({
              ...attr,
              _indexId: attr._indexId || nanoid(),
              displayId: attr.displayId || attr.id?.split('/').pop() || attr.id,
            })),
          };
          mockModules[index] = updatedModule;
          console.log('✅ Mock API: 更新模块', moduleId, updatedModule);
          return updatedModule;
        }
      }
      throw new Error(`模块未找到: ${moduleId}`);
    }

    if (method === 'DELETE') {
      const moduleIdMatch = url.match(/\/cm\/module\/([^\/]+)\//);
      const moduleId = moduleIdMatch?.[1];

      if (moduleId) {
        const index = mockModules.findIndex((m) => m.id === moduleId || m._indexId === moduleId);
        if (index !== -1) {
          mockModules.splice(index, 1);
          console.log('✅ Mock API: 删除模块', moduleId);
          return;
        }
      }
      throw new Error(`模块未找到: ${moduleId}`);
    }

    return mockModules;
  }

  // 枚举数据 - 支持 CRUD
  if (url.includes('/cm/enum/')) {
    if (method === 'GET') {
      return [...mockEnums]; // 返回副本
    }

    if (method === 'POST') {
      const newEnum = {
        ...body,
        _indexId: body._indexId || nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockEnums.push(newEnum);
      console.log('✅ Mock API: 创建枚举', newEnum.id);
      return newEnum;
    }

    if (method === 'PUT') {
      const enumIdMatch = url.match(/\/cm\/enum\/([^\/]+)\//);
      const enumId = enumIdMatch?.[1];

      if (enumId) {
        const index = mockEnums.findIndex((e) => e.id === enumId || e._indexId === enumId);
        if (index !== -1) {
          const updatedEnum = {
            ...mockEnums[index],
            ...body,
            _indexId: mockEnums[index]._indexId, // 保持原有索引ID
            updatedAt: new Date().toISOString(),
          };
          mockEnums[index] = updatedEnum;
          console.log('✅ Mock API: 更新枚举', enumId, updatedEnum);
          return updatedEnum;
        }
      }
      throw new Error(`枚举未找到: ${enumId}`);
    }

    if (method === 'DELETE') {
      const enumIdMatch = url.match(/\/cm\/enum\/([^\/]+)\//);
      const enumId = enumIdMatch?.[1];

      if (enumId) {
        const index = mockEnums.findIndex((e) => e.id === enumId || e._indexId === enumId);
        if (index !== -1) {
          mockEnums.splice(index, 1);
          console.log('✅ Mock API: 删除枚举', enumId);
          return;
        }
      }
      throw new Error(`枚举未找到: ${enumId}`);
    }

    return mockEnums;
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
  // 获取所有函数行为 - 直接返回后台原始数据，不做转换
  getAll: async () => {
    const rawData = await apiRequest('http://localhost:9999/hub/behaviors/');
    console.log('🔍 [behaviorApi] 原始API数据:', {
      isArray: Array.isArray(rawData),
      length: rawData?.length,
      firstItem: rawData?.[0],
    });

    // 直接返回后台数据，只添加_indexId用作React key
    if (Array.isArray(rawData)) {
      return rawData.map((item: any) => ({
        ...item,
        _indexId: nanoid(), // 只添加React key，其他数据保持原样
      }));
    }

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
