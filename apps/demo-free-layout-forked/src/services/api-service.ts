// 统一的API服务管理器
// 处理真实请求和mock备选，在真实请求失败时自动使用mock数据

import { nanoid } from 'nanoid';

import type {
  Module,
  Entity,
  EnumClass,
  BehaviorDef,
  ExpressionDef,
  ExpressionCallResult,
  BehaviorParameter,
  BackendModule,
  BackendSystem,
  BackendRemoteBehavior,
  BackendLocalBehavior,
  BackendScriptBehavior,
} from './types';
import {
  REAL_MODULES,
  REAL_ENTITIES,
  REAL_ENUMS,
  REAL_BEHAVIORS,
  REAL_EXPRESSIONS,
  REAL_GRAPHS,
} from '../mock-data';

// 创建可变的 mock 数据副本用于 CRUD 操作，并添加必要的前端字段
let mockEntities: Entity[] = REAL_ENTITIES.map((entity: any) => ({
  ...entity,
  _indexId: entity._indexId || nanoid(),
  _status: 'saved' as const,
  attributes: (entity.attributes || []).map((attr: any) => ({
    ...attr,
    _indexId: attr._indexId || nanoid(),
    _status: 'saved' as const,
  })),
}));

let mockModules: Module[] = REAL_MODULES.map((module: any) => ({
  ...module,
  _indexId: module._indexId || nanoid(),
  _status: 'saved' as const,
  attributes: (module.attributes || []).map((attr: any) => ({
    ...attr,
    _indexId: attr._indexId || nanoid(),
    _status: 'saved' as const,
  })),
}));
let mockEnums: EnumClass[] = Array.isArray(REAL_ENUMS) ? [...(REAL_ENUMS as unknown as EnumClass[])] : [];
let mockGraphs: any[] = [...REAL_GRAPHS]; // 添加可变的图数据副本

