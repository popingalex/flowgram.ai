import React, { useMemo, useContext } from 'react';

import { nanoid } from 'nanoid';
import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { PropertiesEdit } from '../properties-edit';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores/current-entity-fixed';
import { useCloned } from '../../hooks/use-cloned';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { SidebarContext } from '../../context';
import {
  EntityAttributeTable,
  EntityAttributeData,
} from '../../components/ext/property-table/entity-attribute-table';
import {
  EditableEntityAttributeTable,
  EditableEntityAttribute,
} from '../../components/ext/editable-entity-attribute-table';

interface FormOutputsProps {
  isSidebar?: boolean;
}

export function FormOutputs({ isSidebar: propIsSidebar }: FormOutputsProps = {}) {
  const hookIsSidebar = useIsSidebar();
  const isSidebar = propIsSidebar !== undefined ? propIsSidebar : hookIsSidebar;
  const { node } = useNodeRenderContext();

  // 抽屉模式：显示可编辑的属性表格
  if (isSidebar) {
    // 使用原有store，直接修改属性
    const { editingEntity } = useCurrentEntity();

    if (!editingEntity) {
      return <div>No entity selected</div>;
    }

    // 转换存储格式到显示格式
    const attributes: EditableEntityAttribute[] =
      editingEntity.attributes?.map((attr) => ({
        _indexId: (attr as any)._indexId || nanoid(),
        id: attr.id,
        name: attr.name || '',
        type: attr.type === 's' ? 'string' : attr.type === 'n' ? 'number' : attr.type || 'string',
        description: attr.description,
        enumClassId: attr.enumClassId,
        isEntityProperty: (attr as any).isEntityProperty,
        isModuleProperty: (attr as any).isModuleProperty,
        moduleId: (attr as any).moduleId,
      })) || [];

    return (
      <EditableEntityAttributeTable
        attributes={attributes}
        onChange={() => {
          // 现在直接修改属性，不需要这个callback
        }}
      />
    );
  }

  // 判断是否为Start节点
  const isStartNode = node?.type === 'start' || node?.type === 'FlowNodeEntity';

  return (
    <Field name="data.outputs">
      {({ field: { value } }: FieldRenderProps<IJsonSchema>) => {
        // 转换数据为EntityAttributeData格式
        const nodeAttributes: EntityAttributeData[] = useMemo(() => {
          const properties = value?.properties || {};

          return Object.entries(properties)
            .filter(([key, property]) => {
              const prop = property as any;

              // 在Start节点中，显示：
              // 1. meta属性（基础属性：id/name/description）- 通过key识别
              // 2. entity属性（扩展属性）
              // 3. 模块分组（不显示具体的模块属性）
              if (isStartNode) {
                // meta属性：通过key识别
                const isMetaProperty = key.startsWith('__entity_');

                // 显示meta属性和entity属性，不显示模块具体属性
                return (
                  isMetaProperty ||
                  prop.isEntityProperty ||
                  (prop.isModuleProperty && !prop.id?.includes('/'))
                );
              }
              return true;
            })
            .map(([key, property]) => {
              const prop = property as any;
              return {
                key: prop._indexId || key,
                id: prop.id || key,
                name: prop.name || prop.title || prop.id || key,
                type: prop.type || 'string',
                description: prop.description,
              };
            });
        }, [value, isStartNode]);

        return <EntityAttributeTable attributes={nodeAttributes} />;
      }}
    </Field>
  );
}
