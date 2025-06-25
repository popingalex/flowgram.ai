// 基于抽象框架的模块Store实现

import { nanoid } from 'nanoid';

import { createIndexedStore } from './base/indexed-store-base';
import { IndexedStoreConfig } from './base/indexed-store';
import { Module, ModuleAttribute } from '../services/types';
import { moduleApi } from '../services/api-service';

// 🔑 模块Store配置
const moduleStoreConfig: IndexedStoreConfig<Module> = {
  // API端点配置
  apiEndpoints: {
    getAll: () => moduleApi.getAll(),
    create: (module: Module) => moduleApi.create(module),
    update: (id: string, module: Module) => moduleApi.update(id, module),
    delete: (id: string) => moduleApi.delete(id),
  },

  // 数据处理配置
  ensureIndexId: (module: Partial<Module>): Module => ({
    id: module.id || '',
    name: module.name || '',
    description: module.description || '',
    attributes: module.attributes || [],
    deprecated: module.deprecated || false,
    _indexId: module._indexId || nanoid(),
    _status: module._status || 'saved',
    _editStatus: module._editStatus,
  }),

  validateItem: (module: Module): boolean => !!(module.id && module.name),

  // 子属性配置
  childrenConfig: {
    fieldName: 'attributes',
    ensureChildIndexId: (attr: ModuleAttribute): ModuleAttribute => ({
      ...attr,
      _indexId: attr._indexId || nanoid(),
    }),
  },
};

// 🔑 创建模块Store
export const useModuleListStore = createIndexedStore(moduleStoreConfig, 'ModuleList');

// 🔑 扩展方法：模块特有的操作
export const ModuleListStoreExtensions = {
  // 添加新模块
  addNewModule: () => {
    const newModule: Module = {
      id: `new_module_${Date.now()}`,
      name: '新模块',
      description: '',
      attributes: [],
      deprecated: false,
      _indexId: nanoid(),
      _status: 'new',
    };

    useModuleListStore.setState((state) => {
      state.items.push(newModule as any);
    });

    console.log('➕ [ModuleList] 添加新模块:', newModule.id);
    return newModule._indexId;
  },

  // 添加新属性
  addNewAttribute: (moduleIndexId: string) => {
    const newAttribute: ModuleAttribute = {
      id: `new_attr_${Date.now()}`,
      name: '新属性',
      type: 's',
      description: '',
      _indexId: nanoid(),
    };

    useModuleListStore.setState((state) => {
      const moduleIndex = state.items.findIndex((m) => m._indexId === moduleIndexId);
      if (moduleIndex !== -1) {
        (state.items[moduleIndex] as any).attributes.push(newAttribute);

        // 标记模块为dirty
        if (state.items[moduleIndex]._status !== 'new') {
          (state.items[moduleIndex] as any)._status = 'dirty';
        }
      }
    });

    console.log('➕ [ModuleList] 添加新属性:', newAttribute.id);
    return newAttribute._indexId;
  },

  // 更新属性字段
  updateAttributeField: (
    moduleIndexId: string,
    attributeIndexId: string,
    field: string,
    value: any
  ) => {
    useModuleListStore.setState((state) => {
      const moduleIndex = state.items.findIndex((m) => m._indexId === moduleIndexId);
      if (moduleIndex !== -1) {
        const module = state.items[moduleIndex] as any;
        const attrIndex = module.attributes.findIndex((a: any) => a._indexId === attributeIndexId);

        if (attrIndex !== -1) {
          module.attributes[attrIndex][field] = value;

          // 标记模块为dirty
          if (module._status !== 'new') {
            module._status = 'dirty';
          }
        }
      }
    });
  },

  // 删除属性
  deleteAttribute: (moduleIndexId: string, attributeIndexId: string) => {
    useModuleListStore.setState((state) => {
      const moduleIndex = state.items.findIndex((m) => m._indexId === moduleIndexId);
      if (moduleIndex !== -1) {
        const module = state.items[moduleIndex] as any;
        module.attributes = module.attributes.filter((a: any) => a._indexId !== attributeIndexId);

        // 标记模块为dirty
        if (module._status !== 'new') {
          module._status = 'dirty';
        }
      }
    });

    console.log('🗑️ [ModuleList] 删除属性:', attributeIndexId);
  },

  // 获取模块的索引ID函数
  getModuleIndexId: (module: Module) => module._indexId,

  // 获取属性的索引ID函数
  getAttributeIndexId: (attribute: ModuleAttribute) => attribute._indexId,
};