// ECS系统mock数据 - 基于 simulation-disaster.coupling 源码分析
let mockSystems: BackendSystem[] = [
  {
    id: 'agent_system',
    name: '智能体系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      {
        id: 'AgentComponent',
        name: '智能体组件',
        type: 'required',
        description: '标记实体为自主智能体',
      },
      {
        id: 'PositionComponent',
        name: '位置组件',
        type: 'required',
        description: '实体的空间位置',
      },
      {
        id: 'TargetComponent',
        name: '目标组件',
        type: 'optional',
        description: '智能体的行动目标',
      },
      {
        id: 'InventoryComponent',
        name: '库存组件',
        type: 'optional',
        description: '智能体携带的物品',
      },
      {
        id: 'EmitterComponent',
        name: '发射器组件',
        type: 'optional',
        description: '智能体的物质发射能力',
      },
      { id: 'NameComponent', name: '名称组件', type: 'optional', description: '实体的可读名称' },
      { id: 'BurningComponent', name: '燃烧组件', type: 'query', description: '用于查找燃烧目标' },
      {
        id: 'FlammableComponent',
        name: '易燃组件',
        type: 'query',
        description: '用于查找可燃目标',
      },
      {
        id: 'RefillStationComponent',
        name: '补给站组件',
        type: 'query',
        description: '用于查找补给站',
      },
    ],
  },
  {
    id: 'fire_system',
    name: '火灾系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      { id: 'FlammableComponent', name: '易燃组件', type: 'required', description: '可燃烧的实体' },
      { id: 'BurningComponent', name: '燃烧组件', type: 'optional', description: '正在燃烧的状态' },
      {
        id: 'PositionComponent',
        name: '位置组件',
        type: 'required',
        description: '用于热传播计算',
      },
      { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
      {
        id: 'MaterialComponent',
        name: '材料组件',
        type: 'optional',
        description: '材料属性影响燃烧',
      },
      {
        id: 'PressureVesselComponent',
        name: '压力容器组件',
        type: 'optional',
        description: '压力容器受热影响',
      },
      {
        id: 'StructuralIntegrityComponent',
        name: '结构完整性组件',
        type: 'optional',
        description: '结构受火灾影响',
      },
      { id: 'WindComponent', name: '风力组件', type: 'query', description: '影响火势传播方向' },
    ],
  },
  {
    id: 'movement_system',
    name: '移动系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      { id: 'PositionComponent', name: '位置组件', type: 'required', description: '实体当前位置' },
      { id: 'TargetComponent', name: '目标组件', type: 'required', description: '移动目标位置' },
      {
        id: 'AgentComponent',
        name: '智能体组件',
        type: 'optional',
        description: '获取移动速度和状态',
      },
      { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于调试日志' },
    ],
  },
  {
    id: 'interaction_system',
    name: '交互系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      { id: 'AgentComponent', name: '智能体组件', type: 'required', description: '执行交互的主体' },
      {
        id: 'InventoryComponent',
        name: '库存组件',
        type: 'required',
        description: '交互使用的物质',
      },
      { id: 'TargetComponent', name: '目标组件', type: 'required', description: '交互的目标' },
      {
        id: 'EmitterComponent',
        name: '发射器组件',
        type: 'optional',
        description: '控制交互范围和流量',
      },
      { id: 'PositionComponent', name: '位置组件', type: 'required', description: '计算交互距离' },
      {
        id: 'FlammableComponent',
        name: '易燃组件',
        type: 'query',
        description: '交互目标的材料属性',
      },
      { id: 'MaterialComponent', name: '材料组件', type: 'query', description: '用于本体论查询' },
      { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
    ],
  },
  {
    id: 'explosion_system',
    name: '爆炸系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      {
        id: 'PressureVesselComponent',
        name: '压力容器组件',
        type: 'required',
        description: '可爆炸的压力容器',
      },
      { id: 'PositionComponent', name: '位置组件', type: 'required', description: '爆炸中心位置' },
      {
        id: 'ExplosionEventComponent',
        name: '爆炸事件组件',
        type: 'optional',
        description: '爆炸效果状态',
      },
    ],
  },
  {
    id: 'resource_system',
    name: '资源系统',
    type: 'ecs',
    version: '1.0.0',
    enabled: true,
    deprecated: false,
    participants: [
      { id: 'AgentComponent', name: '智能体组件', type: 'required', description: '资源使用主体' },
      { id: 'InventoryComponent', name: '库存组件', type: 'required', description: '资源存储' },
      { id: 'EmitterComponent', name: '发射器组件', type: 'optional', description: '资源消耗设备' },
      {
        id: 'RefillStationComponent',
        name: '补给站组件',
        type: 'query',
        description: '资源补给点',
      },
      { id: 'PositionComponent', name: '位置组件', type: 'required', description: '计算补给距离' },
      { id: 'TargetComponent', name: '目标组件', type: 'optional', description: '补给目标位置' },
      { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
    ],
  },
];

