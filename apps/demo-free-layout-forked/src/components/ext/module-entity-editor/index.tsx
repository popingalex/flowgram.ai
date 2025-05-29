import React, { useState } from 'react';

import { Card, Tabs, TabPane, Typography, Space, Button, Form } from '@douyinfe/semi-ui';
import { IconPlus, IconSetting } from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector';
import { useEntityStore, Entity } from '../entity-store';
import { useModuleStore } from '../entity-property-type-selector/module-store';
import { EntityPropertiesEditor } from '../entity-properties-editor';

const { Title, Text } = Typography;

interface ModuleEntityEditorProps {
  entity?: Entity;
  isModule?: boolean; // true表示这是模块编辑器，false表示实体编辑器
  onChange?: (entity: Entity) => void;
}

export const ModuleEntityEditor: React.FC<ModuleEntityEditorProps> = ({
  entity,
  isModule = false,
  onChange,
}) => {
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);
  const { getEntityOwnAttributes, getEntityModuleAttributes } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  if (!entity) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="tertiary">请选择要编辑的{isModule ? '模块' : '实体'}</Text>
        </div>
      </Card>
    );
  }

  // 获取实体的自身属性和模块属性
  const ownAttributes = getEntityOwnAttributes(entity);
  const moduleAttributes = getEntityModuleAttributes(entity);
  const boundModules = getModulesByIds(entity.bundle_ids);

  // 转换为JSONSchema格式
  const attributesToJsonSchema = (attributes: any[]) => {
    const properties: Record<string, any> = {};

    attributes.forEach((attr) => {
      properties[attr.id] = {
        type:
          attr.type === 'n'
            ? 'number'
            : attr.type === 's'
            ? 'string'
            : attr.type?.includes('[')
            ? 'array'
            : 'string',
        title: attr.name || attr.id,
        description: attr.description,
      };
    });

    return {
      type: 'object',
      properties,
    };
  };

  const handleOwnPropertiesChange = (value: any) => {
    // TODO: 更新实体的自身属性
    console.log('Own properties changed:', value);
    onChange?.({
      ...entity,
      // 这里需要将JSONSchema转换回属性数组格式
    });
  };

  const handleModuleSelectionConfirm = (selectedModuleIds: string[]) => {
    // TODO: 更新实体的模块绑定
    console.log('Module selection confirmed:', selectedModuleIds);
    onChange?.({
      ...entity,
      bundle_ids: selectedModuleIds,
    });
    setModuleSelectorVisible(false);
  };

  const editorTitle = isModule ? '模块编辑器' : '实体编辑器';

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title heading={4} style={{ margin: 0 }}>
                {editorTitle}: {entity.name}
              </Title>
              <Text type="secondary" size="small">
                ID: {entity.id}
              </Text>
            </div>
            {!isModule && (
              <Button icon={<IconPlus />} onClick={() => setModuleSelectorVisible(true)}>
                管理模块
              </Button>
            )}
          </div>
        }
        style={{ marginBottom: '16px' }}
      >
        {entity.description && <Text type="secondary">{entity.description}</Text>}

        {!isModule && entity.bundle_ids.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <Text size="small" strong>
              绑定的模块:
            </Text>
            <Space wrap style={{ marginTop: '4px' }}>
              {boundModules.map((module) => (
                <div
                  key={module.id}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid var(--semi-color-primary)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--semi-color-primary-light-default)',
                    fontSize: '12px',
                  }}
                >
                  {module.name} ({module.id})
                </div>
              ))}
            </Space>
          </div>
        )}
      </Card>

      <Card>
        <Tabs type="card">
          <TabPane
            tab={
              <span>
                <IconSetting />
                {isModule ? '模块属性' : '自身属性'} ({ownAttributes.length})
              </span>
            }
            itemKey="own"
          >
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              <EntityPropertiesEditor
                value={attributesToJsonSchema(ownAttributes)}
                onChange={handleOwnPropertiesChange}
                config={{
                  placeholder: isModule ? '输入模块属性名' : '输入实体属性名',
                  addButtonText: '添加属性',
                }}
              />
            </div>
          </TabPane>

          {!isModule && (
            <TabPane tab={`继承属性 (${moduleAttributes.length})`} itemKey="inherited">
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                {moduleAttributes.length > 0 ? (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="tertiary">以下属性来自绑定的模块，只读显示</Text>
                    </div>
                    {boundModules.map((module) => {
                      const moduleAttrs = moduleAttributes.filter((attr) =>
                        attr.id.startsWith(`${module.id}/`)
                      );

                      if (moduleAttrs.length === 0) return null;

                      return (
                        <Card
                          key={module.id}
                          title={`${module.name} (${moduleAttrs.length} 个属性)`}
                          style={{ marginBottom: '12px' }}
                        >
                          <Space wrap>
                            {moduleAttrs.map((attr) => (
                              <div
                                key={attr.id}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid var(--semi-color-border)',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--semi-color-fill-0)',
                                  fontSize: '12px',
                                }}
                              >
                                <div style={{ fontWeight: 'bold' }}>{attr.name || attr.id}</div>
                                <div style={{ color: 'var(--semi-color-text-2)' }}>
                                  {attr.type || 'string'}
                                </div>
                                {attr.description && (
                                  <div
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--semi-color-text-2)',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {attr.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </Space>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="tertiary">
                      无继承属性，点击&quot;管理模块&quot;按钮添加模块以获得更多属性
                    </Text>
                  </div>
                )}
              </div>
            </TabPane>
          )}

          <TabPane tab={`总览 (${entity.attributes.length})`} itemKey="overview">
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <Title heading={5}>属性统计</Title>
                <Space>
                  <Text>
                    自身属性: <Text strong>{ownAttributes.length}</Text>
                  </Text>
                  {!isModule && (
                    <Text>
                      继承属性: <Text strong>{moduleAttributes.length}</Text>
                    </Text>
                  )}
                  <Text>
                    总计: <Text strong>{entity.attributes.length}</Text>
                  </Text>
                </Space>
              </div>

              <Title heading={5}>所有属性列表</Title>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '12px',
                }}
              >
                {entity.attributes.map((attr) => {
                  const isOwn = !attr.id.includes('/');
                  return (
                    <div
                      key={attr.id}
                      style={{
                        padding: '12px',
                        border: `1px solid ${
                          isOwn ? 'var(--semi-color-success)' : 'var(--semi-color-warning)'
                        }`,
                        borderRadius: '6px',
                        backgroundColor: isOwn
                          ? 'var(--semi-color-success-light-default)'
                          : 'var(--semi-color-warning-light-default)',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {attr.name || attr.id}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--semi-color-text-2)',
                          marginBottom: '4px',
                        }}
                      >
                        ID: {attr.id}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--semi-color-text-2)',
                          marginBottom: '4px',
                        }}
                      >
                        类型: {attr.type || 'string'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--semi-color-text-3)' }}>
                        来源: {isOwn ? (isModule ? '模块定义' : '实体定义') : '继承自模块'}
                      </div>
                      {attr.description && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--semi-color-text-2)',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}
                        >
                          {attr.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 模块选择器 */}
      <ModuleSelectorModal
        visible={moduleSelectorVisible}
        selectedModuleIds={entity.bundle_ids}
        onConfirm={handleModuleSelectionConfirm}
        onCancel={() => setModuleSelectorVisible(false)}
      />
    </div>
  );
};
