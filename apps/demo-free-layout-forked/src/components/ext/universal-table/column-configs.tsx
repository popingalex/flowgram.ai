import React from 'react';

import { Button, Tag } from '@douyinfe/semi-ui';
import { IconFilter, IconSetting, IconDelete, IconEdit } from '@douyinfe/semi-icons';

import type { ColumnConfig } from './index';

// 功能列定义 - 每个功能对应一个列
export const FEATURE_COLUMNS = {
  // 选择列
  SELECTION: {
    key: '_selection',
    title: '选择',
    dataIndex: '_selection',
    width: 60,
    fixed: 'left',
  } as ColumnConfig,

  // 状态列
  STATUS: {
    key: '_status',
    title: '状态',
    dataIndex: '_status',
    width: 80,
    render: (status: string) => {
      const statusConfig = {
        saved: { color: 'green' as const, text: '已保存' },
        editing: { color: 'orange' as const, text: '编辑中' },
        new: { color: 'blue' as const, text: '新建' },
        deleted: { color: 'red' as const, text: '已删除' },
      };
      const config = statusConfig[status as keyof typeof statusConfig] || {
        color: 'grey' as const,
        text: status,
      };
      return (
        <Tag color={config.color} size="small">
          {config.text}
        </Tag>
      );
    },
  } as ColumnConfig,

  // 模块过滤列
  MODULE_FILTER: {
    key: '_moduleFilter',
    title: '模块过滤',
    dataIndex: '_moduleFilter',
    width: 100,
    render: (value: any, record: any) => (
      <Button
        theme="borderless"
        icon={<IconFilter />}
        size="small"
        onClick={() => {
          console.log('配置模块过滤', record);
        }}
      >
        配置
      </Button>
    ),
  } as ColumnConfig,

  // 属性过滤列
  PROPERTY_FILTER: {
    key: '_propertyFilter',
    title: '属性过滤',
    dataIndex: '_propertyFilter',
    width: 100,
    render: (value: any, record: any) => (
      <Button
        theme="borderless"
        icon={<IconFilter />}
        size="small"
        onClick={() => {
          console.log('配置属性过滤', record);
        }}
      >
        配置
      </Button>
    ),
  } as ColumnConfig,

  // 参数映射列
  PARAMETER_MAPPING: {
    key: '_parameterMapping',
    title: '参数映射',
    dataIndex: '_parameterMapping',
    width: 100,
    render: (value: any, record: any) => (
      <Button
        theme="borderless"
        icon={<IconSetting />}
        size="small"
        onClick={() => {
          console.log('配置参数映射', record);
        }}
      >
        映射
      </Button>
    ),
  } as ColumnConfig,

  // 操作列
  ACTIONS: {
    key: '_actions',
    title: '操作',
    dataIndex: '_actions',
    // width: 120,
    // 移除 fixed: 'right' 以去除分割符
    render: (value: any, record: any) => (
      <div>
        <Button size="small" icon={<IconEdit />} style={{ marginRight: '8px' }}>
          编辑
        </Button>
        <Button size="small" type="danger" icon={<IconDelete />}>
          删除
        </Button>
      </div>
    ),
  } as ColumnConfig,
};

// 工具函数：创建自定义列配置
export const createColumn = (
  key: string,
  title: string,
  dataIndex: string,
  overrides?: Partial<ColumnConfig>
): ColumnConfig => ({
  key,
  title,
  dataIndex,
  editable: true,
  searchable: true,
  sortable: true,
  // 不设置默认宽度，让列自适应
  ...overrides,
});

// 工具函数：覆盖功能列的配置
export const overrideFeatureColumn = (
  featureColumn: ColumnConfig,
  overrides: Partial<ColumnConfig>
): ColumnConfig => ({
  ...featureColumn,
  ...overrides,
});

// 工具函数：创建带自定义回调的功能列
export const createFeatureColumn = (
  baseFeatureColumn: ColumnConfig,
  onClick?: (record: any) => void,
  buttonText?: string
): ColumnConfig => {
  if (!onClick) return baseFeatureColumn;

  return {
    ...baseFeatureColumn,
    render: (value: any, record: any) => (
      <Button
        theme="borderless"
        icon={baseFeatureColumn.key.includes('Filter') ? <IconFilter /> : <IconSetting />}
        size="small"
        onClick={() => onClick(record)}
      >
        {buttonText || '配置'}
      </Button>
    ),
  };
};
