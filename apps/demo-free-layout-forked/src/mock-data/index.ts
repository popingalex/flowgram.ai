// Mock数据管理器 - 基于真实后台API数据
// 用于离线开发，直接使用真实API数据作为mock

import type { Module, Entity, EnumClass, BehaviorDef } from '../services/types';

// 直接导入真实API数据
import modulesData from './modules.json';
import graphsData from './graphs.json';
import enumsData from './enums.json';
import entitiesData from './entities.json';
import behaviorsData from './behaviors.json';

// 导出真实数据
export const REAL_MODULES = modulesData as Module[];
export const REAL_ENTITIES = entitiesData as Entity[];
export const REAL_ENUMS = enumsData; // 可能是错误对象，保持原样
export const REAL_BEHAVIORS = behaviorsData as any[]; // 后台格式，需要转换
export const REAL_GRAPHS = graphsData as any[];

// 获取真实数据统计信息
export const getRealDataStats = () => ({
  modules: REAL_MODULES.length,
  entities: REAL_ENTITIES.length,
  enums: Array.isArray(REAL_ENUMS) ? REAL_ENUMS.length : 0,
  behaviors: REAL_BEHAVIORS.length,
  graphs: REAL_GRAPHS.length,
  lastUpdated: new Date().toISOString(),
});
