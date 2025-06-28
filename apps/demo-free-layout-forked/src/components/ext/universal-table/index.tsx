import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';

import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Typography,
  Divider,
  Checkbox,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconSearch, IconSave, IconClose } from '@douyinfe/semi-icons';

import { FEATURE_COLUMNS } from './column-configs';

const { Text } = Typography;

// 列配置接口
export interface ColumnConfig {
  key: string;
  title: string;
  dataIndex: string;

  // 列功能配置
  editable?: boolean; // 该列是否可编辑
  sortable?: boolean; // 该列是否可排序
  searchable?: boolean; // 该列是否可搜索
  required?: boolean; // 该列是否必填

  // 渲染配置
  render?: (value: any, record: any, index: number) => React.ReactNode;
  editRender?: (value: any, record: any, onChange: (value: any) => void) => React.ReactNode;

  // 样式配置
  width?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

// 表格主配置接口
export interface UniversalTableProps {
  // 数据相关
  dataSource: any[];
  columns: ColumnConfig[];
  rowKey?: string | ((record: any) => string);

  // 外部搜索支持
  searchText?: string; // 外部提供的搜索文本

  // 功能开关 - 每个开关对应一个功能列
  showSelection?: boolean; // 显示选择列
  showStatus?: boolean; // 显示状态列
  showModuleFilter?: boolean; // 显示模块过滤列
  showPropertyFilter?: boolean; // 显示属性过滤列
  showParameterMapping?: boolean; // 显示参数映射列
  showActions?: boolean; // 显示操作列

  // 模块关联功能
  showModuleAssociation?: boolean; // 显示模块关联checkbox
  associatedModuleIds?: string[]; // 已关联的模块ID列表
  onModuleAssociationChange?: (moduleId: string, checked: boolean) => void; // 模块关联变更回调

  // 传统功能开关
  editable?: boolean; // 是否可编辑
  deletable?: boolean; // 是否支持删除
  addable?: boolean; // 是否支持添加
  groupable?: boolean; // 是否支持分组
  sortable?: boolean; // 是否支持排序
  expandable?: boolean; // 是否支持展开/收起（用于树形数据）

  // 分组相关
  groupBy?: string; // 分组字段
  groupTitle?: (groupKey: string, groupData: any[]) => string;

  // 选择相关
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;

  // 编辑相关
  onAdd?: () => void;
  onEdit?: (key: string, field: string, value: any) => void;
  onDelete?: (key: string) => void;

  // 功能列回调
  onModuleFilterClick?: (record: any) => void;
  onPropertyFilterClick?: (record: any) => void;
  onParameterMappingClick?: (record: any) => void;

  // 树形数据配置
  childrenColumnName?: string; // 子数据字段名，默认'children'
  isAttributeField?: string; // 标识是否为属性行的字段名，默认'isAttribute'
  defaultExpandAllRows?: boolean; // 是否默认展开所有行
  expandRowByClick?: boolean; // 是否点击行展开

  // 其他配置
  showHeader?: boolean; // 是否显示表头
  showPagination?: boolean; // 是否显示分页
  size?: 'small' | 'default' | 'middle';
  title?: string; // 表格标题
  addButtonText?: string; // 添加按钮文字
  emptyText?: string; // 空数据提示
}

// 稳定的编辑组件 - 防止光标跳动
const StableEditableCell: React.FC<{
  value: any;
  column: ColumnConfig;
  onChange: (value: any) => void;
  rowKey: string;
  field: string;
}> = React.memo(({ value, column, onChange, rowKey, field }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  // 跟踪外部值变化，避免在用户编辑时被覆盖
  const lastExternalValueRef = useRef(value);
  const cursorPositionRef = useRef<number>(0);

  useEffect(() => {
    // 只有在不编辑状态下，且外部值确实发生了变化时才同步
    if (!isEditing && value !== lastExternalValueRef.current) {
      console.log('🔍 StableEditableCell 同步外部值变化:', {
        rowKey,
        field,
        oldLocalValue: localValue,
        newExternalValue: value,
        isEditing,
      });
      setLocalValue(value);
      lastExternalValueRef.current = value;
    }
  }, [value, isEditing, rowKey, field]); // 移除localValue依赖，避免无限循环

  const handleChange = useCallback(
    (newValue: string) => {
      console.log('🔍 StableEditableCell handleChange:', {
        rowKey,
        field,
        oldLocalValue: localValue,
        newValue,
        isEditing,
      });

      // 保存光标位置
      const input = document.activeElement as HTMLInputElement;
      if (input && input.selectionStart !== null) {
        cursorPositionRef.current = input.selectionStart;
      }

      setLocalValue(newValue);
      setIsEditing(true);

      // 延迟触发onChange，避免立即重新渲染
      setTimeout(() => {
        onChange(newValue);

        // 恢复光标位置
        requestAnimationFrame(() => {
          const input = document.activeElement as HTMLInputElement;
          if (input && input.setSelectionRange) {
            input.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
          }
        });
      }, 0);
    },
    [onChange, rowKey, field, localValue, isEditing]
  );

  const handleBlur = useCallback(() => {
    console.log('🔍 StableEditableCell handleBlur:', {
      rowKey,
      field,
      localValue,
    });
    // 失去焦点时结束编辑状态
    setIsEditing(false);
  }, [localValue, onChange]);

  // 移除了定时器相关逻辑

  if (column.editRender) {
    console.log('🔍 StableEditableCell 使用自定义渲染器');
    return column.editRender(localValue, {}, handleChange);
  }

  // console.log('🔍 StableEditableCell 渲染Input:', {
  //   rowKey,
  //   field,
  //   localValue,
  //   placeholder: `请输入${column.title}`,
  // });

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Input
        value={localValue}
        onChange={(value) => {
          console.log('🔍 Input onChange 事件触发:', { value, rowKey, field });
          handleChange(value);
        }}
        onBlur={handleBlur}
        placeholder={`请输入${column.title}`}
        size="small"
      />
    </div>
  );
});

