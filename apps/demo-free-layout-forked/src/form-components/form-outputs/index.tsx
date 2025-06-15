import React, { useMemo, useContext } from 'react';

import { nanoid } from 'nanoid';
import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { PropertiesEdit } from '../properties-edit';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useCloned } from '../../hooks/use-cloned';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { SidebarContext } from '../../context';
import {
  UnifiedDisplay as UnifiedPropertyDisplay,
  PropertyData,
} from '../../components/ext/entity-property-tables';
import { SidebarEditor as EditableEntityAttributeTable } from '../../components/ext/entity-property-tables';

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

    // 直接使用EditableEntityAttributeTable，它会从store获取数据
    return <EditableEntityAttributeTable />;
  }

  // 节点模式：显示只读的属性表格
  // 判断是否为Start节点
  const isStartNode = node?.type === 'start' || node?.type === 'FlowNodeEntity';

  // 🎯 获取当前实体状态，用于生成唯一key强制重新渲染
  const { editingEntity, isDirty } = useCurrentEntity();

  // 生成一个基于实体状态的key，当实体数据变化时强制重新渲染
  const renderKey = React.useMemo(() => {
    if (!editingEntity) return 'no-entity';
    return `entity-${editingEntity._indexId}-${isDirty ? 'dirty' : 'clean'}-${
      JSON.stringify(editingEntity.attributes || []).length
    }`;
  }, [editingEntity?._indexId, isDirty, editingEntity?.attributes?.length]);

  return (
    <Field name="data.outputs">
      {({ field: { value } }: FieldRenderProps<IJsonSchema>) => {
        // 转换数据为PropertyData格式
        const nodeProperties: PropertyData[] = useMemo(() => {
          const properties = value?.properties || {};

          const processedProperties = Object.entries(properties)
            .filter(([key, property]) => {
              const prop = property as any;

              // 在Start节点中，只显示实体的扩展属性
              // 基础属性（实体ID、名称、描述）已经在节点顶部显示了
              // 模块属性已经在"模块列表"部分单独展示，不在"扩展属性表"中重复显示
              if (isStartNode) {
                // 🎯 只显示实体属性，过滤掉模块属性（避免重复显示）
                return prop.isEntityProperty && !prop.isModuleProperty;
              }

              // 🎯 非Start节点：不显示实体属性，只显示节点自身的输出属性
              // 特别处理invoke节点和end节点，确保不显示实体属性
              if (node?.type === 'action' || node?.type === 'invoke' || node?.type === 'end') {
                return !prop.isEntityProperty && !prop.isModuleProperty;
              }

              // 其他节点的处理逻辑
              return !prop.isEntityProperty && !prop.isModuleProperty;
            })
            .map(([key, property]) => {
              const prop = property as any;
              return {
                key: prop._indexId || key,
                id: prop.id || key,
                name: prop.name || prop.title || prop.id || key,
                type: prop.type || 'string',
                description: prop.description,
                required: prop.isPropertyRequired,
              };
            });

          return processedProperties;
        }, [value, isStartNode, renderKey]); // 保持renderKey作为依赖，但不作为Field的key

        return <UnifiedPropertyDisplay properties={nodeProperties} mode="node" />;
      }}
    </Field>
  );
}
