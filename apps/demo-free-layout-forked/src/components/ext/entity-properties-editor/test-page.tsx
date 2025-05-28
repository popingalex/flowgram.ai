import React, { useState } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Card, Typography, Space } from '@douyinfe/semi-ui';

import { EnumStoreProvider } from '../entity-property-type-selector/enum-store';
import { EntityPropertiesEditor } from './index';

const { Title, Text } = Typography;

export const EntityPropertiesEditorTestPage: React.FC = () => {
  const [schema, setSchema] = useState<IJsonSchema>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '姓名',
      },
      vehicleType: {
        type: 'string',
        description: '车辆类型',
      },
      age: {
        type: 'number',
        description: '年龄',
      },
    },
    required: ['name'],
  });

  return (
    <EnumStoreProvider>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Title heading={2}>实体属性编辑器测试</Title>
        <Text type="secondary">
          左侧编辑属性，右侧实时显示生成的Schema。字符串类型旁边会显示&quot;限&quot;按钮，点击可以配置枚举类
        </Text>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card title="属性编辑器" style={{ height: 'fit-content' }}>
            <EntityPropertiesEditor value={schema} onChange={setSchema} />
          </Card>

          <Card title="生成的Schema" style={{ height: 'fit-content' }}>
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: 16,
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.4,
                overflow: 'auto',
                maxHeight: 500,
                margin: 0,
              }}
            >
              {JSON.stringify(schema, null, 2)}
            </pre>
          </Card>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title heading={4}>使用说明</Title>
          <ul style={{ marginTop: 8, lineHeight: 1.6 }}>
            <li>添加字符串类型的属性，会在类型选择器旁显示&quot;限&quot;按钮</li>
            <li>点击&quot;限&quot;按钮打开数据限制弹窗</li>
            <li>在弹窗中可以选择现有的枚举类或创建新的枚举类</li>
            <li>选择枚举类后，只保存枚举类ID，枚举值从全局状态获取</li>
            <li>有枚举类时按钮会高亮显示</li>
            <li>可以点击&quot;无限制&quot;清除枚举类引用</li>
            <li>修改枚举类时，所有引用该枚举类的属性会自动更新</li>
            <li>枚举类数据存储在全局状态中，未来可与服务器同步</li>
          </ul>
        </div>
      </div>
    </EnumStoreProvider>
  );
};
