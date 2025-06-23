import React, { useCallback } from 'react';

import { Button, Space, Typography, Input, Card, Popconfirm } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { useCurrentModule, useCurrentModuleActions } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { ModulePropertyTable } from './module-property-table';

const { Text, Title } = Typography;

interface ModuleDetailProps {
  selectedModule: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({
  selectedModule,
  canSave,
  onSave,
  onUndo,
  onDelete,
}) => {
  // 🔑 使用CurrentModuleStore的数据和状态
  const { editingModule, isDirty, isSaving } = useCurrentModule();
  const { updateProperty, saveChanges, resetChanges } = useCurrentModuleActions();
  const { navigate } = useRouter();

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

  // 🔑 保存 - 使用CurrentModuleStore的saveChanges
  const handleSave = useCallback(async () => {
    try {
      await saveChanges();
      onSave(); // 通知父组件
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, [saveChanges, onSave]);

  // 🔑 撤销 - 使用CurrentModuleStore的resetChanges
  const handleUndo = useCallback(() => {
    resetChanges();
    onUndo(); // 通知父组件
  }, [resetChanges, onUndo]);

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 基本信息表单 */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <Title heading={5} style={{ margin: 0 }}>
              基本信息
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDirty && (
                <Text type="warning" size="small">
                  • 有未保存的修改
                </Text>
              )}
              {isSaving && (
                <Text type="secondary" size="small">
                  正在保存...
                </Text>
              )}
              <Space>
                <Button
                  icon={<IconSave />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={!canSave || !isDirty}
                  loading={isSaving}
                  type="primary"
                  size="small"
                >
                  保存
                </Button>
                <Button
                  icon={<IconUndo />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUndo();
                  }}
                  disabled={!isDirty}
                  size="small"
                >
                  撤销
                </Button>
                <Popconfirm
                  title="确定删除这个模块吗？"
                  content="删除后将无法恢复"
                  onConfirm={(e) => {
                    e?.stopPropagation?.();
                    onDelete();
                  }}
                >
                  <Button
                    icon={<IconDelete />}
                    type="danger"
                    theme="borderless"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
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
                style={{
                  flex: 1,
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                }}
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
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
              >
                描述
              </div>
              <Input
                value={currentModule.description || ''}
                onChange={(value) => handleFieldChange('description', value)}
                placeholder="模块描述"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* 属性表格区域 */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px' }}>
          <ModulePropertyTable />
        </div>
      </div>
    </Card>
  );
};
