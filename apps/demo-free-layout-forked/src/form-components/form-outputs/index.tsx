import React, { useMemo } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { PropertyData } from '../../utils/property-data-manager';
import { useCurrentEntity } from '../../stores';
import { useNodeRenderContext } from '../../hooks';
import { IsSidebarContext } from '../../context';
import { UniversalPropertyTable } from '../../components/bt/universal-property-table';

export interface FormOutputsProps {
  // 移除isSidebar参数，自动判断位置
}

export function FormOutputs() {
  const { editingEntity } = useCurrentEntity();
  const { node } = useNodeRenderContext();

  // 🎯 自动判断组件所在位置
  const isSidebar = React.useContext(IsSidebarContext);

  // 获取节点信息

  const isStart = node.isStart;

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

  // 根据节点类型显示不同内容
  if (isStart) {
    // 实体节点：显示实体属性，去掉过滤，设置为只读
    return (
      <UniversalPropertyTable
        mode="node" // 始终使用node模式，确保只读
        editable={false} // 明确设置为不可编辑
        readonly={true} // 明确设置为只读
        showEntityProperties={true}
        showModuleProperties={false}
        entityTitle="实体属性"
      />
    );
  } else {
    // 非实体节点：不显示实体属性
    return null;
  }
}
