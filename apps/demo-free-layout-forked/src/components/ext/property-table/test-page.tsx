import React, { useState } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Button, Space, Typography, Card, Divider } from '@douyinfe/semi-ui';

import { PropertyTableAdapter } from './property-table-adapter';

const { Title, Text } = Typography;

// 模拟数据
const mockJsonSchema: IJsonSchema = {
  type: 'object',
  properties: {
    nanoid1: {
      id: 'vehicle_yard_id',
      name: '集结点id',
      type: 'string',
      description: '载具所在的集结点标识符',
      enumClassId: 'yard_enum',
      _id: 'nanoid1',
      isEntityProperty: true,
    } as any,
    nanoid2: {
      id: 'task_id',
      name: '任务id',
      type: 'string',
      description: '当前执行的任务标识符',
      _id: 'nanoid2',
      isEntityProperty: true,
    } as any,
    nanoid3: {
      id: 'controlled/action_progress',
      name: '行为进度',
      type: 'number',
      description: '当前行为的执行进度',
      _id: 'nanoid3',
      isModuleProperty: true,
      moduleId: 'controlled',
    } as any,
    nanoid4: {
      id: 'mobile/path',
      name: '路径',
      type: 'array',
      items: { type: 'string' },
      description: '移动路径点列表',
      _id: 'nanoid4',
      isModuleProperty: true,
      moduleId: 'mobile',
    } as any,
    nanoid5: {
      id: 'custom_field',
      name: '自定义字段',
      type: 'string',
      description: '用户自定义的字段',
      _id: 'nanoid5',
    } as any,
  },
};

export const PropertyTableTestPage: React.FC = () => {
  const [schema, setSchema] = useState<IJsonSchema>(mockJsonSchema);

  const handleSchemaChange = (newSchema: IJsonSchema) => {
    console.log('Schema changed:', newSchema);
    setSchema(newSchema);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <Title heading={2}>PropertyTable 测试页面</Title>
      <Text type="secondary">测试PropertyTable组件的不同模式和功能</Text>

      <Divider />

      {/* 节点模式（只读） */}
      <Card
        title="节点模式（只读）"
        style={{ marginBottom: '24px' }}
        headerExtraContent={
          <Text type="tertiary" size="small">
            compact=true, isEditMode=false
          </Text>
        }
      >
        <PropertyTableAdapter
          value={schema}
          currentEntityId="vehicle"
          isEditMode={false}
          compact={true}
        />
      </Card>

      {/* 抽屉编辑模式 */}
      <Card
        title="抽屉编辑模式"
        headerExtraContent={
          <Text type="tertiary" size="small">
            compact=false, isEditMode=true
          </Text>
        }
      >
        <PropertyTableAdapter
          value={schema}
          onChange={handleSchemaChange}
          currentEntityId="vehicle"
          isEditMode={true}
          compact={false}
        />
      </Card>

      <Divider />

      {/* 调试信息 */}
      <Card title="当前Schema数据">
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(schema, null, 2)}</pre>
      </Card>
    </div>
  );
};
