import React, { useEffect } from 'react';

import { Card, Button, Space, Typography, Spin, Empty, Tag, Table } from '@douyinfe/semi-ui';
import { IconRefresh, IconCode } from '@douyinfe/semi-icons';

import { useBehaviorList, useBehaviorActions } from '../../stores/function-list';

const { Title, Text } = Typography;

export const BehaviorTestPage: React.FC = () => {
  const { behaviors, categories, loading, error, lastLoaded } = useBehaviorList();
  const { loadBehaviors, refreshBehaviors, clearError } = useBehaviorActions();

  // 组件加载时自动获取数据
  useEffect(() => {
    if (behaviors.length === 0 && !loading) {
      loadBehaviors();
    }
  }, [behaviors.length, loading, loadBehaviors]);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ width: 280 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <Tag color={method === 'GET' ? 'green' : 'orange'}>{method}</Tag>,
    },
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      width: 250,
      render: (endpoint: string) => (
        <Text code ellipsis={{ showTooltip: true }} style={{ width: 230 }}>
          {endpoint}
        </Text>
      ),
    },
    {
      title: '参数数量',
      dataIndex: 'parameters',
      key: 'parameters',
      width: 100,
      render: (parameters: any[]) => <Tag color="cyan">{parameters?.length || 0}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>
            <IconCode /> 函数行为列表测试
          </Title>
          <Text type="secondary">测试后台 /hub/behaviors/ API 的数据获取和解析</Text>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<IconRefresh />}
            onClick={() => refreshBehaviors()}
            loading={loading}
            type="primary"
          >
            刷新数据
          </Button>
          {error && (
            <Button onClick={clearError} type="danger">
              清除错误
            </Button>
          )}
        </Space>

        {/* 数据状态显示 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text>
              数据量: <strong>{behaviors.length}</strong>
            </Text>
            <Text>
              分类数: <strong>{categories.length}</strong>
            </Text>
            {lastLoaded && (
              <Text type="secondary">最后加载: {new Date(lastLoaded).toLocaleString()}</Text>
            )}
          </Space>
        </div>

        {/* 分类显示 */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>可用分类: </Text>
            <Space wrap>
              {categories.map((category) => (
                <Tag key={category} color="blue">
                  {category}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 错误显示 */}
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Card style={{ backgroundColor: 'var(--semi-color-danger-light-default)' }}>
              <Text type="danger">错误: {error}</Text>
            </Card>
          </div>
        )}

        {/* 数据表格 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 8 }}>
              <Text>正在加载函数行为数据...</Text>
            </div>
          </div>
        ) : behaviors.length === 0 ? (
          <Empty
            image={<IconCode size="extra-large" style={{ color: 'var(--semi-color-text-3)' }} />}
            title="暂无函数行为数据"
            description="请检查后台API或网络连接"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={behaviors}
            rowKey="_indexId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};
