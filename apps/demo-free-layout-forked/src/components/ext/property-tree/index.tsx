import React, { useState, useMemo } from 'react';

import { VariableTypeIcons, ArrayIcons } from '@flowgram.ai/form-materials';
import { Tree, Typography, Space, Button, Tooltip } from '@douyinfe/semi-ui';
import { IconChevronDown, IconChevronRight, IconEdit, IconPlus } from '@douyinfe/semi-icons';

import { useEntityStore } from '../entity-store';
import { useModuleStore } from '../entity-property-type-selector/module-store';

const { Text } = Typography;

interface PropertyTreeProps {
  // 当前实体ID
  currentEntityId?: string;
  // 属性数据
  value?: any;
  // 是否为编辑模式
  isEditMode?: boolean;
  // 编辑回调
  onChange?: (value: any) => void;
}

interface TreeNodeData {
  key: string;
  label: React.ReactNode;
  children?: TreeNodeData[];
  isLeaf?: boolean;
  data?: any;
}

export const PropertyTree: React.FC<PropertyTreeProps> = ({
  currentEntityId,
  value,
  isEditMode = false,
  onChange,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([
    'entity-meta',
    'entity-props',
    'module-props',
    'custom-props',
  ]);
  const { getEntity, getEntityOwnAttributes, getEntityModuleAttributes } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  const currentEntity = currentEntityId ? getEntity(currentEntityId) : null;

  // 构建树形数据
  const treeData = useMemo((): TreeNodeData[] => {
    const result: TreeNodeData[] = [];

    if (!currentEntity) return result;

    // 1. 实体Meta信息节点
    result.push({
      key: 'entity-meta',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ color: 'var(--semi-color-primary)' }}>
            {currentEntity.name} ({currentEntity.id})
          </Text>
          <Text type="tertiary" size="small">
            实体信息
          </Text>
        </div>
      ),
      children: [
        {
          key: 'entity-meta-desc',
          label: (
            <Text type="secondary" size="small">
              {currentEntity.description || '无描述'}
            </Text>
          ),
          isLeaf: true,
        },
        {
          key: 'entity-meta-bundles',
          label: (
            <Text type="secondary" size="small">
              关联模块: {currentEntity.bundles?.join(', ') || '无'}
            </Text>
          ),
          isLeaf: true,
        },
      ],
    });

    // 2. 实体属性节点
    const entityAttributes = getEntityOwnAttributes(currentEntity);
    if (entityAttributes.length > 0) {
      result.push({
        key: 'entity-props',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>实体属性</Text>
            <Text type="tertiary" size="small">
              ({entityAttributes.length}个)
            </Text>
            {isEditMode && <Button size="small" theme="borderless" icon={<IconPlus />} />}
          </div>
        ),
        children: entityAttributes.map((attr) => ({
          key: `entity-${attr.id}`,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {/* 类型图标 */}
              <span style={{ flexShrink: 0 }}>
                {attr.type === 'array' || attr.type?.includes('[')
                  ? ArrayIcons[attr.type?.replace(/\[|\]/g, '') || 'string'] || ArrayIcons.string
                  : VariableTypeIcons[
                      attr.type === 's'
                        ? 'string'
                        : attr.type === 'n'
                        ? 'number'
                        : attr.type || 'string'
                    ] || VariableTypeIcons.string}
              </span>
              {/* 属性名称 */}
              <Text strong style={{ flexGrow: 1 }}>
                {attr.name}
              </Text>
              {/* 类型文本 */}
              <Text type="tertiary" size="small" style={{ flexShrink: 0 }}>
                {attr.type === 's' ? 'string' : attr.type === 'n' ? 'number' : attr.type}
              </Text>
              {/* 编辑按钮 */}
              {isEditMode && <Button size="small" theme="borderless" icon={<IconEdit />} />}
            </div>
          ),
          isLeaf: true,
          data: attr,
        })),
      });
    }

    // 3. 模块属性节点
    const moduleAttributes = getEntityModuleAttributes(currentEntity);
    if (moduleAttributes.length > 0) {
      // 按模块分组
      const moduleGroups: Record<string, any[]> = {};
      moduleAttributes.forEach((attr) => {
        const moduleId = attr.id.includes('/') ? attr.id.split('/')[0] : 'unknown';
        if (!moduleGroups[moduleId]) {
          moduleGroups[moduleId] = [];
        }
        moduleGroups[moduleId].push(attr);
      });

      result.push({
        key: 'module-props',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>模块属性</Text>
            <Text type="tertiary" size="small">
              ({moduleAttributes.length}个)
            </Text>
          </div>
        ),
        children: Object.entries(moduleGroups).map(([moduleId, attrs]) => {
          const modules = getModulesByIds([moduleId]);
          const moduleName = modules[0]?.name || moduleId;

          return {
            key: `module-${moduleId}`,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ color: 'var(--semi-color-info)' }}>
                  {moduleName}
                </Text>
                <Text type="tertiary" size="small">
                  ({attrs.length}个属性)
                </Text>
              </div>
            ),
            children: attrs.map((attr) => ({
              key: `module-${moduleId}-${attr.id}`,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  {/* 类型图标 */}
                  <span style={{ flexShrink: 0 }}>
                    {attr.type === 'array' || attr.type?.includes('[')
                      ? ArrayIcons[attr.type?.replace(/\[|\]/g, '') || 'string'] ||
                        ArrayIcons.string
                      : VariableTypeIcons[
                          attr.type === 's'
                            ? 'string'
                            : attr.type === 'n'
                            ? 'number'
                            : attr.type || 'string'
                        ] || VariableTypeIcons.string}
                  </span>
                  {/* 属性名称 */}
                  <Text style={{ flexGrow: 1 }}>{attr.name}</Text>
                  {/* 类型文本 */}
                  <Text type="tertiary" size="small" style={{ flexShrink: 0 }}>
                    {attr.type === 's' ? 'string' : attr.type === 'n' ? 'number' : attr.type}
                  </Text>
                  {/* 只读标识 */}
                  <Text type="tertiary" size="small" style={{ flexShrink: 0 }}>
                    只读
                  </Text>
                </div>
              ),
              isLeaf: true,
              data: attr,
            })),
          };
        }),
      });
    }

    // 4. 自定义属性节点（如果有的话）
    const properties = value?.properties || {};
    const customProps = Object.entries(properties).filter(
      ([key, prop]: [string, any]) => !prop.isEntityProperty && !prop.isModuleProperty
    );

    if (customProps.length > 0) {
      result.push({
        key: 'custom-props',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>自定义属性</Text>
            <Text type="tertiary" size="small">
              ({customProps.length}个)
            </Text>
            {isEditMode && <Button size="small" theme="borderless" icon={<IconPlus />} />}
          </div>
        ),
        children: customProps.map(([key, prop]: [string, any]) => ({
          key: `custom-${key}`,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {/* 类型图标 */}
              <span style={{ flexShrink: 0 }}>
                {prop.type === 'array'
                  ? ArrayIcons[prop.items?.type || 'string'] || ArrayIcons.string
                  : VariableTypeIcons[prop.type] || VariableTypeIcons.string}
              </span>
              {/* 属性名称 */}
              <Text style={{ flexGrow: 1 }}>{prop.name || prop.title || key}</Text>
              {/* 类型文本 */}
              <Text type="tertiary" size="small" style={{ flexShrink: 0 }}>
                {prop.type}
              </Text>
              {/* 编辑按钮 */}
              {isEditMode && <Button size="small" theme="borderless" icon={<IconEdit />} />}
            </div>
          ),
          isLeaf: true,
          data: prop,
        })),
      });
    }

    return result;
  }, [
    currentEntity,
    value,
    isEditMode,
    getEntityOwnAttributes,
    getEntityModuleAttributes,
    getModulesByIds,
  ]);

  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        directory
        showLine
        style={{
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
};

export default PropertyTree;
