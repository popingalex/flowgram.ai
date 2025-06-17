import { Entity, Module } from '../services/types';

/**
 * ID转换工具
 * 处理业务ID和索引ID之间的转换，确保关联关系的稳定性
 */
export class IdTransform {
  /**
   * 将实体的关联关系从业务ID转换为索引ID（加载到Store时使用）
   */
  static convertEntityBundlesToIndexIds(entity: Entity, modules: Module[]): Entity {
    if (!entity.bundles || entity.bundles.length === 0) {
      return entity;
    }

    // 将bundles中的业务ID转换为索引ID
    const convertedBundles = entity.bundles
      .map((bundleId) => {
        // 先尝试通过业务ID查找模块
        const module = modules.find((m) => m.id === bundleId);
        if (module && module._indexId) {
          return module._indexId;
        }
        // 如果找不到或没有_indexId，保持原值
        return bundleId;
      })
      .filter(Boolean); // 过滤掉空值

    return {
      ...entity,
      bundles: convertedBundles,
    };
  }

  /**
   * 将实体的关联关系从索引ID转换为业务ID（保存到后台时使用）
   */
  static convertEntityBundlesToBusinessIds(entity: Entity, modules: Module[]): Entity {
    if (!entity.bundles || entity.bundles.length === 0) {
      return entity;
    }

    // 将bundles中的索引ID转换为业务ID
    const convertedBundles = entity.bundles
      .map((bundleId) => {
        // 先尝试通过索引ID查找模块
        const module = modules.find((m) => m._indexId === bundleId);
        if (module) {
          return module.id;
        }
        // 如果找不到，可能已经是业务ID，保持原值
        const moduleByBusinessId = modules.find((m) => m.id === bundleId);
        return moduleByBusinessId ? bundleId : null;
      })
      .filter(Boolean) as string[]; // 过滤掉空值并确保类型

    return {
      ...entity,
      bundles: convertedBundles,
    };
  }

  /**
   * 统一的模块查找函数，优先使用索引ID，回退到业务ID
   */
  static findModuleByAnyId(modules: Module[], id: string): Module | undefined {
    // 优先通过_indexId查找
    let module = modules.find((m) => m._indexId === id);
    if (module) return module;

    // 回退到业务ID查找
    return modules.find((m) => m.id === id);
  }

  /**
   * 批量查找模块
   */
  static findModulesByAnyIds(modules: Module[], ids: string[]): Module[] {
    return ids
      .map((id) => this.findModuleByAnyId(modules, id))
      .filter((module): module is Module => Boolean(module));
  }

  /**
   * 检查关联关系是否已经使用索引ID
   */
  static isUsingIndexIds(bundles: string[], modules: Module[]): boolean {
    if (!bundles || bundles.length === 0) return true;

    // 检查是否所有的bundles都能通过_indexId找到对应模块
    return bundles.every((bundleId) => modules.some((module) => module._indexId === bundleId));
  }

  /**
   * 获取模块的稳定标识符（优先返回_indexId，回退到id）
   */
  static getModuleStableId(module: Module): string {
    return module._indexId || module.id;
  }

  /**
   * 验证关联关系的有效性
   */
  static validateBundles(
    bundles: string[],
    modules: Module[]
  ): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    bundles.forEach((bundleId) => {
      const module = this.findModuleByAnyId(modules, bundleId);
      if (module) {
        valid.push(bundleId);
      } else {
        invalid.push(bundleId);
      }
    });

    return { valid, invalid };
  }
}
