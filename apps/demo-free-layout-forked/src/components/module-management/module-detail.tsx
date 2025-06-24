import React, { useCallback, useMemo, ReactNode } from 'react';

import { Typography, Input, Form } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { useCurrentModule, useCurrentModuleActions, useModuleStore } from '../../stores';
import { ModulePropertyTable } from './module-property-table';

const { Title } = Typography;

interface ModuleDetailProps {
  selectedModule: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
  actionButtons?: ReactNode;
  statusInfo?: ReactNode;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({
  selectedModule,
  canSave,
  onSave,
  onUndo,
  onDelete,
  actionButtons,
  statusInfo,
}) => {
  // 🔑 使用CurrentModuleStore的数据和状态
  const { editingModule, isDirty, isSaving } = useCurrentModule();
  const { updateProperty } = useCurrentModuleActions();

  // 🔑 使用CurrentModuleStore的editingModule作为数据源
  const currentModule = editingModule || selectedModule;

  // 🔑 字段更新 - 直接使用CurrentModuleStore的updateProperty
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 更新模块字段:', field, value);
      updateProperty(field, value);
    },
    [updateProperty]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 模块配置表单 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              模块ID *
            </div>
            <Input
              value={currentModule.id || ''}
              onChange={(value) => handleFieldChange('id', value)}
              placeholder="模块ID（必填）"
              validateStatus={!currentModule.id?.trim() ? 'error' : undefined}
              style={{
                flex: 1,
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '12px',
              }}
              data-testid="module-id-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              模块名称
            </div>
            <Input
              value={currentModule.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              placeholder="模块名称"
              style={{ flex: 1 }}
              data-testid="module-name-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              描述
            </div>
            <Input
              value={currentModule.desc || ''}
              onChange={(value) => handleFieldChange('desc', value)}
              placeholder="模块描述"
              style={{ flex: 1 }}
              data-testid="module-description-input"
            />
          </div>
        </div>
      </div>

      {/* 属性表格区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 模块属性表格 */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}>
            模块属性
          </div>
          <div style={{ flex: 1 }}>
            <ModulePropertyTable />
          </div>
        </div>
      </div>
    </div>
  );
};
