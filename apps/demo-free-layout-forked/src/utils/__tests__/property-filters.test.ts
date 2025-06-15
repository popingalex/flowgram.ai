import {
  filterEntityExtendedProperties,
  filterModuleProperties,
  filterMetaProperties,
  groupModuleProperties,
  getPropertyStats,
  validatePropertyClassification,
} from '../property-filters';
import type { Attribute } from '../../services/types';

describe('Property Filters', () => {
  const mockAttributes: Attribute[] = [
    // 基础属性（meta）
    {
      id: '__entity_id',
      name: '实体ID',
      type: 'string',
      _indexId: 'meta1',
      isEntityProperty: true,
    },
    {
      id: '__entity_name',
      name: '实体名称',
      type: 'string',
      _indexId: 'meta2',
      isEntityProperty: true,
    },
    // 实体扩展属性
    {
      id: 'custom_field',
      name: '自定义字段',
      type: 'string',
      _indexId: 'ext1',
    },
    {
      id: 'priority',
      name: '优先级',
      type: 'number',
      _indexId: 'ext2',
    },
    // 模块属性
    {
      id: 'mobile/speed',
      name: '移动速度',
      type: 'number',
      _indexId: 'mod1',
      isModuleProperty: true,
      moduleId: 'mobile',
    },
    {
      id: 'mobile/direction',
      name: '移动方向',
      type: 'string',
      _indexId: 'mod2',
      isModuleProperty: true,
      moduleId: 'mobile',
    },
    {
      id: 'container/capacity',
      name: '容器容量',
      type: 'number',
      _indexId: 'mod3',
      isModuleProperty: true,
      moduleId: 'container',
    },
  ];

  describe('filterEntityExtendedProperties', () => {
    it('should filter entity extended properties correctly', () => {
      const result = filterEntityExtendedProperties(mockAttributes);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('custom_field');
      expect(result[1].id).toBe('priority');

      // 确保没有基础属性和模块属性
      result.forEach((attr) => {
        expect(attr.isEntityProperty).toBeFalsy();
        expect(attr.isModuleProperty).toBeFalsy();
      });
    });

    it('should return empty array when no extended properties exist', () => {
      const onlyMetaAndModule = mockAttributes.filter(
        (attr) => attr.isEntityProperty || attr.isModuleProperty
      );

      const result = filterEntityExtendedProperties(onlyMetaAndModule);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterModuleProperties', () => {
    it('should filter module properties correctly', () => {
      const result = filterModuleProperties(mockAttributes);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('mobile/speed');
      expect(result[1].id).toBe('mobile/direction');
      expect(result[2].id).toBe('container/capacity');

      // 确保都是模块属性
      result.forEach((attr) => {
        expect(attr.isModuleProperty).toBe(true);
        expect(attr.moduleId).toBeDefined();
      });
    });
  });

  describe('filterMetaProperties', () => {
    it('should filter meta properties correctly', () => {
      const result = filterMetaProperties(mockAttributes);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('__entity_id');
      expect(result[1].id).toBe('__entity_name');

      // 确保都是基础属性
      result.forEach((attr) => {
        expect(attr.isEntityProperty).toBe(true);
      });
    });
  });

  describe('groupModuleProperties', () => {
    it('should group module properties by moduleId', () => {
      const result = groupModuleProperties(mockAttributes);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['mobile']).toHaveLength(2);
      expect(result['container']).toHaveLength(1);

      expect(result['mobile'][0].id).toBe('mobile/speed');
      expect(result['mobile'][1].id).toBe('mobile/direction');
      expect(result['container'][0].id).toBe('container/capacity');
    });

    it('should handle properties without moduleId', () => {
      const attributesWithoutModuleId = [
        ...mockAttributes,
        {
          id: 'orphan/property',
          name: '孤儿属性',
          type: 'string',
          _indexId: 'orphan1',
          isModuleProperty: true,
          // 没有 moduleId
        } as Attribute,
      ];

      const result = groupModuleProperties(attributesWithoutModuleId);

      expect(result['unknown']).toHaveLength(1);
      expect(result['unknown'][0].id).toBe('orphan/property');
    });
  });

  describe('getPropertyStats', () => {
    it('should return correct statistics', () => {
      const stats = getPropertyStats(mockAttributes);

      expect(stats.total).toBe(7);
      expect(stats.meta).toBe(2);
      expect(stats.extended).toBe(2);
      expect(stats.module).toBe(3);
      expect(stats.moduleGroups).toBe(2);
    });
  });

  describe('validatePropertyClassification', () => {
    it('should return true for properly classified properties', () => {
      const isValid = validatePropertyClassification(mockAttributes);
      expect(isValid).toBe(true);
    });

    it('should return false for improperly classified properties', () => {
      // 创建一个没有分类标记的属性
      const unclassifiedAttributes = [
        ...mockAttributes,
        {
          id: 'unclassified',
          name: '未分类属性',
          type: 'string',
          _indexId: 'unclass1',
          // 没有 isEntityProperty 或 isModuleProperty 标记
        } as Attribute,
      ];

      const isValid = validatePropertyClassification(unclassifiedAttributes);
      expect(isValid).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      expect(filterEntityExtendedProperties([])).toHaveLength(0);
      expect(filterModuleProperties([])).toHaveLength(0);
      expect(filterMetaProperties([])).toHaveLength(0);
      expect(groupModuleProperties([])).toEqual({});
    });

    it('should handle attributes with missing properties', () => {
      const incompleteAttributes: Attribute[] = [
        {
          id: 'incomplete',
          name: '不完整属性',
          type: 'string',
          _indexId: 'inc1',
          // 缺少一些可选属性
        },
      ];

      const extendedResult = filterEntityExtendedProperties(incompleteAttributes);
      expect(extendedResult).toHaveLength(1);

      const moduleResult = filterModuleProperties(incompleteAttributes);
      expect(moduleResult).toHaveLength(0);

      const metaResult = filterMetaProperties(incompleteAttributes);
      expect(metaResult).toHaveLength(0);
    });
  });
});
