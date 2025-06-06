import React from 'react';

import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { Button, Table, Tag } from '@douyinfe/semi-ui';
import { IconLink, IconSetting } from '@douyinfe/semi-icons';

import { useEntityStore } from '../entity-store';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useCurrentEntity } from '../../../stores';

export interface ModulePropertyData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  isAttribute?: boolean; // 标记是否为属性行
  parentKey?: string; // 父模块的key
}

export interface ModuleTreeData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  children?: ModulePropertyData[]; // 树形结构的子节点
  isAttribute?: boolean; // 标记是否为属性行，模块行为false
}

interface ModulePropertyTreeTableProps {
  modules: ModuleTreeData[];
  showTitle?: boolean;
  title?: string;
  onNavigateToModule?: (moduleId: string) => void;
  onConfigureModules?: () => void;
}

export const ModulePropertyTreeTable: React.FC<ModulePropertyTreeTableProps> = ({
  modules,
  showTitle = false,
  title = '模块属性',
  onNavigateToModule,
  onConfigureModules,
}) => {
  const { removeModuleFromEntity } = useEntityStore();
  const { editingEntity } = useCurrentEntity();
  // 树形表格的列配置，与实体属性表头完全对齐
  const columns = [
    {
      title: 'ID',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (text: string, record: ModuleTreeData | ModulePropertyData) => {
        // 模块属性去掉前缀
        const displayId = record.isAttribute ? record.id.split('/').pop() || record.id : record.id;
        return displayId;
      },
    },
    {
      title: '名称',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: ModuleTreeData | ModulePropertyData) => record.name,
    },
    {
      title: () => (
        <Button size="small" icon={<IconSetting />} onClick={onConfigureModules}>
          关联模块
        </Button>
      ),
      key: 'controls',
      render: (text: string, record: ModuleTreeData | ModulePropertyData) => {
        if (record.isAttribute) {
          // 模块属性：显示类型组件
          const propertyData = record as ModulePropertyData;
          const typedInfo = TypedParser.fromString(propertyData.type);

          // 转换为JSON Schema格式
          let value;
          if (typedInfo.dimensions.length > 0) {
            const itemType =
              typedInfo.attributes.length > 0
                ? 'object'
                : typedInfo.primitive === Primitive.STRING
                ? 'string'
                : typedInfo.primitive === Primitive.NUMBER
                ? 'number'
                : typedInfo.primitive === Primitive.BOOLEAN
                ? 'boolean'
                : 'unknown';
            value = { type: 'array', items: { type: itemType } };
          } else if (typedInfo.attributes.length > 0) {
            value = { type: 'object' };
          } else {
            const primitiveType =
              typedInfo.primitive === Primitive.STRING
                ? 'string'
                : typedInfo.primitive === Primitive.NUMBER
                ? 'number'
                : typedInfo.primitive === Primitive.BOOLEAN
                ? 'boolean'
                : 'unknown';
            value = { type: primitiveType };
          }

          return <EntityPropertyTypeSelector value={value} disabled />;
        } else {
          // 模块行：显示属性数量和跳转按钮
          const moduleData = record as ModuleTreeData;
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag size="small" color="blue">
                {moduleData.attributeCount}
              </Tag>
              {onNavigateToModule && (
                <Button
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  icon={<IconLink />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToModule(moduleData.id);
                  }}
                />
              )}
            </div>
          );
        }
      },
    },
  ];

  // 为树形表格准备数据
  const treeDataSource = modules.map((module) => ({
    ...module,
    children: module.children?.map((attr) => ({
      ...attr,
      isAttribute: true,
      parentKey: module.key,
    })),
  }));

  console.log('🌲 ModulePropertyTreeTable - 树形数据:', {
    modules,
    treeDataSource,
    hasChildren: treeDataSource.some((m) => m.children && m.children.length > 0),
  });

  return (
    <>
      {showTitle && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--semi-color-fill-1)',
            borderRadius: '4px',
            color: 'var(--semi-color-text-0)',
          }}
        >
          <span>{title}</span>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={treeDataSource}
        pagination={false}
        size="small"
        rowKey="key"
        showHeader={true}
        defaultExpandAllRows={true}
        hideExpandedColumn={false}
        onRow={(record) => {
          if (record && !record.isAttribute) {
            return {
              style: {
                backgroundColor: 'var(--semi-color-fill-0)',
                fontWeight: 600,
              },
            };
          }
          return {};
        }}
        indentSize={0}
        style={{
          borderRadius: '6px',
          border: '1px solid var(--semi-color-border)',
          overflow: 'hidden',
          width: '100%',
          tableLayout: 'fixed',
        }}
      />
    </>
  );
};
