import React, { useContext } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Input, Space, Tag, Typography } from '@douyinfe/semi-ui';

import { useEntityListActions } from '../../stores';
import { SidebarContext } from '../../context';
import { useEntityStore } from '../../components/ext/entity-store';

const { Text } = Typography;

interface EntityFormProps {
  name: string;
}

interface EntityData {
  id?: string;
  name?: string;
  description?: string;
}

export function EntityForm({ name }: EntityFormProps) {
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntity } = useEntityStore();

  // 获取实体数据
  const { getEntityByStableId } = useEntityListActions();
  const currentEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;

  return (
    <Field name={name}>
      {({ field }) => {
        const entityData: EntityData = field.value || {};

        const handleChange = (key: keyof EntityData, value: string) => {
          field.onChange({
            ...entityData,
            [key]: value,
          });
        };

        // 如果有选中的实体，显示实体信息；否则显示输入框
        if (currentEntity) {
          return (
            <div style={{ padding: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: 'var(--semi-color-text-1)',
                    }}
                  >
                    实体ID
                  </label>
                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                      border: '1px solid var(--semi-color-border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--semi-color-text-0)',
                    }}
                  >
                    {currentEntity.id}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: 'var(--semi-color-text-1)',
                    }}
                  >
                    实体名称
                  </label>
                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                      border: '1px solid var(--semi-color-border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--semi-color-text-0)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {currentEntity.name}
                    {currentEntity.deprecated && (
                      <Tag color="red" size="small">
                        已废弃
                      </Tag>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: 'var(--semi-color-text-1)',
                    }}
                  >
                    实体描述
                  </label>
                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                      border: '1px solid var(--semi-color-border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--semi-color-text-0)',
                      minHeight: '32px',
                    }}
                  >
                    {currentEntity.description || (
                      <Text type="tertiary" style={{ fontSize: '12px' }}>
                        无描述
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // 如果没有选中实体，显示原来的输入框
        return (
          <div style={{ padding: '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体ID
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体ID"
                  value={entityData.id || ''}
                  onChange={(value) => handleChange('id', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体名称
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体名称"
                  value={entityData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体描述
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体描述"
                  value={entityData.description || ''}
                  onChange={(value) => handleChange('description', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        );
      }}
    </Field>
  );
}
