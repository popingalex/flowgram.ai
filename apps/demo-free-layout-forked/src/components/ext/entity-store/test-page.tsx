import React from 'react';

import { Card, Typography, Tag, Spin, Descriptions } from '@douyinfe/semi-ui';

import { ModuleStoreProvider, useModuleStore } from '../entity-property-type-selector/module-store';
import { EntityStoreProvider, useEntityStore } from './index';

const { Title, Text } = Typography;

const EntityStoreTestContent: React.FC = () => {
  const { modules, loading: moduleLoading } = useModuleStore();
  const {
    entities,
    getEntityOwnAttributes,
    getEntityModuleAttributes,
    loading: entityLoading,
  } = useEntityStore();

  if (moduleLoading || entityLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载Store数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <Title heading={2}>实体Store测试页面</Title>

      {/* 模块列表 */}
      <Card title="模块列表" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {modules.map((module) => (
            <Card key={module.id} style={{ width: '300px' }}>
              <Title heading={4}>
                {module.name} ({module.id})
              </Title>
              <Text type="secondary">{module.description}</Text>
              <div style={{ marginTop: '12px' }}>
                <strong>属性 ({module.attributes.length}):</strong>
                <div style={{ marginTop: '8px' }}>
                  {module.attributes.map((attr) => (
                    <Tag key={attr.id} style={{ margin: '2px' }}>
                      {attr.name || attr.id}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* 实体列表 */}
      <Card title="实体列表">
        {entities.map((entity) => {
          const ownAttributes = getEntityOwnAttributes(entity);
          const moduleAttributes = getEntityModuleAttributes(entity);

          return (
            <Card key={entity.id} style={{ marginBottom: '16px' }}>
              <Title heading={4}>
                {entity.name} ({entity.id})
              </Title>

              <Descriptions row style={{ marginTop: '12px' }}>
                <Descriptions.Item itemKey="绑定模块">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {entity.bundle_ids.length > 0 ? (
                      entity.bundle_ids.map((bundleId) => (
                        <Tag key={bundleId} color="blue">
                          {bundleId}
                        </Tag>
                      ))
                    ) : (
                      <Text type="tertiary">无绑定模块</Text>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item itemKey="自身属性">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {ownAttributes.length > 0 ? (
                      ownAttributes.map((attr) => (
                        <Tag key={attr.id} color="green">
                          {attr.name || attr.id}
                        </Tag>
                      ))
                    ) : (
                      <Text type="tertiary">无自身属性</Text>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item itemKey="模块属性">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {moduleAttributes.length > 0 ? (
                      moduleAttributes.map((attr) => (
                        <Tag key={attr.id} color="orange">
                          {attr.name || attr.id}
                        </Tag>
                      ))
                    ) : (
                      <Text type="tertiary">无模块属性</Text>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item itemKey="总属性数量">
                  <Text strong>{entity.attributes.length}</Text>
                  <Text type="secondary">
                    {' '}
                    (自身: {ownAttributes.length}, 模块: {moduleAttributes.length})
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                <Text type="secondary">
                  🟢 绿色=实体自身属性(ID不含&apos;/&apos;), 🟠 橙色=模块属性(ID含&apos;/&apos;), 🔵
                  蓝色=绑定的模块
                </Text>
              </div>
            </Card>
          );
        })}
      </Card>
    </div>
  );
};

export const EntityStoreTestPage: React.FC = () => (
  <ModuleStoreProvider>
    <EntityStoreProvider>
      <EntityStoreTestContent />
    </EntityStoreProvider>
  </ModuleStoreProvider>
);
