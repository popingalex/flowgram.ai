import React, { useMemo } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Typography } from '@douyinfe/semi-ui';

import { PropertyData } from '../../utils/property-data-manager';
import { useCurrentEntity } from '../../stores';
import { useNodeRenderContext } from '../../hooks';
import { IsSidebarContext } from '../../context';

const { Text } = Typography;

export interface FormOutputsProps {
  // 移除isSidebar参数，自动判断位置
}

export function FormOutputs() {
  const { editingEntity } = useCurrentEntity();
  const { node } = useNodeRenderContext();

  // 自动判断组件所在位置
  const isSidebar = React.useContext(IsSidebarContext);
  const isStart = node.isStart;

  // 实体不再支持属性，直接返回null
  return null;
}
