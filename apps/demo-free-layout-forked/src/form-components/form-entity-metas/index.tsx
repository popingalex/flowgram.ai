import React, { useContext } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { Input, Typography, Divider } from '@douyinfe/semi-ui';

import { FormItem } from '../form-item';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { useCloned } from '../../hooks/use-cloned';
import { useNodeRenderContext } from '../../hooks';
import { SidebarContext, IsSidebarContext } from '../../context';

const { Text } = Typography;

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
        <Text
          link={{ href: `/entities/${editingEntity.id}` }}
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '13px',
          }}
          title="点击跳转到实体详情页面"
        >
          {(editingEntity as any).$id || editingEntity.id || '未设置'}
        </Text>
      </FormItem>

      <FormItem name="实体名称" type="string">
        <Text
          link={{ href: `/entities/${editingEntity.id}` }}
          style={{
            fontSize: '13px',
          }}
          title="点击跳转到实体详情页面"
        >
          {(editingEntity as any).$name || editingEntity.name || '未设置'}
        </Text>
      </FormItem>

      <FormItem name="实体描述" type="string">
        <Text
          style={{
            fontSize: '13px',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {(editingEntity as any).$description || editingEntity.description || '无描述'}
        </Text>
      </FormItem>
    </>
  );
}
