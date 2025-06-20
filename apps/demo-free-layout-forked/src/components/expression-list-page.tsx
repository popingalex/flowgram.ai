import React, { useState, useMemo } from 'react';

import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Select,
  Spin,
  Empty,
  Tooltip,
  Collapse,
} from '@douyinfe/semi-ui';
import {
  IconPlay,
  IconRefresh,
  IconCode,
  IconChevronDown,
  IconChevronUp,
} from '@douyinfe/semi-icons';

import { SearchFilterBar } from './ext/search-filter-bar';
import { useExpressionList, useExpressionActions } from '../stores';
import type {
  ExpressionItem,
  ExpressionDef,
  BehaviorDef,
  BehaviorParameter,
} from '../services/types';

const { Text } = Typography;

// 参数类型标签组件
const ParameterTypeTag: React.FC<{ type: string }> = ({ type }) => {
  const getColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'string':
        return 'blue';
      case 'number':
        return 'green';
      case 'boolean':
        return 'orange';
      case 'object':
        return 'purple';
      case 'array':
        return 'cyan';
      default:
        return 'grey';
    }
  };

  return (
    <Tag color={getColor(type)} size="small">
      {type}
    </Tag>
  );
};

// 参数列表展示组件
const ParametersList: React.FC<{ parameters: BehaviorParameter[] }> = ({ parameters }) => {
  if (!parameters || parameters.length === 0) {
    return <Text type="tertiary">无参数</Text>;
  }

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {parameters.map((param, index) => (
        <div key={index} style={{ marginBottom: '8px', padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Text strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {param.name}
            </Text>
            <ParameterTypeTag type={param.type} />
            {param.required && (
              <Tag color="red" size="small">
                必填
              </Tag>
            )}
          </div>
          {param.description && (
            <Text type="tertiary" size="small" style={{ marginLeft: '4px' }}>
              {param.description}
            </Text>
          )}
          {param.default !== undefined && (
            <Text type="tertiary" size="small" style={{ marginLeft: '4px' }}>
              默认值: {String(param.default)}
            </Text>
          )}
          {param.enum && param.enum.length > 0 && (
            <div style={{ marginLeft: '4px', marginTop: '2px' }}>
              <Text type="tertiary" size="small">
                可选值:{' '}
              </Text>
              {param.enum.map((val, i) => (
                <Tag key={i} size="small" style={{ margin: '0 2px' }}>
                  {val}
                </Tag>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const ExpressionListPage: React.FC = () => {
  const { allItems, categories, loading, error } = useExpressionList();
  const { loadAll, refreshAll } = useExpressionActions();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // 初始化加载
  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 过滤数据
  const filteredData = useMemo(() => {
    let filtered = allItems;

    // 按类型过滤
    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    // 按分类过滤
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // 按搜索文本过滤
    if (searchText) {
      const searchTerm = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(searchTerm) ||
          (item.description || '').toLowerCase().includes(searchTerm) ||
          (item.id || '').toLowerCase().includes(searchTerm) ||
          // 搜索参数名称
          (item.parameters || []).some(
            (param) =>
              (param.name || '').toLowerCase().includes(searchTerm) ||
              (param.description || '').toLowerCase().includes(searchTerm)
          )
      );
    }

    return filtered;
  }, [allItems, selectedType, selectedCategory, searchText]);

  // 获取类型统计
  const typeStats = useMemo(() => {
    const stats = {
      all: allItems.length,
      behavior: allItems.filter((item) => item.type === 'behavior').length,
      expression: allItems.filter((item) => item.type === 'expression').length,
    };
    return stats;
  }, [allItems]);

  // 表格列定义
  const columns = [
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_: any, record: ExpressionItem) => {
        if (record.type === 'behavior') {
          return <Tag color="blue">行为函数</Tag>;
        } else {
          const expr = record as ExpressionDef;
          return <Tag color="green">{expr.method}</Tag>;
        }
      },
    },
    {
      title: '名称',
      key: 'name',
      width: 200,
      render: (_: any, record: ExpressionItem) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="tertiary" size="small" style={{ fontFamily: 'monospace' }}>
            {record.id}
          </Text>
        </div>
      ),
    },
    {
      title: '描述',
      key: 'description',
      width: 250,
      render: (_: any, record: ExpressionItem) => <Text>{record.description || '-'}</Text>,
    },
    {
      title: '分类',
      key: 'category',
      width: 120,
      render: (_: any, record: ExpressionItem) =>
        record.category ? (
          <Tag color="orange">{record.category}</Tag>
        ) : (
          <Text type="tertiary">-</Text>
        ),
    },
    {
      title: 'URL/类名',
      key: 'url',
      width: 300,
      render: (_: any, record: ExpressionItem) => {
        if (record.type === 'expression') {
          const expr = record as ExpressionDef;
          return (
            <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {expr.url || '-'}
            </Text>
          );
        } else {
          const behavior = record as BehaviorDef;
          return (
            <Text type="tertiary" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {behavior.fullClassName || behavior.className || '-'}
            </Text>
          );
        }
      },
    },
    {
      title: '参数',
      key: 'parameters',
      width: 400,
      render: (_: any, record: ExpressionItem) => {
        const params = record.parameters || [];
        if (params.length === 0) {
          return <Text type="tertiary">无参数</Text>;
        }

        return (
          <Collapse>
            <Collapse.Panel
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong>{params.length} 个参数</Text>
                  <div>
                    {params.slice(0, 3).map((param, index) => (
                      <ParameterTypeTag key={index} type={param.type} />
                    ))}
                    {params.length > 3 && (
                      <Text type="tertiary" size="small">
                        +{params.length - 3}
                      </Text>
                    )}
                  </div>
                </div>
              }
              itemKey="params"
            >
              <ParametersList parameters={params} />
            </Collapse.Panel>
          </Collapse>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ExpressionItem) => (
        <Space>
          {record.type === 'expression' && (
            <Tooltip content="测试调用">
              <Button
                size="small"
                type="primary"
                icon={<IconPlay />}
                onClick={() => {
                  console.log('测试调用:', record.id);
                }}
              />
            </Tooltip>
          )}
          <Tooltip content="查看详情">
            <Button
              size="small"
              icon={<IconCode />}
              onClick={() => {
                console.log('查看详情:', record.id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>正在加载表达式数据...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="danger">{error}</Text>
        <div style={{ marginTop: '16px' }}>
          <Button onClick={refreshAll} icon={<IconRefresh />}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        minWidth: '1200px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ fontSize: '20px' }}>
          表达式列表
        </Text>
        <Text type="tertiary" style={{ marginLeft: '12px' }}>
          管理行为函数和远程服务
        </Text>
      </div>

      {/* 搜索和筛选栏 */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <SearchFilterBar
          searchText={searchText}
          onSearchChange={setSearchText}
          onRefresh={refreshAll}
          loading={loading}
          placeholder="搜索表达式、参数、URL、方法..."
        />

        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Text>类型筛选:</Text>
          <Select
            value={selectedType}
            onChange={(value) => setSelectedType(value as string)}
            style={{ width: 150 }}
            optionList={[
              { label: `全部 (${typeStats.all})`, value: 'all' },
              { label: `行为函数 (${typeStats.behavior})`, value: 'behavior' },
              { label: `远程服务 (${typeStats.expression})`, value: 'expression' },
            ]}
          />

          <Text>分类筛选:</Text>
          <Select
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as string)}
            style={{ width: 150 }}
            placeholder="选择分类"
            optionList={[
              { label: '全部', value: '' },
              ...categories.map((cat) => ({ label: cat, value: cat })),
            ]}
          />
        </div>
      </div>

      {/* 表格容器 - 填充剩余空间 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        {filteredData.length === 0 ? (
          <Empty description="没有找到匹配的表达式" style={{ padding: '60px' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,

              position: 'bottom',
              style: {
                position: 'sticky',
                bottom: 0,
                backgroundColor: 'var(--semi-color-bg-2)',
                zIndex: 10,
                padding: '12px 0',
                borderTop: '1px solid var(--semi-color-border)',
              },
            }}
            size="small"
            rowKey="id"
            scroll={{
              y: 'calc(100vh - 280px)', // 动态计算表格高度
              x: 1500, // 设置最小宽度以支持横向滚动
            }}
            style={{ flex: 1 }}
          />
        )}
      </div>
    </div>
  );
};
