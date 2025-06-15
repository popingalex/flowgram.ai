import React, { useMemo } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { PropertyData } from '../../utils/property-data-manager';
import { useCurrentEntity } from '../../stores/current-entity.store';
import { useNodeRenderContext } from '../../hooks';
import { IsSidebarContext } from '../../context';
import { PropertyDisplayManager } from '../../components/ext/property-system/PropertyDisplayManager';
import { SidebarEditor as EditableEntityAttributeTable } from '../../components/ext/entity-property-tables';

export interface FormOutputsProps {
  // 移除isSidebar参数，自动判断位置
}

export function FormOutputs() {
  const { editingEntity } = useCurrentEntity();
  const { node } = useNodeRenderContext();

  // 🎯 自动判断组件所在位置
  const isSidebar = React.useContext(IsSidebarContext);

  // 获取节点信息
  const nodeType = node?.type || 'unknown';
  const isStartNode = nodeType === 'start' || nodeType === 'FlowNodeEntity';

  // 属性编辑处理（仅侧边栏使用）
  const handleEdit = (property: PropertyData) => {
    // TODO: 实现属性编辑逻辑
  };

  const handleDelete = (property: PropertyData) => {
    // TODO: 实现属性删除逻辑
  };

  const handleSelect = (properties: PropertyData[]) => {
    // TODO: 实现属性选择逻辑
  };

  if (isSidebar) {
    // 侧边栏模式：使用原来的完整编辑器
    return <EditableEntityAttributeTable readonly={false} />;
  }

  // 节点模式：使用新的PropertyDisplayManager，纯只读
  return (
    <Field name="data.outputs">
      {({ field: { value } }: FieldRenderProps<IJsonSchema>) => (
        <PropertyDisplayManager
          dataSource="schema"
          schema={value}
          mode="node"
          nodeType={nodeType}
          editable={false}
          showModules={isStartNode}
          showSystem={isStartNode}
          // 节点模式不传递编辑回调，确保纯只读
        />
      )}
    </Field>
  );
}