// 重置 mock 数据的函数（可用于测试或重新加载）
export const resetMockData = () => {
  mockEntities = REAL_ENTITIES.map((entity: any) => ({
    ...entity,
    _indexId: entity._indexId || nanoid(),
    _status: 'saved' as const,
    attributes: (entity.attributes || []).map((attr: any) => ({
      ...attr,
      _indexId: attr._indexId || nanoid(),
      _status: 'saved' as const,
    })),
  }));
  
  mockModules = REAL_MODULES.map((module: any) => ({
    ...module,
    _indexId: module._indexId || nanoid(),
    _status: 'saved' as const,
    attributes: (module.attributes || []).map((attr: any) => ({
      ...attr,
      _indexId: attr._indexId || nanoid(),
      _status: 'saved' as const,
    })),
  }));
  mockEnums = Array.isArray(REAL_ENUMS) ? [...(REAL_ENUMS as unknown as EnumClass[])] : [];
  mockGraphs = [...REAL_GRAPHS]; // 重置图数据
  // 重置系统数据到初始状态
  mockSystems = [
    {
      id: 'agent_system',
      name: '智能体系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        {
          id: 'AgentComponent',
          name: '智能体组件',
          type: 'required',
          description: '标记实体为自主智能体',
        },
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '实体的空间位置',
        },
        {
          id: 'TargetComponent',
          name: '目标组件',
          type: 'optional',
          description: '智能体的行动目标',
        },
        {
          id: 'InventoryComponent',
          name: '库存组件',
          type: 'optional',
          description: '智能体携带的物品',
        },
        {
          id: 'EmitterComponent',
          name: '发射器组件',
          type: 'optional',
          description: '智能体的物质发射能力',
        },
        { id: 'NameComponent', name: '名称组件', type: 'optional', description: '实体的可读名称' },
        {
          id: 'BurningComponent',
          name: '燃烧组件',
          type: 'query',
          description: '用于查找燃烧目标',
        },
        {
          id: 'FlammableComponent',
          name: '易燃组件',
          type: 'query',
          description: '用于查找可燃目标',
        },
        {
          id: 'RefillStationComponent',
          name: '补给站组件',
          type: 'query',
          description: '用于查找补给站',
        },
      ],
    },
    {
      id: 'fire_system',
      name: '火灾系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        {
          id: 'FlammableComponent',
          name: '易燃组件',
          type: 'required',
          description: '可燃烧的实体',
        },
        {
          id: 'BurningComponent',
          name: '燃烧组件',
          type: 'optional',
          description: '正在燃烧的状态',
        },
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '用于热传播计算',
        },
        { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
        {
          id: 'MaterialComponent',
          name: '材料组件',
          type: 'optional',
          description: '材料属性影响燃烧',
        },
        {
          id: 'PressureVesselComponent',
          name: '压力容器组件',
          type: 'optional',
          description: '压力容器受热影响',
        },
        {
          id: 'StructuralIntegrityComponent',
          name: '结构完整性组件',
          type: 'optional',
          description: '结构受火灾影响',
        },
        { id: 'WindComponent', name: '风力组件', type: 'query', description: '影响火势传播方向' },
      ],
    },
    {
      id: 'movement_system',
      name: '移动系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '实体当前位置',
        },
        { id: 'TargetComponent', name: '目标组件', type: 'required', description: '移动目标位置' },
        {
          id: 'AgentComponent',
          name: '智能体组件',
          type: 'optional',
          description: '获取移动速度和状态',
        },
        { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于调试日志' },
      ],
    },
    {
      id: 'interaction_system',
      name: '交互系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        {
          id: 'AgentComponent',
          name: '智能体组件',
          type: 'required',
          description: '执行交互的主体',
        },
        {
          id: 'InventoryComponent',
          name: '库存组件',
          type: 'required',
          description: '交互使用的物质',
        },
        { id: 'TargetComponent', name: '目标组件', type: 'required', description: '交互的目标' },
        {
          id: 'EmitterComponent',
          name: '发射器组件',
          type: 'optional',
          description: '控制交互范围和流量',
        },
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '计算交互距离',
        },
        {
          id: 'FlammableComponent',
          name: '易燃组件',
          type: 'query',
          description: '交互目标的材料属性',
        },
        { id: 'MaterialComponent', name: '材料组件', type: 'query', description: '用于本体论查询' },
        { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
      ],
    },
    {
      id: 'explosion_system',
      name: '爆炸系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        {
          id: 'PressureVesselComponent',
          name: '压力容器组件',
          type: 'required',
          description: '可爆炸的压力容器',
        },
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '爆炸中心位置',
        },
        {
          id: 'ExplosionEventComponent',
          name: '爆炸事件组件',
          type: 'optional',
          description: '爆炸效果状态',
        },
      ],
    },
    {
      id: 'resource_system',
      name: '资源系统',
      type: 'ecs',
      version: '1.0.0',
      enabled: true,
      deprecated: false,
      participants: [
        { id: 'AgentComponent', name: '智能体组件', type: 'required', description: '资源使用主体' },
        { id: 'InventoryComponent', name: '库存组件', type: 'required', description: '资源存储' },
        {
          id: 'EmitterComponent',
          name: '发射器组件',
          type: 'optional',
          description: '资源消耗设备',
        },
        {
          id: 'RefillStationComponent',
          name: '补给站组件',
          type: 'query',
          description: '资源补给点',
        },
        {
          id: 'PositionComponent',
          name: '位置组件',
          type: 'required',
          description: '计算补给距离',
        },
        { id: 'TargetComponent', name: '目标组件', type: 'optional', description: '补给目标位置' },
        { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
      ],
    },
  ];
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
    id: param.id,
    name: param.id,
    type: param.type, // 使用原始type
    desc: param.desc || param.id, // desc作为描述
    _indexId: nanoid(),
    _status: 'saved' as const,
  }));

  return {
    id: backendBehavior.id,
    name: methodName,
    desc: backendBehavior.javadoc || '',
    className: className, // Rain
    fullClassName: fullClassName, // com.gsafety.simulation.behavior.entity.Rain
    methodName: methodName, // simulateRain
    category: className, // 🔧 添加category字段，使用className作为分类
    inputs: parameters,
    output: {
      id: backendBehavior.returns.id,
      name: backendBehavior.returns.name || backendBehavior.returns.id,
      type: backendBehavior.returns.type,
      desc: '',
      _indexId: nanoid(),
      _status: 'saved' as const,
    },
    _indexId: nanoid(),
    _status: 'saved' as const,
  } as BehaviorDef;
};

