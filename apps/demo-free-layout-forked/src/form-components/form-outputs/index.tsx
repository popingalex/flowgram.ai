import React, { useContext } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Input, Typography, Divider } from '@douyinfe/semi-ui';

import { useIsSidebar } from '../../hooks';
import { SidebarContext } from '../../context';
import { PropertyTableAdapter } from '../../components/ext/property-table/property-table-adapter';
import { useEntityStore } from '../../components/ext/entity-store';

const { Text } = Typography;

export function FormOutputs() {
  const isSidebar = useIsSidebar();
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntity } = useEntityStore();

  if (isSidebar) {
    return null;
  }

  const currentEntity = selectedEntityId ? getEntity(selectedEntityId) : null;

  return (
    <div>
      {/* 实体Meta信息 - 表单形式 */}
      {currentEntity && (
        <>
          <div style={{ padding: '8px 0', marginBottom: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              实体信息
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>ID</div>
                <Input value={currentEntity.id} readonly size="small" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>名称</div>
                <Input value={currentEntity.name} readonly size="small" />
              </div>
              {currentEntity.description && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>描述</div>
                  <Input value={currentEntity.description} readonly size="small" />
                </div>
              )}
            </div>
          </div>
          <Divider margin="8px" />
        </>
      )}

      {/* 属性信息 - 表格形式 */}
      <Field name="data.outputs">
        {({ field: { value } }: FieldRenderProps<IJsonSchema>) => (
          <PropertyTableAdapter
            value={value}
            currentEntityId={selectedEntityId ?? undefined}
            isEditMode={false} // 节点模式，只读
            compact={true} // 紧凑模式
          />
        )}
      </Field>
    </div>
  );
}
