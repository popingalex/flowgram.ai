import React, { useState } from 'react';

import { Button, Card, Typography, Space, Toast, Tag, Divider } from '@douyinfe/semi-ui';

import {
  entityApi,
  moduleApi,
  enumApi,
  behaviorApi,
  graphApi,
  getApiMode,
  toggleMockMode,
} from '../services/api-service';

const { Title, Text } = Typography;

export const ApiTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<
    Record<string, { status: 'loading' | 'success' | 'error'; message: string; data?: any }>
  >({});
  const [apiMode, setApiMode] = useState(getApiMode());

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setTestResults((prev) => ({
      ...prev,
      [testName]: { status: 'loading', message: '测试中...' },
    }));

    try {
      const result = await testFn();
      setTestResults((prev) => ({
        ...prev,
        [testName]: {
          status: 'success',
          message: `成功 - 获取到 ${Array.isArray(result) ? result.length : 1} 条数据`,
          data: result,
        },
      }));
      Toast.success(`${testName} 测试成功`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setTestResults((prev) => ({
        ...prev,
        [testName]: {
          status: 'error',
          message: `失败: ${errorMessage}`,
        },
      }));
      Toast.error(`${testName} 测试失败: ${errorMessage}`);
    }
  };

  const tests = [
    {
      name: '实体API',
      key: 'entities',
      fn: () => entityApi.getAll(),
    },
    {
      name: '模块API',
      key: 'modules',
      fn: () => moduleApi.getAll(),
    },
    {
      name: '枚举API',
      key: 'enums',
      fn: () => enumApi.getAll(),
    },
    {
      name: '行为API',
      key: 'behaviors',
      fn: () => behaviorApi.getAll(),
    },
    {
      name: '图形API',
      key: 'graphs',
      fn: () => graphApi.getAll(),
    },
  ];

  const handleToggleMode = () => {
    const newMode = toggleMockMode();
    setApiMode(getApiMode());
    Toast.info(`已切换到 ${newMode ? 'Mock模式' : '真实API模式'}`);
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name, test.fn);
      // 添加小延迟避免并发过多
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  const getStatusTag = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Tag color="blue">测试中</Tag>;
      case 'success':
        return <Tag color="green">成功</Tag>;
      case 'error':
        return <Tag color="red">失败</Tag>;
      default:
        return <Tag color="grey">未测试</Tag>;
    }
  };

  return (
    <Card
      title="API连通性测试"
      style={{ margin: '20px', maxWidth: '800px' }}
      headerExtraContent={
        <Space>
          <Tag color={apiMode.isMockMode ? 'orange' : 'green'}>{apiMode.mode}</Tag>
          <Button onClick={handleToggleMode} size="small">
            切换模式
          </Button>
        </Space>
      }
    >
      <Space vertical style={{ width: '100%' }} spacing="loose">
        <div>
          <Text type="secondary">
            当前API模式: <strong>{apiMode.mode}</strong>
          </Text>
          <br />
          <Text type="secondary" size="small">
            真实API模式会先尝试连接后台服务 (http://localhost:9999)，失败时自动降级到Mock模式
          </Text>
        </div>

        <Divider />

        <Space>
          <Button type="primary" onClick={runAllTests}>
            运行所有测试
          </Button>
          <Button onClick={() => setTestResults({})}>清除结果</Button>
        </Space>

        <div>
          {tests.map((test) => (
            <div
              key={test.key}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
              }}
            >
              <Space>
                <Button
                  size="small"
                  onClick={() => runTest(test.name, test.fn)}
                  loading={testResults[test.name]?.status === 'loading'}
                >
                  测试 {test.name}
                </Button>
                {testResults[test.name] && getStatusTag(testResults[test.name].status)}
                <Text size="small">{testResults[test.name]?.message || '点击测试按钮开始'}</Text>
              </Space>
              {testResults[test.name]?.data && (
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                    查看返回数据
                  </summary>
                  <pre
                    style={{
                      fontSize: '11px',
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      marginTop: '4px',
                    }}
                  >
                    {JSON.stringify(testResults[test.name].data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <Divider />

        <div>
          <Title heading={6}>说明</Title>
          <Text size="small" type="secondary">
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>绿色标签表示API调用成功</li>
              <li>红色标签表示API调用失败，会自动降级到Mock数据</li>
              <li>Mock模式使用本地模拟数据，不需要后台服务</li>
              <li>真实API模式需要后台服务运行在 http://localhost:9999</li>
            </ul>
          </Text>
        </div>
      </Space>
    </Card>
  );
};
