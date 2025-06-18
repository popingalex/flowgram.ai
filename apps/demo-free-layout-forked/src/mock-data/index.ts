// 统一数据管理器 - 唯一的数据源目录
// 所有数据都从真实后端API获取，用于开发和测试

import type { Module, Entity, EnumClass } from '../services/types';

// 导入所有数据文件
import modulesData from './modules.json';
import graphsData from './graphs.json';
import enumsData from './enums.json';
import entitiesData from './entities.json';
import behaviorsData from './behaviors.json';

// 导出统一的数据接口
export const REAL_MODULES = modulesData as Module[];
export const REAL_ENTITIES = entitiesData as Entity[];
export const REAL_ENUMS = enumsData; // 原始格式保持不变
export const REAL_BEHAVIORS = behaviorsData; // Expression格式，直接使用
export const REAL_GRAPHS = graphsData;

// 数据统计和元信息
export const getDataStats = () => ({
  modules: REAL_MODULES.length,
  entities: REAL_ENTITIES.length,
  enums: Array.isArray(REAL_ENUMS) ? REAL_ENUMS.length : 0,
  behaviors: REAL_BEHAVIORS.length,
  graphs: REAL_GRAPHS.length,
  lastUpdated: new Date().toISOString(),
  dataSource: 'unified-mock-data',
});

// 便捷查询函数
export const findBehavior = (id: string) =>
  REAL_BEHAVIORS.find((behavior: any) => behavior.id === id);

export const findGraph = (entityId: string) =>
  REAL_GRAPHS.find((graph: any) => graph.id === entityId);

export const findEntity = (id: string) => REAL_ENTITIES.find((entity) => entity.id === id);

export const findModule = (id: string) => REAL_MODULES.find((module) => module.id === id);