// API配置
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  ENDPOINTS: {
    MODULE: '/api/modular/modules/',
    ENTITY: '/api/modular/entities',
    SYSTEM: '/api/systems',
    BEHAVIOR_REMOTE: '/exp/remote',
    BEHAVIOR_LOCAL: '/api/behaviors/local',
    BEHAVIOR_SCRIPT: '/api/behaviors/script',
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

// 简化的fetch请求，不使用定时器
const fetchWithTimeout = async (url: string, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// 真实API请求函数
const realApiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  // 检查响应内容，如果为空则返回null（适用于DELETE等操作）
  const contentLength = response.headers.get('Content-Length');
  const contentType = response.headers.get('Content-Type');

  // 对于DELETE操作或明确标明无内容的响应，直接返回null
  if (contentLength === '0' || response.status === 204) {
    return null;
  }

  // 尝试解析JSON，如果失败则返回null
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null; // 空响应
    }

    const data = JSON.parse(text);

    // 🔑 数据转换：将后端的modules字段转换为前端期望的bundles字段
    if (url.includes('/api/modular/entities') && Array.isArray(data)) {
      return data.map((entity: any) => ({
        ...entity,
        // 转换modules数组为bundles数组（提取ID）
        bundles: entity.modules
          ? entity.modules.map((module: any) => (typeof module === 'string' ? module : module.id))
          : [],
        // 保留原始modules字段供其他用途
        modules: entity.modules || [],
      }));
    }

    // 单个实体的情况
    if (url.includes('/api/modular/entities') && data && typeof data === 'object' && !Array.isArray(data)) {
      return {
        ...data,
        bundles: data.modules
          ? data.modules.map((module: any) => (typeof module === 'string' ? module : module.id))
          : [],
        modules: data.modules || [],
      };
    }

    return data;
  } catch (error) {
    console.warn('解析响应JSON失败，返回null:', error);
    return null;
  }
};

