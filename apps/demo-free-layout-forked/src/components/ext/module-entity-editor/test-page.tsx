import React, { useState } from 'react';

import { Card, Typography, List, Space, Spin } from '@douyinfe/semi-ui';

import { EntityStoreProvider, useEntityStore } from '../entity-store';
import { ModuleStoreProvider, useModuleStore } from '../../../stores/module.store';
import { ModuleEntityEditor } from './index';

const { Title, Text } = Typography;

const ModuleEntityTestContent: React.FC = () => {
  const { entities, loading } = useEntityStore();
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧实体选择列表 */}
      <Card
        title="选择实体/模块"
        style={{ width: '300px', margin: '16px', marginRight: '8px' }}
        bodyStyle={{ padding: '8px' }}
      >
        <List
          dataSource={entities}
          renderItem={(entity) => (
            <List.Item
              style={{
                padding: '12px',
                border:
                  selectedEntity?.id === entity.id
                    ? '2px solid var(--semi-color-primary)'
                    : '1px solid var(--semi-color-border)',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor:
                  selectedEntity?.id === entity.id
                    ? 'var(--semi-color-primary-light-default)'
                    : 'white',
              }}
              onClick={() => setSelectedEntity(entity)}
            >
              <div>
                <Title heading={6} style={{ margin: 0 }}>
                  {entity.name}
                </Title>
                <Text type="secondary" size="small">
                  ID: {entity.id}
                </Text>
                <br />
                <Text size="small">属性: {entity.attributes.length} 个</Text>
                {entity.bundle_ids && entity.bundle_ids.length > 0 && (
                  <>
                    <br />
                    <Text size="small" type="tertiary">
                      模块: {entity.bundle_ids.join(', ')}
                    </Text>
                  </>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* 右侧编辑器 */}
      <div style={{ flex: 1, margin: '16px', marginLeft: '8px', overflow: 'auto' }}>
        <ModuleEntityEditor
          entity={selectedEntity}
          isModule={false} // 这里可以根据实际情况动态设置
          onChange={(updatedEntity) => {
            console.log('Entity updated:', updatedEntity);
            // TODO: 更新实体状态
          }}
        />
      </div>
    </div>
  );
};

export const ModuleEntityTestPage: React.FC = () => (
  <ModuleStoreProvider>
    <EntityStoreProvider>
      <ModuleEntityTestContent />
    </EntityStoreProvider>
  </ModuleStoreProvider>
);