// 设置组件显示名称
StableEditableCell.displayName = 'StableEditableCell';

// 内置编辑组件（保留作为备用）
const EditableCell: React.FC<{
  value: any;
  column: ColumnConfig;
  onChange: (value: any) => void;
}> = ({ value, column, onChange }) => {
  if (column.editRender) {
    return column.editRender(value, {}, onChange);
  }

  return (
    <Input value={value} onChange={onChange} placeholder={`请输入${column.title}`} size="small" />
  );
};

// 主组件
export const UniversalTable: React.FC<UniversalTableProps> = ({
  dataSource = [],
  columns = [],
  rowKey = 'key',
  searchText = '',
  size = 'default',
  emptyText = '暂无数据',
  editable = false,
  deletable = false,
  addable = false,
  onEdit,
  onDelete,
  onAdd,
  showSelection = false,
  selectedKeys = [],
  onSelectionChange,
  expandable = false,
  childrenColumnName = 'children',
  isAttributeField = 'isAttribute',
  defaultExpandAllRows = false,
  expandRowByClick = false,

  ...tableProps
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // 获取行键值
  const getRowKey = useCallback(
    (record: any) => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey] || record.key || record.id;
    },
    [rowKey]
  );

  // 处理搜索过滤
  const filteredData = useMemo(() => {
    if (!searchText?.trim()) return dataSource;

    const filterItem = (item: any): boolean => {
      const searchLower = searchText.toLowerCase();
      return (
        (item.id && item.id.toLowerCase().includes(searchLower)) ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.type && item.type.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    };

    return dataSource.filter(filterItem);
  }, [dataSource, searchText]);

  // 使用rowSelection让Semi自动处理选择列，避免和展开列冲突
  const rowSelection = useMemo(() => {
    if (!showSelection) return undefined;

    return {
      type: 'checkbox' as const,
      selectedRowKeys: selectedKeys,
      onChange: (selectedRowKeys: (string | number)[] | undefined) => {
        if (onSelectionChange && selectedRowKeys) {
          onSelectionChange(selectedRowKeys as string[]);
        }
      },
      getCheckboxProps: (record: any) => ({
        // 对于属性行，隐藏checkbox
        style: record && record[isAttributeField] ? { display: 'none' } : {},
      }),
      width: 40, // 限制选择列宽度到40px
    };
  }, [showSelection, selectedKeys, onSelectionChange, isAttributeField]);

  // 分组数据
  const groupedData = useMemo(() => {
    if (!tableProps.groupable || !tableProps.groupBy) {
      return { ungrouped: filteredData };
    }

    return filteredData.reduce((groups, record) => {
      const groupKey = record[tableProps.groupBy!] || 'ungrouped';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
      return groups;
    }, {} as Record<string, any[]>);
  }, [filteredData, tableProps.groupable, tableProps.groupBy]);

  // 编辑功能
  const handleEdit = useCallback((key: string, field: string, currentValue: any) => {
    setEditingKey(`${key}-${field}`);
    setEditingValue(String(currentValue || ''));
  }, []);

  const handleSave = useCallback(
    (key: string, field: string) => {
      onEdit?.(key, field, editingValue);
      setEditingKey(null);
      setEditingValue('');
    },
    [onEdit, editingValue]
  );

  const handleCancel = useCallback(() => {
    setEditingKey(null);
    setEditingValue('');
  }, []);

  // 构建最终列配置
  const finalColumns = useMemo(() => {
    const finalColumns = [...columns];

    // 让Semi自动处理展开列和选择列，它们会各自独立成列

    // 2. 基础列处理 - 添加编辑功能（使用StableEditableCell防止光标跳动）
    finalColumns.forEach((column) => {
      if (editable && column.editable && !column.render) {
        // 只对没有自定义render的可编辑列添加稳定输入框
        column.render = (value: any, record: any) => {
          const key = getRowKey(record);
          return (
            <StableEditableCell
              value={value || ''}
              column={column}
              onChange={(newValue) => {
                onEdit?.(key, column.dataIndex, newValue);
              }}
              rowKey={key}
              field={column.dataIndex}
            />
          );
        };
      }
    });

    // 2.5. 模块关联列
    if (tableProps.showModuleAssociation) {
      finalColumns.push({
        title: '',
        key: 'module_association',
        dataIndex: 'module_association',
        render: (value: any, record: any) => {
          if (record[isAttributeField]) {
            return null; // 属性行不显示
          }

          const moduleId = record.id || record._indexId;
          const isAssociated = (tableProps.associatedModuleIds || []).includes(moduleId);

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isAssociated}
                onChange={(e) => {
                  e.stopPropagation();
                  tableProps.onModuleAssociationChange?.(moduleId, e.target.checked);
                }}
                data-testid={`module-checkbox-${moduleId}`}
              />
            </div>
          );
        },
      });
    }

    // 3. 状态列
    if (tableProps.showStatus) {
      finalColumns.push(FEATURE_COLUMNS.STATUS);
    }

    // 4. 功能列
    if (tableProps.showModuleFilter) {
      finalColumns.push({
        ...FEATURE_COLUMNS.MODULE_FILTER,
        render: (value: any, record: any) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              theme="borderless"
              icon={FEATURE_COLUMNS.MODULE_FILTER.render ? undefined : undefined}
              size="small"
              onClick={() => tableProps.onModuleFilterClick?.(record)}
            >
              配置
            </Button>
          </div>
        ),
      });
    }

    if (tableProps.showPropertyFilter) {
      finalColumns.push({
        ...FEATURE_COLUMNS.PROPERTY_FILTER,
        render: (value: any, record: any) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              theme="borderless"
              size="small"
              onClick={() => tableProps.onPropertyFilterClick?.(record)}
            >
              配置
            </Button>
          </div>
        ),
      });
    }

    if (tableProps.showParameterMapping) {
      finalColumns.push({
        ...FEATURE_COLUMNS.PARAMETER_MAPPING,
        render: (value: any, record: any) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              theme="borderless"
              size="small"
              onClick={() => tableProps.onParameterMappingClick?.(record)}
            >
              映射
            </Button>
          </div>
        ),
      });
    }

    // 5. 操作列
    console.log('🔍 操作列条件检查:', {
      showActions: tableProps.showActions,
      editable,
      deletable,
      addable,
      onDelete: !!onDelete,
    });
    if (tableProps.showActions || editable || deletable || addable) {
      finalColumns.push({
        ...FEATURE_COLUMNS.ACTIONS,
        render: (value: any, record: any) => {
          const key = getRowKey(record);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Space>
                {deletable && onDelete && (
                  <Button
                    icon={<IconDelete />}
                    size="small"
                    type="danger"
                    theme="borderless"
                    onClick={() => onDelete(key)}
                  />
                )}
              </Space>
            </div>
          );
        },
        title:
          addable && onAdd ? (
            <Button size="small" icon={<IconPlus />} type="primary" onClick={onAdd}>
              {tableProps.addButtonText || '添加'}
            </Button>
          ) : (
            ''
          ),
      });
    }

    return finalColumns;
  }, [
    columns,
    showSelection,
    tableProps.showStatus,
    tableProps.showModuleFilter,
    tableProps.showPropertyFilter,
    tableProps.showParameterMapping,
    tableProps.showActions,
    tableProps.showModuleAssociation,
    tableProps.associatedModuleIds,
    tableProps.onModuleAssociationChange,
    isAttributeField,
    selectedKeys,
    editable,
    deletable,
    editingKey,
    editingValue,
    getRowKey,
    handleEdit,
    handleSave,
    handleCancel,
    onDelete,
    tableProps.onModuleFilterClick,
    tableProps.onPropertyFilterClick,
    tableProps.onParameterMappingClick,
    addable,
    onAdd,
    tableProps.addButtonText,
  ]);

  // 分组表格渲染
  const renderGroupedTable = () =>
    Object.entries(groupedData).map(([groupKey, groupData]) => (
      <div key={groupKey} style={{ marginBottom: '16px' }}>
        {groupKey !== 'ungrouped' && (
          <Divider align="left">
            <Text strong>
              {tableProps.groupTitle
                ? tableProps.groupTitle(groupKey, groupData as any[])
                : groupKey}
            </Text>
          </Divider>
        )}
        <Table
          dataSource={groupData}
          columns={finalColumns}
          rowKey={getRowKey}
          size={size}
          pagination={tableProps.showPagination ? {} : false}
          scroll={{ x: 800 }}
        />
      </div>
    ));

  // 常规表格渲染
  const renderTable = () => {
    // 直接使用finalColumns，不手动添加选择列和展开列

    // 树形数据配置 - 使用Semi默认的展开功能
    const treeProps = expandable
      ? {
          childrenColumnName,
          defaultExpandAllRows,
          expandRowByClick,
          hideExpandedColumn: false, // 显示独立的展开列
          indentSize: 0, // 设置缩进为0
        }
      : {};

    return (
      <Table
        dataSource={filteredData}
        columns={finalColumns}
        rowKey={getRowKey}
        size={size}
        pagination={tableProps.showPagination ? {} : false}
        empty={emptyText}
        rowSelection={rowSelection}
        onRow={(record, index) => {
          // 只有模块表头需要背景色
          if (record.children && record.children.length > 0) {
            return {
              style: {
                backgroundColor: 'var(--semi-color-fill-1)',
              },
            };
          }
          return {};
        }}
        {...treeProps}
      />
    );
  };

  return (
    <div>
      {/* 表头区域 */}
      {tableProps.showHeader &&
        (tableProps.title || (addable && !(tableProps.showActions || editable || deletable))) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>{tableProps.title && <h3 style={{ margin: 0 }}>{tableProps.title}</h3>}</div>
            <Space>
              {addable && !(tableProps.showActions || editable || deletable) && onAdd && (
                <Button icon={<IconPlus />} type="primary" onClick={onAdd}>
                  {tableProps.addButtonText || '添加'}
                </Button>
              )}
            </Space>
          </div>
        )}

      {/* 表格内容 */}
      {tableProps.groupable && tableProps.groupBy ? renderGroupedTable() : renderTable()}
    </div>
  );
};

