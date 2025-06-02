import React, { useMemo, useCallback, useState } from 'react';

import { nanoid } from 'nanoid';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Modal, Input } from '@douyinfe/semi-ui';

import NodePropertyTable, { NodePropertyRowData } from './node-property-table';
import DrawerPropertyTable, { DrawerPropertyRowData } from './drawer-property-table';
import { useEntityStore } from '../entity-store';
import { useModuleStore } from '../entity-property-type-selector/module-store';

interface PropertyTableAdapterProps {
  // JSONSchema数据
  value?: IJsonSchema;
  // 数据变化回调
  onChange?: (value: IJsonSchema) => void;
  // 当前实体ID
  currentEntityId?: string;
  // 是否为编辑模式
  isEditMode?: boolean;
  // 是否紧凑模式
  compact?: boolean;
}

export const PropertyTableAdapter: React.FC<PropertyTableAdapterProps> = ({
  value,
  onChange,
  currentEntityId,
  isEditMode = false,
  compact = false,
}) => {
  const { getEntity } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  // 描述编辑状态
  const [editingDescription, setEditingDescription] = useState<{
    key: string;
    value: string;
  } | null>(null);

  const currentEntity = currentEntityId ? getEntity(currentEntityId) : null;
  const entityBundles = currentEntity?.bundles || [];

  // 预先获取所有模块信息，避免重复调用
  const allModules = useMemo(() => {
    const moduleIds = new Set<string>();

    // 收集所有模块ID
    Object.values(value?.properties || {}).forEach((property) => {
      const prop = property as any;
      if (prop.isModuleProperty && prop.moduleId) {
        moduleIds.add(prop.moduleId);
      }
    });

    // 添加实体关联的模块
    entityBundles.forEach((bundleId) => {
      if (typeof bundleId === 'string') {
        moduleIds.add(bundleId);
      }
    });

    // 一次性获取所有模块信息
    return getModulesByIds(Array.from(moduleIds));
  }, [value?.properties, entityBundles, getModulesByIds]);

  // 创建模块映射，提高查找效率
  const moduleMap = useMemo(() => {
    const map = new Map();
    allModules.forEach((module) => {
      map.set(module.id, module);
    });
    return map;
  }, [allModules]);

  // 转换属性数据为通用格式
  const commonProperties = useMemo(() => {
    const properties = value?.properties || {};
    const result: Array<{
      key: string;
      id: string;
      name: string;
      type: string;
      description?: string;
      category: 'entity' | 'module' | 'custom';
      moduleId?: string;
      moduleName?: string;
      isReadOnly?: boolean;
    }> = [];

    Object.entries(properties).forEach(([key, property]) => {
      const propertyData = property as any;

      // 获取基本信息
      const id = propertyData.id || key;
      const name = propertyData.name || propertyData.title || id;
      const type = propertyData.type || 'string';
      const description = propertyData.description;

      // 调试信息
      console.log('属性解析:', {
        key,
        id,
        原始name: propertyData.name,
        原始title: propertyData.title,
        最终name: name,
        propertyData,
      });

      // 确定分类和只读状态
      let category: 'entity' | 'module' | 'custom' = 'custom';
      let isReadOnly = false;
      let moduleId: string | undefined;
      let moduleName: string | undefined;

      if (propertyData.isEntityProperty) {
        category = 'entity';
        isReadOnly = false; // 实体属性可编辑
      } else if (propertyData.isModuleProperty && propertyData.moduleId) {
        category = 'module';
        moduleId = propertyData.moduleId;

        // 从预获取的模块映射中查找
        const module = moduleMap.get(moduleId);
        moduleName = module?.name || moduleId;

        // 判断是否只读：完整关联的模块属性只读，部分关联的可编辑
        isReadOnly = moduleId ? entityBundles.includes(moduleId) : false;
      } else {
        category = 'custom';
        isReadOnly = false; // 自定义属性可编辑
      }

      const rowData = {
        key: propertyData._id || key, // 使用_id作为唯一标识
        id,
        name,
        type,
        description,
        category,
        moduleId,
        moduleName,
        isReadOnly,
      };

      result.push(rowData);
    });

    return result;
  }, [value?.properties, entityBundles, moduleMap]);

  // 只在实体ID变化时打印一次EntityNodeData
  React.useEffect(() => {
    if (currentEntityId && value) {
      console.log('=== 选中实体时的EntityNodeData ===');
      console.log('EntityID:', currentEntityId);
      console.log('EntityNodeData:', value);
      console.log('Properties数量:', Object.keys(value.properties || {}).length);
      console.log('==================================');
    }
  }, [currentEntityId, value]);

  // 为节点表格准备模块数据
  const moduleData = useMemo(
    () =>
      entityBundles
        .filter((bundleId) => typeof bundleId === 'string')
        .map((bundleId) => {
          const module = moduleMap.get(bundleId);
          return {
            id: bundleId,
            name: module?.name || bundleId,
            attributeCount: module?.attributes?.length || 0,
          };
        }),
    [entityBundles, moduleMap]
  );

  // 转换为NodePropertyRowData格式
  const nodeProperties: NodePropertyRowData[] = useMemo(
    () =>
      commonProperties.map((prop) => ({
        key: prop.key,
        id: prop.id,
        name: prop.name,
        type: prop.type,
        category: prop.category,
        moduleId: prop.moduleId,
        moduleName: prop.moduleName,
        attributeCount: prop.category === 'module' ? 0 : undefined, // 节点模式不显示具体属性
      })),
    [commonProperties]
  );

  // 转换为DrawerPropertyRowData格式，包含分组逻辑
  const drawerProperties: DrawerPropertyRowData[] = useMemo(() => {
    const result: DrawerPropertyRowData[] = [];
    const modulePropsMap: Record<string, DrawerPropertyRowData[]> = {};

    // 分类属性
    const entityProps: DrawerPropertyRowData[] = [];
    const customProps: DrawerPropertyRowData[] = [];

    commonProperties.forEach((prop) => {
      let displayId: string | undefined;

      // 如果是模块属性，生成显示用的ID（去掉模块前缀）
      if (prop.category === 'module' && prop.moduleId && prop.id.includes('/')) {
        const parts = prop.id.split('/');
        displayId = parts[parts.length - 1]; // 取最后一部分作为显示ID
      }

      const rowData: DrawerPropertyRowData = {
        key: prop.key,
        id: prop.id, // 保留原始完整ID
        displayId: displayId, // 显示用的ID（如果是模块属性）
        name: prop.name,
        type: prop.type,
        description: prop.description,
        category: prop.category,
        moduleId: prop.moduleId,
        isReadOnly: prop.isReadOnly,
      };

      if (prop.category === 'entity') {
        entityProps.push(rowData);
      } else if (prop.category === 'custom') {
        customProps.push(rowData);
      } else if (prop.category === 'module' && prop.moduleId) {
        if (!modulePropsMap[prop.moduleId]) {
          modulePropsMap[prop.moduleId] = [];
        }
        modulePropsMap[prop.moduleId].push(rowData);
      }
    });

    // 添加实体属性（平铺显示）
    result.push(...entityProps);

    // 添加自定义属性（平铺显示）
    result.push(...customProps);

    // 添加模块属性（分组显示）
    Object.entries(modulePropsMap).forEach(([moduleId, moduleProps]) => {
      if (moduleProps.length > 0) {
        const module = moduleMap.get(moduleId);
        const moduleName = module?.name || moduleId;

        // 创建模块分组标题
        const moduleGroup: DrawerPropertyRowData = {
          key: `module-group-${moduleId}`,
          id: moduleId, // 显示模块ID
          name: moduleName, // 显示模块名称
          type: `${moduleProps.length}`, // 在类型列显示属性数量
          category: 'module',
          isReadOnly: true,
          children: moduleProps,
        };

        result.push(moduleGroup);
      }
    });

    return result;
  }, [commonProperties, moduleMap]);

  // 处理属性变化
  const handlePropertyChange = useCallback(
    (key: string, field: string, newValue: any) => {
      if (!value?.properties) return;

      const updatedProperties = { ...value.properties };

      // 找到对应的属性
      const propertyKey = Object.keys(updatedProperties).find((k) => {
        const prop = updatedProperties[k] as any;
        return prop._id === key || k === key;
      });

      if (propertyKey) {
        updatedProperties[propertyKey] = {
          ...updatedProperties[propertyKey],
          [field]: newValue,
        };

        const updatedSchema: IJsonSchema = {
          ...value,
          properties: updatedProperties,
        };

        onChange?.(updatedSchema);
      }
    },
    [value, onChange]
  );

  // 处理属性删除
  const handlePropertyDelete = useCallback(
    (key: string) => {
      if (!value?.properties) return;

      const updatedProperties = { ...value.properties };

      // 找到并删除对应的属性
      const propertyKey = Object.keys(updatedProperties).find((k) => {
        const prop = updatedProperties[k] as any;
        return prop._id === key || k === key;
      });

      if (propertyKey) {
        delete updatedProperties[propertyKey];

        const updatedSchema: IJsonSchema = {
          ...value,
          properties: updatedProperties,
        };

        onChange?.(updatedSchema);
      }
    },
    [value, onChange]
  );

  // 处理数据限制编辑
  const handleDataRestrictionEdit = useCallback((key: string) => {
    // TODO: 实现数据限制编辑逻辑
    console.log('Edit data restriction for:', key);
  }, []);

  // 处理模块编辑
  const handleModuleEdit = useCallback((moduleId: string) => {
    // TODO: 实现模块编辑逻辑
    console.log('Edit module:', moduleId);
  }, []);

  // 处理描述编辑
  const handleDescriptionEdit = useCallback(
    (key: string) => {
      // 找到对应的属性
      const property = commonProperties.find((prop) => prop.key === key);
      setEditingDescription({
        key,
        value: property?.description || '',
      });
    },
    [commonProperties]
  );

  // 保存描述
  const handleDescriptionSave = useCallback(() => {
    if (editingDescription) {
      handlePropertyChange(editingDescription.key, 'description', editingDescription.value);
      setEditingDescription(null);
    }
  }, [editingDescription, handlePropertyChange]);

  // 取消描述编辑
  const handleDescriptionCancel = useCallback(() => {
    setEditingDescription(null);
  }, []);

  // 根据模式选择合适的组件
  if (compact) {
    // 节点模式：使用NodePropertyTable
    return <NodePropertyTable properties={nodeProperties} modules={moduleData} />;
  } else {
    // 抽屉模式：使用DrawerPropertyTable
    return (
      <>
        <DrawerPropertyTable
          properties={drawerProperties}
          onPropertyChange={handlePropertyChange}
          onPropertyDelete={handlePropertyDelete}
          onDataRestrictionEdit={handleDataRestrictionEdit}
          onModuleEdit={handleModuleEdit}
          onDescriptionEdit={handleDescriptionEdit}
        />

        {/* 描述编辑Modal */}
        <Modal
          title="编辑属性描述"
          visible={editingDescription !== null}
          onOk={handleDescriptionSave}
          onCancel={handleDescriptionCancel}
          okText="保存"
          cancelText="取消"
          width={400}
        >
          <Input
            value={editingDescription?.value || ''}
            onChange={(value) =>
              setEditingDescription((prev) => (prev ? { ...prev, value } : null))
            }
            placeholder="请输入属性描述"
            autoFocus
          />
        </Modal>
      </>
    );
  }
};

export default PropertyTableAdapter;
