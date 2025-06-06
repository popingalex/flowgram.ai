import { create } from 'zustand';
import { produce } from 'immer';

import { data } from './data'; // 假设数据源

export interface Attribute {
  _indexId: string;
  id: string;
  name: string;
  type: string;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  enumClassId?: string;
  description?: string;
}

export interface Entity {
  id: string;
  name: string;
  bundles: string[];
  attributes: Attribute[];
}

export interface Module {
  id: string;
  name: string;
  attributes: Attribute[];
}

interface DefinitionStore {
  entities: Entity[];
  modules: Module[];
  getEntityById: (id: string) => Entity | undefined;
  getModuleById: (id: string) => Module | undefined;
  addEntity: (entity: Entity) => void;
  updateEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  addModule: (module: Module) => void;
  updateModule: (module: Module) => void;
  removeModule: (id: string) => void;
  addModuleToEntity: (entityId: string, moduleId: string) => void;
  removeModuleFromEntity: (entityId: string, moduleId: string) => void;
}

export const useDefinitionStore = create<DefinitionStore>((set, get) => ({
  entities: data.entities,
  modules: data.modules,
  getEntityById: (id) => get().entities.find((e) => e.id === id),
  getModuleById: (id) => get().modules.find((m) => m.id === id),
  addEntity: (entity) =>
    set(
      produce((draft) => {
        draft.entities.push(entity);
      })
    ),
  updateEntity: (entity) =>
    set(
      produce((draft) => {
        const index = draft.entities.findIndex((e) => e.id === entity.id);
        if (index !== -1) {
          draft.entities[index] = entity;
        }
      })
    ),
  removeEntity: (id) =>
    set(
      produce((draft) => {
        draft.entities = draft.entities.filter((e) => e.id !== id);
      })
    ),
  addModule: (module) =>
    set(
      produce((draft) => {
        draft.modules.push(module);
      })
    ),
  updateModule: (module) =>
    set(
      produce((draft) => {
        const index = draft.modules.findIndex((m) => m.id === module.id);
        if (index !== -1) {
          draft.modules[index] = module;
        }
      })
    ),
  removeModule: (id) =>
    set(
      produce((draft) => {
        draft.modules = draft.modules.filter((m) => m.id !== id);
      })
    ),
  addModuleToEntity: (entityId, moduleId) =>
    set(
      produce((draft) => {
        const entity = draft.entities.find((e) => e.id === entityId);
        if (entity && !entity.bundles.includes(moduleId)) {
          entity.bundles.push(moduleId);
        }
      })
    ),
  removeModuleFromEntity: (entityId, moduleId) =>
    set(
      produce((draft) => {
        const entity = draft.entities.find((e) => e.id === entityId);
        if (entity) {
          entity.bundles = entity.bundles.filter((b) => b !== moduleId);
        }
      })
    ),
}));
