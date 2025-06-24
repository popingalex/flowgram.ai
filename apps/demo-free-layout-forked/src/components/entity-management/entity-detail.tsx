import React, { useCallback, useMemo, useRef, ReactNode } from 'react';

import { Typography, Input, Button, Badge, Form } from '@douyinfe/semi-ui';

import { UniversalPropertyTable } from '../bt/universal-property-table';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';

const { Title } = Typography;

interface EntityDetailProps {
  selectedEntity: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
  // 新增参数
  actionButtons?: ReactNode;
  statusInfo?: ReactNode;
}

export const EntityDetail: React.FC<EntityDetailProps> = ({
  selectedEntity,
  canSave,
  onSave,
  onUndo,
  onDelete,
  actionButtons,
  statusInfo,
}) => {
  // 🔑 使用CurrentEntityStore的数据和状态
  const { editingEntity, isDirty, isSaving } = useCurrentEntity();
  const { updateProperty } = useCurrentEntityActions();

  // 🔑 使用CurrentEntityStore的editingEntity作为数据源
  const currentEntity = editingEntity || selectedEntity;

  // 🔑 字段更新 - 直接使用CurrentEntityStore的updateProperty
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 更新实体字段:', field, value);
      updateProperty(field, value);
    },
    [updateProperty]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 实体配置表单 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              实体ID *
            </div>
            <Input
              value={currentEntity.id || ''}
              onChange={(value) => handleFieldChange('id', value)}
              placeholder="实体ID（必填）"
              validateStatus={!currentEntity.id?.trim() ? 'error' : undefined}
              style={{
                flex: 1,
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '12px',
              }}
              data-testid="entity-id-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              实体名称
            </div>
            <Input
              value={currentEntity.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              placeholder="实体名称"
              style={{ flex: 1 }}
              data-testid="entity-name-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              描述
            </div>
            <Input
              value={currentEntity.description || ''}
              onChange={(value) => handleFieldChange('description', value)}
              placeholder="实体描述"
              style={{ flex: 1 }}
              data-testid="entity-description-input"
            />
          </div>
        </div>
      </div>

      {/* 属性表格区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 实体属性表格 */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}>
            实体属性
          </div>
          <div style={{ flex: 1 }}>
            <UniversalPropertyTable
              mode="sidebar"
              editable={true}
              showEntityProperties={true}
              showModuleProperties={false}
              entityTitle="实体属性"
              moduleTitle="模块属性"
              hideInternalTitles={true}
            />
          </div>
        </div>

        {/* 模块关联表格 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px' }}>
          <div style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}>
            关联模块
          </div>
          <div style={{ flex: 1 }}>
            <UniversalPropertyTable
              mode="sidebar"
              editable={false}
              showEntityProperties={false}
              showModuleProperties={true}
              entityTitle="实体属性"
              moduleTitle="模块关联"
              hideInternalTitles={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
