import React, { useState } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Card, Typography, Space, Button } from '@douyinfe/semi-ui';

import { EntityStoreProvider } from '../entity-store';
import { EnumStoreProvider } from '../entity-property-type-selector/enum-store';
import { ModuleStoreProvider } from '../../../stores/module.store';
import { EntityPropertiesEditor } from './index';

const { Title, Text } = Typography;

export const EntityPropertiesEditorTestPage: React.FC = () => {
  const [schema, setSchema] = useState<IJsonSchema>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '名称',
        description: '实体名称',
      },
      age: {
        type: 'number',
        title: '年龄',
        description: '实体年龄',
      },
    },
  });

  const [selectedEntityId, setSelectedEntityId] = useState<string>('vehicle');

  const handleSchemaChange = (newSchema: IJsonSchema) => {
    setSchema(newSchema);
    console.log('Schema updated:', newSchema);
  };

  return (
    <EntityStoreProvider>
      <ModuleStoreProvider>
        <EnumStoreProvider>
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Card style={{ marginBottom: '24px' }}>
              <Title heading={3}>实体属性编辑器测试</Title>
              <Text type="secondary">
                测试EntityPropertiesEditor组件的功能，包括实体属性、模块属性和自定义属性的管理。
              </Text>
            </Card>

            <div style={{ display: 'flex', gap: '24px' }}>
              {/* 左侧：编辑器 */}
              <div style={{ flex: 1 }}>
                <EntityPropertiesEditor
                  value={schema}
                  onChange={handleSchemaChange}
                  currentEntityId={selectedEntityId}
                  onNavigateToModule={(moduleId) => {
                    console.log('Navigate to module:', moduleId);
                  }}
                />
              </div>

              {/* 右侧：预览和控制 */}
              <div style={{ width: '400px' }}>
                <Card style={{ marginBottom: '16px' }}>
                  <Title heading={5}>实体选择</Title>
                  <Space wrap>
                    <Button
                      type={selectedEntityId === 'vehicle' ? 'primary' : 'secondary'}
                      onClick={() => setSelectedEntityId('vehicle')}
                    >
                      车辆 (vehicle)
                    </Button>
                    <Button
                      type={selectedEntityId === 'slope' ? 'primary' : 'secondary'}
                      onClick={() => setSelectedEntityId('slope')}
                    >
                      边坡 (slope)
                    </Button>
                    <Button
                      type={selectedEntityId === 'debris_flow' ? 'primary' : 'secondary'}
                      onClick={() => setSelectedEntityId('debris_flow')}
                    >
                      泥石流 (debris_flow)
                    </Button>
                  </Space>
                </Card>

                <Card>
                  <Title heading={5}>当前Schema</Title>
                  <pre
                    style={{
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '400px',
                    }}
                  >
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                </Card>
              </div>
            </div>
          </div>
        </EnumStoreProvider>
      </ModuleStoreProvider>
    </EntityStoreProvider>
  );
};