// Mock API请求处理 - 🔧 移除人为延迟
const mockApiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body as string) : null;

  // 🔧 移除模拟网络延迟，直接处理请求
  console.log(`🔄 Mock API: ${method} ${url}`, body ? { body } : '');

  // 废弃的端点直接返回空数据
  if (
    url.includes('/hub/behaviors/') ||
    url.includes('/hub/expressions/') ||
    url.includes('/hub/graphs/') ||
    url.includes('/cm/entity/')
  ) {
    console.warn('⚠️ 访问废弃的API端点:', url);
    return [];
  }

  // 模块数据 - 支持 CRUD
  if (url.includes('/api/modular/modules')) {
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
      const moduleIdMatch = url.match(/\/api\/modular\/modules\/([^\/]+)/);
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
      const moduleIdMatch = url.match(/\/api\/modular\/modules\/([^\/]+)/);
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

  // 系统数据 - 支持 CRUD
  if (url.includes('/api/systems')) {
    if (method === 'GET') {
      return [...mockSystems];
    }

    if (method === 'POST') {
      const newSystem = {
        ...body,
        id: body.id || nanoid(),
        enabled: body.enabled !== undefined ? body.enabled : true,
        deprecated: body.deprecated !== undefined ? body.deprecated : false,
      };
      mockSystems.push(newSystem);
      console.log('✅ Mock API: 创建系统', newSystem.id);
      return newSystem;
    }

    if (method === 'PUT') {
      const systemIdMatch = url.match(/\/api\/systems\/([^\/]+)/);
      const systemId = systemIdMatch?.[1];

      if (systemId) {
        const index = mockSystems.findIndex((s) => s.id === systemId);
        if (index !== -1) {
          const updatedSystem = {
            ...mockSystems[index],
            ...body,
          };
          mockSystems[index] = updatedSystem;
          console.log('✅ Mock API: 更新系统', systemId, updatedSystem);
          return updatedSystem;
        }
      }
      throw new Error(`系统未找到: ${systemId}`);
    }

    if (method === 'DELETE') {
      const systemIdMatch = url.match(/\/api\/systems\/([^\/]+)/);
      const systemId = systemIdMatch?.[1];

      if (systemId) {
        const index = mockSystems.findIndex((s) => s.id === systemId);
        if (index !== -1) {
          mockSystems.splice(index, 1);
          console.log('✅ Mock API: 删除系统', systemId);
          return;
        }
      }
      throw new Error(`系统未找到: ${systemId}`);
    }

    return mockSystems;
  }

  // 实体数据 - 支持 CRUD
  if (url.includes('/api/modular/entities')) {
    if (method === 'GET') {
      // 🔑 数据转换：将mock数据的modules字段转换为前端期望的bundles字段
      const transformedEntities = mockEntities.map((entity: any) => {
        const rawEntity = entity as any; // 类型断言以访问原始数据
        return {
          ...entity,
          // 转换modules数组为bundles数组（提取ID）
          bundles: rawEntity.modules
            ? rawEntity.modules.map((module: any) => (typeof module === 'string' ? module : module.id))
            : [],
          // 保留原始modules字段供其他用途
          modules: rawEntity.modules || [],
        };
      });
      
      console.log('🔍 [API] 实体数据转换示例:', {
        原始数据: (mockEntities[0] as any)?.modules,
        转换后bundles: transformedEntities[0]?.bundles,
        实体数量: transformedEntities.length
      });
      
      return transformedEntities;
    }

    if (method === 'POST') {
      const newEntity = {
        ...body,
        _indexId: body._indexId || nanoid(),
        deprecated: false,
        attributes: (body.attributes || []).map((attr: any) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
          displayId: attr.displayId || attr.id?.split('/').pop() || attr.id,
        })),
        bundles: body.bundles || [],
      };
      mockEntities.push(newEntity);
      console.log('✅ Mock API: 创建实体', newEntity.id);
      return newEntity;
    }

    if (method === 'PUT') {
      const entityIdMatch = url.match(/\/api\/modular\/entities\/([^\/]+)/);
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
              displayId: attr.displayId || attr.id?.split('/').pop() || attr.id,
            })),
            bundles: body.bundles || [],
          };
          mockEntities[index] = updatedEntity;
          console.log('✅ Mock API: 更新实体', entityId, updatedEntity);
          return updatedEntity;
        }
      }
      throw new Error(`实体未找到: ${entityId}`);
    }

    if (method === 'DELETE') {
      const entityIdMatch = url.match(/\/api\/modular\/entities\/([^\/]+)/);
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

  // 枚举数据 - 只读，返回mock数据
  if (url.includes('/cm/enum/')) {
    return mockEnums;
  }

  // 新的行为API端点支持 - /exp/remote, /exp/local, /exp/script
  if (url.includes('/exp/remote')) {
    if (method === 'GET') {
      // 从更新的mock数据中获取远程行为
      const remoteBehaviors = REAL_BEHAVIORS.filter((b) => b.type === 'remote');
      console.log('✅ Mock API: 返回远程行为', remoteBehaviors.length);
      return remoteBehaviors;
    }
    // 其他CRUD操作暂时返回空
    return [];
  }

  if (url.includes('/exp/local')) {
    if (method === 'GET') {
      // 从更新的mock数据中获取本地行为
      const localBehaviors = REAL_BEHAVIORS.filter((b) => b.type === 'local');
      console.log('✅ Mock API: 返回本地行为', localBehaviors.length);
      return localBehaviors;
    }
    return [];
  }

  if (url.includes('/exp/script')) {
    if (method === 'GET') {
      // 从更新的mock数据中获取脚本行为
      const scriptBehaviors = REAL_BEHAVIORS.filter((b) => b.type === 'script');
      console.log('✅ Mock API: 返回脚本行为', scriptBehaviors.length);
      return scriptBehaviors;
    }
    return [];
  }

  console.warn('🚫 未知的API端点:', url);
  throw new Error(`未知的API端点: ${url}`);
};

