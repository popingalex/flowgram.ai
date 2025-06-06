import React, { useContext } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { Input, Typography, Divider } from '@douyinfe/semi-ui';

import { FormItem } from '../form-item';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useCloned } from '../../hooks/use-cloned';
import { useNodeRenderContext } from '../../hooks';
import { SidebarContext, IsSidebarContext } from '../../context';

interface FormEntityMetasProps {
  isSidebar?: boolean;
}

export function FormEntityMetas({ isSidebar }: FormEntityMetasProps) {
  // 自动检测是否在侧边栏中
  const contextIsSidebar = useContext(IsSidebarContext);
  const isInSidebar = isSidebar !== undefined ? isSidebar : contextIsSidebar;

  // 统一使用Zustand当前实体store
  const { editingEntity } = useCurrentEntity();
  const { updateProperty } = useCurrentEntityActions();

  // 处理meta字段变化
  const handleMetaChange = (field: string, value: string) => {
    if (!editingEntity) return;
    updateProperty(field, value);
  };

  if (!editingEntity) return null;

  return (
    <>
      <FormItem name="实体ID" type="string">
        <Input
          value={editingEntity.id || ''}
          onChange={(value) => handleMetaChange('id', value)}
          size="small"
          placeholder="实体ID"
          readonly={!isInSidebar}
        />
      </FormItem>

      <FormItem name="实体名称" type="string">
        <Input
          value={editingEntity.name || ''}
          onChange={(value) => handleMetaChange('name', value)}
          size="small"
          placeholder="实体名称"
          readonly={!isInSidebar}
        />
      </FormItem>

      <FormItem name="实体描述" type="string">
        <Input
          value={editingEntity.description || ''}
          onChange={(value) => handleMetaChange('description', value)}
          size="small"
          placeholder="实体描述"
          readonly={!isInSidebar}
        />
      </FormItem>
    </>
  );
}
