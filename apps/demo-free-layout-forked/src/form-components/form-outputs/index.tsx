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

  // 根据节点类型显示不同内容
  if (isStart && editingEntity?.attributes) {
    // 实体节点：显示实体属性的简化版本
    return (
      <div style={{ padding: '8px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '14px' }}>
            实体属性
          </Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {editingEntity.attributes.map((attr) => (
            <div
              key={attr.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                backgroundColor: 'var(--semi-color-fill-0)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <span style={{ fontFamily: 'monospace' }}>{attr.id}</span>
              <span
                style={{
                  padding: '1px 6px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px',
                }}
              >
                {attr.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // 非实体节点：不显示内容
    return null;
  }
}
