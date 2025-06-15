import React, { useMemo } from 'react';

import type { IJsonSchema } from '@flowgram.ai/form-materials';

import {
  PropertyDataManager,
  PropertyData,
  GroupedPropertyData,
  PropertyFilter,
} from '../../../utils/property-data-manager';
import { useModuleStore } from '../../../stores/module.store';
import { useCurrentEntity } from '../../../stores/current-entity.store';
import { PropertyTable } from './PropertyTable';
import { ModulePropertyTree } from './ModulePropertyTree';
import './styles.css';

export interface PropertyDisplayManagerProps {
  // 数据源配置
  dataSource: 'entity' | 'schema' | 'mixed';
  schema?: IJsonSchema;

  // 显示配置
  mode: 'node' | 'sidebar';
  nodeType?: string;

  // 功能配置
  editable?: boolean;
  showModules?: boolean;
  showSystem?: boolean;

  // 过滤配置
  filters?: PropertyFilter[];

  // 事件回调
  onEdit?: (property: PropertyData) => void;
  onDelete?: (property: PropertyData) => void;
  onSelect?: (properties: PropertyData[]) => void;
}

export const PropertyDisplayManager: React.FC<PropertyDisplayManagerProps> = ({
  dataSource,
  schema,
  mode,
  nodeType,
  editable = false,
  showModules = true,
  showSystem = false,
  filters = [],
  onEdit,
  onDelete,
  onSelect,
}) => {
  const { editingEntity } = useCurrentEntity();
  const { modules } = useModuleStore();

  // 统一处理数据源
  const allProperties = useMemo(() => {
    let properties: PropertyData[] = [];

    // 根据数据源获取属性
    switch (dataSource) {
      case 'entity':
        if (editingEntity?.attributes) {
          properties = PropertyDataManager.fromEntityAttributes(editingEntity.attributes);
        }
        break;

      case 'schema':
        if (schema) {
          properties = PropertyDataManager.fromJsonSchema(schema);
        }
        break;

      case 'mixed':
        // 混合模式：优先使用schema，补充entity数据
        if (schema) {
          properties = PropertyDataManager.fromJsonSchema(schema);
        } else if (editingEntity?.attributes) {
          properties = PropertyDataManager.fromEntityAttributes(editingEntity.attributes);
        }
        break;
    }

    // 添加系统属性
    if (showSystem && editingEntity) {
      const systemProps = PropertyDataManager.createSystemProperties(
        editingEntity.id,
        editingEntity.name,
        editingEntity.description
      );
      properties = [...systemProps, ...properties];
    }

    return properties;
  }, [dataSource, schema, editingEntity, showSystem]);

  // 应用过滤器
  const filteredProperties = useMemo(() => {
    let filtered = allProperties;

    // 应用节点类型过滤
    if (nodeType) {
      filtered = PropertyDataManager.filterByNodeType(filtered, nodeType);
    }

    // 应用显示模式过滤
    filtered = PropertyDataManager.filterByMode(filtered, mode);

    // 应用自定义过滤器
    if (filters.length > 0) {
      filtered = PropertyDataManager.applyFilters(filtered, filters);
    }

    return filtered;
  }, [allProperties, nodeType, mode, filters]);

  // 分组属性
  const groupedProperties = useMemo(
    () => PropertyDataManager.groupByCategory(filteredProperties),
    [filteredProperties]
  );

  // 渲染实体属性表格
  const renderEntityProperties = () => {
    if (groupedProperties.entity.length === 0) return null;

    return (
      <PropertyTable
        key="entity-properties"
        title="实体属性"
        properties={groupedProperties.entity}
        mode={mode}
        editable={editable}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    );
  };

  // 渲染模块属性
  const renderModuleProperties = () => {
    if (!showModules || groupedProperties.modules.length === 0) return null;

    if (mode === 'node') {
      // 节点模式：显示模块标签列表
      return (
        <div key="module-list" className="module-list">
          <div className="module-list-title">关联模块</div>
          <div className="module-tags">
            {groupedProperties.modules.map((group) => (
              <span key={group.moduleId} className="module-tag">
                {group.moduleName}
              </span>
            ))}
          </div>
        </div>
      );
    } else {
      // 侧边栏模式：显示模块属性树
      return (
        <ModulePropertyTree
          key="module-properties"
          moduleGroups={groupedProperties.modules}
          editable={false} // 模块属性始终只读
          onEdit={onEdit}
        />
      );
    }
  };

  // 渲染系统属性
  const renderSystemProperties = () => {
    if (!showSystem || groupedProperties.system.length === 0) return null;

    return (
      <PropertyTable
        key="system-properties"
        title="系统属性"
        properties={groupedProperties.system}
        mode={mode}
        editable={false} // 系统属性始终只读
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    );
  };

  // 渲染自定义属性
  const renderCustomProperties = () => {
    if (groupedProperties.custom.length === 0) return null;

    return (
      <PropertyTable
        key="custom-properties"
        title="输出属性"
        properties={groupedProperties.custom}
        mode={mode}
        editable={editable}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    );
  };

  return (
    <div className={`property-display-manager property-display-manager--${mode}`}>
      {renderSystemProperties()}
      {renderEntityProperties()}
      {renderModuleProperties()}
      {renderCustomProperties()}
    </div>
  );
};