// 统一的API请求函数
const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const method = options?.method || 'GET';

  try {
    // 尝试真实API请求
    const response = await realApiRequest(url, options);
    console.log(`✅ 真实API成功: ${method} ${url}`);
    return response;
  } catch (error) {
    console.log(`❌ 真实API失败，切换到Mock: ${method} ${url}`, error);
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
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`);
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
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除模块
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`);
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
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`);
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
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除实体
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 枚举类相关API - 已废弃，使用新的枚举管理系统
export const enumApi = {
  // 获取所有枚举类 - 已废弃
  getAll: (): Promise<EnumClass[]> => {
    console.warn('⚠️ enumApi.getAll 已废弃，请使用新的枚举管理系统');
    return Promise.resolve([]);
  },

  // 获取单个枚举类 - 已废弃
  getById: (id: string): Promise<EnumClass> => {
    console.warn('⚠️ enumApi.getById 已废弃，请使用新的枚举管理系统');
    return Promise.reject(new Error('API已废弃'));
  },

  // 创建枚举类 - 已废弃
  create: (enumClass: Omit<EnumClass, 'createdAt' | 'updatedAt'>): Promise<EnumClass> => {
    console.warn('⚠️ enumApi.create 已废弃，请使用新的枚举管理系统');
    return Promise.reject(new Error('API已废弃'));
  },

  // 更新枚举类 - 已废弃
  update: (id: string, updates: Partial<EnumClass>): Promise<EnumClass> => {
    console.warn('⚠️ enumApi.update 已废弃，请使用新的枚举管理系统');
    return Promise.reject(new Error('API已废弃'));
  },

  // 删除枚举类 - 已废弃
  delete: (id: string): Promise<void> => {
    console.warn('⚠️ enumApi.delete 已废弃，请使用新的枚举管理系统');
    return Promise.reject(new Error('API已废弃'));
  },
};

// 新的行为管理API - 支持三种类型的行为
export const expressionManagementApi = {
  // 获取远程行为
  getRemoteBehaviors: (): Promise<BackendRemoteBehavior[]> => {
    const url = buildApiUrl('/exp/remote');
    return apiRequest(url);
  },

  // 获取本地行为
  getLocalBehaviors: (): Promise<BackendLocalBehavior[]> => {
    const url = buildApiUrl('/exp/local');
    return apiRequest(url);
  },

  // 获取脚本行为
  getScriptBehaviors: (): Promise<BackendScriptBehavior[]> => {
    const url = buildApiUrl('/exp/script');
    return apiRequest(url);
  },

  // 获取所有行为（合并三种类型）
  getAllBehaviors: async (): Promise<
    (BackendRemoteBehavior | BackendLocalBehavior | BackendScriptBehavior)[]
  > => {
    try {
      const [remote, local, script] = await Promise.all([
        expressionManagementApi.getRemoteBehaviors(),
        expressionManagementApi.getLocalBehaviors(),
        expressionManagementApi.getScriptBehaviors(),
      ]);
      return [...remote, ...local, ...script];
    } catch (error) {
      console.error('获取行为数据失败:', error);
      return [];
    }
  },

  // 创建远程行为
  createRemoteBehavior: (
    behavior: Omit<BackendRemoteBehavior, 'id'>
  ): Promise<BackendRemoteBehavior> => {
    const url = buildApiUrl('/exp/remote');
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(behavior),
    });
  },

  // 创建本地行为
  createLocalBehavior: (
    behavior: Omit<BackendLocalBehavior, 'id'>
  ): Promise<BackendLocalBehavior> => {
    const url = buildApiUrl('/exp/local');
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(behavior),
    });
  },

  // 创建脚本行为
  createScriptBehavior: (
    behavior: Omit<BackendScriptBehavior, 'id'>
  ): Promise<BackendScriptBehavior> => {
    const url = buildApiUrl('/exp/script');
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(behavior),
    });
  },

  // 更新远程行为
  updateRemoteBehavior: (
    id: string,
    updates: Partial<BackendRemoteBehavior>
  ): Promise<BackendRemoteBehavior> => {
    const url = buildApiUrl(`/exp/remote/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 更新本地行为
  updateLocalBehavior: (
    id: string,
    updates: Partial<BackendLocalBehavior>
  ): Promise<BackendLocalBehavior> => {
    const url = buildApiUrl(`/exp/local/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 更新脚本行为
  updateScriptBehavior: (
    id: string,
    updates: Partial<BackendScriptBehavior>
  ): Promise<BackendScriptBehavior> => {
    const url = buildApiUrl(`/exp/script/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除远程行为
  deleteRemoteBehavior: (id: string): Promise<void> => {
    const url = buildApiUrl(`/exp/remote/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },

  // 删除本地行为
  deleteLocalBehavior: (id: string): Promise<void> => {
    const url = buildApiUrl(`/exp/local/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },

  // 删除脚本行为
  deleteScriptBehavior: (id: string): Promise<void> => {
    const url = buildApiUrl(`/exp/script/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 系统管理API
export const systemApi = {
  // 获取所有系统
  getAll: (): Promise<BackendSystem[]> => {
    const url = buildApiUrl('/api/systems');
    return apiRequest(url);
  },

  // 获取单个系统
  getById: (id: string): Promise<BackendSystem> => {
    const url = buildApiUrl(`/api/systems/${id}`);
    return apiRequest(url);
  },

  // 创建系统
  create: (system: Omit<BackendSystem, 'id'>): Promise<BackendSystem> => {
    const url = buildApiUrl('/api/systems');
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(system),
    });
  },

  // 更新系统
  update: (id: string, updates: Partial<BackendSystem>): Promise<BackendSystem> => {
    const url = buildApiUrl(`/api/systems/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除系统
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`/api/systems/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 远程行为相关API
export const remoteBehaviorApi = {
  // 获取所有远程行为
  getAll: (): Promise<BackendRemoteBehavior[]> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BEHAVIOR_REMOTE);
    return apiRequest(url);
  },

  // 获取单个远程行为
  getById: (id: string): Promise<BackendRemoteBehavior> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_REMOTE}/${id}`);
    return apiRequest(url);
  },

  // 创建远程行为
  create: (behavior: Partial<BackendRemoteBehavior>): Promise<BackendRemoteBehavior> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BEHAVIOR_REMOTE);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(behavior),
    });
  },

  // 更新远程行为
  update: (id: string, updates: Partial<BackendRemoteBehavior>): Promise<BackendRemoteBehavior> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_REMOTE}/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除远程行为
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_REMOTE}/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },
};

// 本地行为相关API
export const localBehaviorApi = {
  // 获取所有本地行为
  getAll: (): Promise<BackendLocalBehavior[]> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BEHAVIOR_LOCAL);
    return apiRequest(url);
  },

  // 获取单个本地行为
  getById: (id: string): Promise<BackendLocalBehavior> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_LOCAL}/${id}`);
    return apiRequest(url);
  },

  // 创建本地行为
  create: (behavior: Partial<BackendLocalBehavior>): Promise<BackendLocalBehavior> => {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BEHAVIOR_LOCAL);
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(behavior),
    });
  },

  // 更新本地行为
  update: (id: string, updates: Partial<BackendLocalBehavior>): Promise<BackendLocalBehavior> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_LOCAL}/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除本地行为
  delete: (id: string): Promise<void> => {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BEHAVIOR_LOCAL}/${id}`);
    return apiRequest(url, { method: 'DELETE' });
  },
};
