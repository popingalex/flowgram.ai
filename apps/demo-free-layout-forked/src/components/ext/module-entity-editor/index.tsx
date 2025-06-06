import React, { useState, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Card, Tabs, TabPane, Typography, Space, Button, Form, Divider } from '@douyinfe/semi-ui';
import { IconPlus, IconSetting, IconArrowLeft } from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector';
import { useEntityStore, Entity, Attribute } from '../entity-store';
import { EntityPropertiesEditor } from '../entity-properties-editor';
import { useModuleStore, Module } from '../../../stores/module.store';

const { Title, Text } = Typography;

interface ModuleEntityEditorProps {
  entity?: Entity;
  isModule?: boolean; // true表示这是模块编辑器，false表示实体编辑器
  onChange?: (entity: Entity) => void;
  focusModuleId?: string;
  onReturn?: () => void;
}

export const ModuleEntityEditor: React.FC<ModuleEntityEditorProps> = ({
  entity,
  isModule = false,
  onChange,
  focusModuleId,
  onReturn,
}) => {
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string | undefined>(focusModuleId);

  const { getEntityOwnAttributes, getEntityModuleAttributes } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  useEffect(() => {
    setActiveTab(focusModuleId);
  }, [focusModuleId]);

  if (!entity) {
    return (
      <Card>
        <Text>请先选择一个实体或模块</Text>
      </Card>
    );
  }

  const { id, name, description, bundles } = entity;

  const handleEntityChange = (field: keyof Entity, value: any) => {
    if (onChange) {
      onChange({ ...entity, [field]: value });
    }
  };

  const handleSchemaChange = (newSchema: IJsonSchema, bundleId?: string) => {
    const properties = newSchema.properties || {};

    // 将JSONSchema转换回实体或模块的属性格式
    const newAttributes: Attribute[] = Object.values(properties).map((prop: any) => ({
      _indexId: prop._indexId || nanoid(), // 保持或生成唯一索引
      id: prop.id,
      name: prop.name || prop.title,
      type: prop.type,
      description: prop.description,
      isEntityProperty: prop.isEntityProperty,
      isModuleProperty: prop.isModuleProperty,
      moduleId: prop.moduleId,
      enumClassId: prop.enumClassId,
    }));

    if (isModule) {
      // 如果是模块编辑器，直接更新自身属性
      handleEntityChange('attributes', newAttributes);
    } else {
      // 如果是实体编辑器，需要区分是实体自身属性还是模块属性
      if (bundleId) {
        // 更新某个模块的属性
        const otherBundles = entity.bundles.filter(
          (b) => typeof b !== 'object' || b.id !== bundleId
        );
        const targetBundle = entity.bundles.find(
          (b) => typeof b === 'object' && b.id === bundleId
        ) as Module;
        if (targetBundle) {
          const updatedBundle = { ...targetBundle, attributes: newAttributes };
          handleEntityChange('bundles', [...otherBundles, updatedBundle]);
        }
      } else {
        // 更新实体自身属性
        const entityAttributes = newAttributes.filter((attr) => attr.isEntityProperty);
        const moduleAttributesInEntity =
          entity.attributes?.filter((attr) => !attr.isEntityProperty) || [];
        handleEntityChange('attributes', [...entityAttributes, ...moduleAttributesInEntity]);
      }
    }
  };

  const handleOpenModuleSelector = () => {
    setModuleSelectorVisible(true);
  };

  const handleModuleSelectionConfirm = (selectedModuleIds: string[]) => {
    // 这里的逻辑可能需要根据Module的完整定义来调整
    // 假设 getModulesByIds 返回完整的模块对象
    const selectedModules = getModulesByIds(selectedModuleIds);
    handleEntityChange('bundles', selectedModules);
    setModuleSelectorVisible(false);
  };

  const handleModuleSelectionCancel = () => {
    setModuleSelectorVisible(false);
  };

  const editorTitle = isModule ? '模块编辑器' : '实体编辑器';

  return (
    <div style={{ padding: '1px' }}>
      {onReturn && (
        <Button onClick={onReturn} icon={<IconArrowLeft />} style={{ marginBottom: '16px' }}>
          返回
        </Button>
      )}
      <Title heading={4} style={{ marginBottom: '20px' }}>
        {editorTitle}
      </Title>

      <Form layout="vertical">
        <Form.Input
          field="name"
          label="名称"
          value={name}
          onChange={(value) => handleEntityChange('name', value)}
        />
        <Form.TextArea
          field="description"
          label="描述"
          value={description}
          onChange={(value) => handleEntityChange('description', value)}
        />
      </Form>

      <Divider />

      {/* 实体自身属性编辑器 */}
      {!isModule && (
        <div style={{ marginBottom: '24px' }}>
          <Title heading={5} style={{ marginBottom: '16px' }}>
            实体属性
          </Title>
          <EntityPropertiesEditor
            schema={getEntityOwnAttributes(entity)}
            onChange={(newSchema) => handleSchemaChange(newSchema)}
          />
        </div>
      )}

      <Divider />

      {/* 模块属性编辑器 */}
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title heading={5}>模块属性</Title>
          {!isModule && (
            <Button icon={<IconSetting />} onClick={handleOpenModuleSelector}>
              配置关联模块
            </Button>
          )}
        </Space>
      </div>

      <Tabs type="card" activeKey={activeTab} onChange={(key) => setActiveTab(key)} collapsible>
        {bundles?.map((bundle) => {
          const bundleId = typeof bundle === 'string' ? bundle : bundle.id;
          const moduleFromStore = getModulesByIds([bundleId])[0];

          if (!moduleFromStore) return null;

          const moduleSchema = getEntityModuleAttributes(entity, bundleId);

          return (
            <TabPane tab={moduleFromStore.name || bundleId} itemKey={bundleId} key={bundleId}>
              <EntityPropertiesEditor
                schema={moduleSchema}
                onChange={(newSchema) => handleSchemaChange(newSchema, bundleId)}
                readonly={!isModule} // 在实体编辑器中，模块属性是只读的
              />
            </TabPane>
          );
        })}
      </Tabs>

      {!isModule && (
        <ModuleSelectorModal
          visible={moduleSelectorVisible}
          onConfirm={handleModuleSelectionConfirm}
          onCancel={handleModuleSelectionCancel}
          initialSelectedIds={bundles?.map((b) => (typeof b === 'string' ? b : b.id)) || []}
        />
      )}
    </div>
  );
};
