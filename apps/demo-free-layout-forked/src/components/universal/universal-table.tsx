import React from 'react';

import { Table, Tag, Button, Space, Tooltip, Badge } from '@douyinfe/semi-ui';
import { IconPlus, IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import type { EditableIndexed, IndexPath, FieldUpdater } from '../../typings/types';
import { UniversalInput } from './universal-input';

interface UniversalTableColumn {
  key: string;
  title: string | (() => React.ReactNode);
  width?: number;
  render?: (value: any, record: any, index: number, extra?: any) => React.ReactNode;
}

interface UniversalTableProps<T extends EditableIndexed> {
  // 数据
  dataType: 'entity' | 'module' | 'api-parameter' | 'expression' | 'graph';
  data: any[]; // 扁平化的表格数据
  loading?: boolean;

  // 操作
  onFieldUpdate: FieldUpdater;
  onSave?: (indexId: string) => Promise<void>;
  onReset?: (indexId: string) => Promise<void>;
  onDelete?: (indexId: string) => Promise<void>;
  onAdd?: () => void;

  // 验证
  getValidationError?: (indexPath: IndexPath, field: string, value: any) => string;

  // 自定义列
  extraColumns?: UniversalTableColumn[];

  // 样式
  expandable?: boolean;
  size?: 'small' | 'default' | 'large';
}

export const UniversalTable = <T extends EditableIndexed>({
  dataType,
  data,
  loading = false,
  onFieldUpdate,
  onSave,
  onReset,
  onDelete,
  onAdd,
  getValidationError,
  extraColumns = [],
  expandable = false,
  size = 'small',
}: UniversalTableProps<T>) => {
  // 基础列定义
  const baseColumns: UniversalTableColumn[] = [
    // 展开列（如果需要）
    ...(expandable
      ? [
          {
            key: 'expand',
            title: '',
            width: 40,
            render: (_: any, record: any, index: number, { expandIcon }: any) => expandIcon,
          },
        ]
      : []),

    // 类型列
    {
      key: 'type',
      title: '类型',
      width: 80,
      render: (_, record) => {
        const isNew = record._status === 'new';
        const tagColor =
          dataType === 'entity'
            ? 'blue'
            : dataType === 'module'
            ? 'green'
            : dataType === 'api-parameter'
            ? 'orange'
            : 'purple';

        return (
          <Tag
            color={tagColor}
            style={
              isNew
                ? {
                    boxShadow: `0 0 8px rgba(59, 130, 246, 0.6)`,
                    animation: 'pulse 2s infinite',
                  }
                : {}
            }
          >
            {record.type || dataType}
          </Tag>
        );
      },
    },

    // ID列
    {
      key: 'id',
      title: 'ID',
      width: 200,
      render: (_, record) => {
        const indexPath = record.parentPath
          ? [...record.parentPath, record._indexId]
          : [record._indexId];

        const errorMessage = getValidationError?.(indexPath, 'id', record.id) || '';

        return (
          <UniversalInput
            dataType={dataType}
            indexPath={indexPath}
            field="id"
            value={record.id || ''}
            placeholder="ID（必填）"
            required={true}
            readonly={record.readonly}
            isIdField={true}
            validationFn={
              getValidationError
                ? (value, allData, indexPath, field) => getValidationError(indexPath, field, value)
                : undefined
            }
            errorMessage={errorMessage}
            onChange={onFieldUpdate}
          />
        );
      },
    },

    // 名称列
    {
      key: 'name',
      title: '名称',
      width: 200,
      render: (_, record) => {
        const indexPath = record.parentPath
          ? [...record.parentPath, record._indexId]
          : [record._indexId];

        return (
          <UniversalInput
            dataType={dataType}
            indexPath={indexPath}
            field="name"
            value={record.name || ''}
            placeholder="名称"
            readonly={record.readonly}
            onChange={onFieldUpdate}
          />
        );
      },
    },

    // 操作列
    {
      key: 'actions',
      title: onAdd
        ? () => (
            <Button size="small" icon={<IconPlus />} type="primary" onClick={onAdd}>
              添加
              {dataType === 'entity'
                ? '实体'
                : dataType === 'module'
                ? '模块'
                : dataType === 'api-parameter'
                ? '参数'
                : '项目'}
            </Button>
          )
        : '操作',
      width: 200,
      render: (_, record) => {
        const isDirty = record._status === 'dirty' || record._status === 'new';
        const canSave = isDirty && record.id?.trim(); // 简单验证

        return (
          <Space spacing={2}>
            {/* 保存按钮 */}
            {onSave && (
              <Tooltip content={canSave ? '保存修改' : '无修改或数据不完整'}>
                <Button
                  size="small"
                  type="primary"
                  icon={<IconSave />}
                  disabled={!canSave}
                  loading={record._editStatus === 'saving'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave(record._indexId);
                  }}
                />
              </Tooltip>
            )}

            {/* 撤销按钮 */}
            {onReset && record._status !== 'new' && (
              <Tooltip content="撤销修改">
                <Button
                  size="small"
                  icon={<IconUndo />}
                  disabled={!isDirty}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset(record._indexId);
                  }}
                />
              </Tooltip>
            )}

            {/* 删除按钮 */}
            {onDelete && (
              <Tooltip content="删除">
                <Button
                  size="small"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(record._indexId);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const columns = [...baseColumns, ...extraColumns];

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      size={size}
      pagination={false}
      {...(expandable && {
        childrenRecordName: 'children',
        expandRowByClick: true,
        defaultExpandAllRows: true,
      })}
    />
  );
};
