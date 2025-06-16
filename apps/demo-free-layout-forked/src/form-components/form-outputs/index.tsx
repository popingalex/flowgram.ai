import React, { useMemo } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { PropertyData } from '../../utils/property-data-manager';
import { useCurrentEntity } from '../../stores/current-entity.store';
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
    // 实体节点：显示实体属性
    return (
      <UniversalPropertyTable
        mode={isSidebar ? 'sidebar' : 'node'}
        editable={isSidebar}
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
