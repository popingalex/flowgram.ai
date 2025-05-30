import React, { useState, useEffect } from 'react';

import { Card, Typography, Button, Space, Spin, List, Tag } from '@douyinfe/semi-ui';

import { API_CONFIG, buildApiUrl, apiRequest } from './api/config';

const { Title, Text } = Typography;

export const ApiTestPage: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testModuleAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
      console.log('Testing module API:', url);
      const result = await apiRequest(url);
      setModules(result);
      console.log('Module API test successful:', result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`模块API测试失败: ${errorMsg}`);
      console.error('Module API test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testEntityAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
      console.log('Testing entity API:', url);
      const result = await apiRequest(url);
      setEntities(result);
      console.log('Entity API test successful:', result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`实体API测试失败: ${errorMsg}`);
      console.error('Entity API test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testBothAPIs = async () => {
    await testModuleAPI();
    await testEntityAPI();
  };

  useEffect(() => {
    // 页面加载时自动测试
    testBothAPIs();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title heading={2}>API连接测试</Title>

      <Card style={{ marginBottom: '24px' }}>
        <Title heading={4}>API配置</Title>
        <Text>Base URL: {API_CONFIG.BASE_URL}</Text>
        <br />
        <Text>模块接口: {buildApiUrl(API_CONFIG.ENDPOINTS.MODULE)}</Text>
        <br />
        <Text>实体接口: {buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY)}</Text>

        <div style={{ marginTop: '16px' }}>
          <Space>
            <Button onClick={testModuleAPI} loading={loading} type="primary">
              测试模块API
            </Button>
            <Button onClick={testEntityAPI} loading={loading} type="primary">
              测试实体API
            </Button>
            <Button onClick={testBothAPIs} loading={loading}>
              测试所有API
            </Button>
          </Space>
        </div>

        {error && (
          <div style={{ marginTop: '16px' }}>
            <Text type="danger">{error}</Text>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 模块数据 */}
        <Card title={`模块数据 (${modules.length})`} style={{ flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={modules}
              renderItem={(module) => (
                <List.Item>
                  <div>
                    <Title heading={6} style={{ margin: 0 }}>
                      {module.name} ({module.id})
                    </Title>
                    <Text type="secondary" size="small">
                      属性数量: {module.attributes?.length || 0}
                    </Text>
                    {module.deprecated && (
                      <Tag color="red" style={{ marginLeft: '8px' }}>
                        已废弃
                      </Tag>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      {module.attributes?.slice(0, 3).map((attr: any) => (
                        <Tag key={attr.id} style={{ marginRight: '4px', marginBottom: '4px' }}>
                          {attr.name || attr.id}
                        </Tag>
                      ))}
                      {module.attributes?.length > 3 && (
                        <Text type="tertiary" size="small">
                          ...还有 {module.attributes.length - 3} 个属性
                        </Text>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 实体数据 */}
        <Card title={`实体数据 (${entities.length})`} style={{ flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={entities}
              renderItem={(entity) => (
                <List.Item>
                  <div>
                    <Title heading={6} style={{ margin: 0 }}>
                      {entity.name} ({entity.id})
                    </Title>
                    <Text type="secondary" size="small">
                      属性数量: {entity.attributes?.length || 0}
                    </Text>
                    {entity.deprecated && (
                      <Tag color="red" style={{ marginLeft: '8px' }}>
                        已废弃
                      </Tag>
                    )}
                    {entity.bundles && entity.bundles.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <Text size="small" type="tertiary">
                          关联模块: {entity.bundles.join(', ')}
                        </Text>
                      </div>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      {entity.attributes?.slice(0, 3).map((attr: any) => (
                        <Tag key={attr.id} style={{ marginRight: '4px', marginBottom: '4px' }}>
                          {attr.name || attr.id}
                        </Tag>
                      ))}
                      {entity.attributes?.length > 3 && (
                        <Text type="tertiary" size="small">
                          ...还有 {entity.attributes.length - 3} 个属性
                        </Text>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
