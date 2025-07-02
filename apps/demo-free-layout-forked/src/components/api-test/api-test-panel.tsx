import React, { useState, useEffect } from 'react';

import { Button, Card, Typography, Space, Spin, Banner } from '@douyinfe/semi-ui';

import {
  moduleApi,
  systemApi,
  remoteBehaviorApi,
  localBehaviorApi,
} from '../../services/api-service';

const { Title, Text } = Typography;

export const ApiTestPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const testApi = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await apiCall();
      setResults((prev) => ({ ...prev, [name]: result }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error instanceof Error ? error.message : '未知错误',
      }));
      setResults((prev) => ({ ...prev, [name]: null }));
    } finally {
      setLoading(false);
    }
  };

  const testAllApis = async () => {
    setLoading(true);
    const tests = [
      { name: 'modules', call: () => moduleApi.getAll() },
      { name: 'systems', call: () => systemApi.getAll() },
      { name: 'remoteBehaviors', call: () => remoteBehaviorApi.getAll() },
      { name: 'localBehaviors', call: () => localBehaviorApi.getAll() },
    ];

    for (const test of tests) {
      try {
        const result = await test.call();
        setResults((prev) => ({ ...prev, [test.name]: result }));
        setErrors((prev) => ({ ...prev, [test.name]: '' }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          [test.name]: error instanceof Error ? error.message : '未知错误',
        }));
        setResults((prev) => ({ ...prev, [test.name]: null }));
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title heading={2}>新后端API测试</Title>
      <Space vertical style={{ width: '100%' }}>
        <Card title="API测试控制">
          <Space>
            <Button onClick={testAllApis} loading={loading} type="primary">
              测试所有API
            </Button>
            <Button onClick={() => testApi('modules', () => moduleApi.getAll())}>
              测试模块API
            </Button>
            <Button onClick={() => testApi('systems', () => systemApi.getAll())}>
              测试系统API
            </Button>
            <Button onClick={() => testApi('remoteBehaviors', () => remoteBehaviorApi.getAll())}>
              测试远程行为API
            </Button>
            <Button onClick={() => testApi('localBehaviors', () => localBehaviorApi.getAll())}>
              测试本地行为API
            </Button>
          </Space>
        </Card>

        {Object.entries(results).map(([key, value]) => (
          <Card key={key} title={`${key} 结果`}>
            {errors[key] ? (
              <Banner type="danger" description={`错误: ${errors[key]}`} />
            ) : (
              <pre
                style={{
                  background: '#f6f8fa',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </Card>
        ))}

        {loading && (
          <Card>
            <Spin tip="正在测试API..." />
          </Card>
        )}
      </Space>
    </div>
  );
};
