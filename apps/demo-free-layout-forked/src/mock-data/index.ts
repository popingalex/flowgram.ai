// Mock数据管理器 - 基于真实后台API数据
// 用于离线开发，直接使用真实API数据作为mock

import type { Module, Entity, EnumClass, BehaviorDef } from '../services/types';

// 直接导入真实API数据
import modulesData from './modules.json';
import graphsData from './graphs.json';
import enumsData from './enums.json';
import entitiesData from './entities.json';
import behaviorsData from './behaviors.json';

// 导出真实数据，供离线开发使用
export const REAL_MODULES = modulesData as Module[];
export const REAL_ENTITIES = entitiesData as Entity[];
export const REAL_ENUMS = enumsData; // 可能是错误对象，保持原样
export const REAL_BEHAVIORS = behaviorsData as any[]; // 后台格式，需要转换
export const REAL_GRAPHS = graphsData as any[];

// 数据统计
export const getRealDataStats = () => ({
  modules: Array.isArray(REAL_MODULES) ? REAL_MODULES.length : 0,
  entities: Array.isArray(REAL_ENTITIES) ? REAL_ENTITIES.length : 0,
  enums: Array.isArray(REAL_ENUMS) ? REAL_ENUMS.length : 0,
  behaviors: Array.isArray(REAL_BEHAVIORS) ? REAL_BEHAVIORS.length : 0,
  graphs: Array.isArray(REAL_GRAPHS) ? REAL_GRAPHS.length : 0,
  timestamp: new Date().toISOString(),
});

// 控制台输出数据统计
console.log('[MockData] 真实API数据已加载:', getRealDataStats());