// 使用示例
/*
// 1. 基础表格 - 只显示业务列
<UniversalTable
  dataSource={entities}
  columns={[
    { key: 'name', title: '名称', dataIndex: 'name', editable: true },
    { key: 'type', title: '类型', dataIndex: 'type' }
  ]}
  editable={true}
  addable={true}
  onAdd={() => console.log('添加')}
  onEdit={(key, field, value) => console.log('编辑', key, field, value)}
/>

// 2. 带功能列的表格 - 显示状态列和操作列
<UniversalTable
  dataSource={behaviors}
  columns={[
    { key: 'name', title: '行为名称', dataIndex: 'name' },
    { key: 'description', title: '描述', dataIndex: 'description' }
  ]}
  showStatus={true}
  showActions={true}
  showModuleFilter={true}
  onModuleFilterClick={(record) => console.log('配置模块过滤', record)}
/>

// 3. 参数映射表格 - 显示参数映射列
<UniversalTable
  dataSource={parameters}
  columns={[
    { key: 'name', title: '参数名', dataIndex: 'name' },
    { key: 'type', title: '类型', dataIndex: 'type' }
  ]}
  showParameterMapping={true}
  onParameterMappingClick={(record) => console.log('配置参数映射', record)}
/>

// 4. 完整功能表格 - 所有功能都开启
<UniversalTable
  dataSource={data}
  columns={businessColumns}
  showSelection={true}
  showStatus={true}
  showModuleFilter={true}
  showPropertyFilter={true}
  showParameterMapping={true}
  showActions={true}
  editable={true}
  deletable={true}
  addable={true}
  searchable={true}
  sortable={true}
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  onModuleFilterClick={handleModuleFilter}
  onPropertyFilterClick={handlePropertyFilter}
  onParameterMappingClick={handleParameterMapping}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
*/
