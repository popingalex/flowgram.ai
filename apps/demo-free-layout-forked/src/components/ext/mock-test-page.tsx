import React, { useState, useEffect } from 'react';

import { Button, Card, Typography, Space, Divider, Tag, List } from '@douyinfe/semi-ui';

import { useModuleStore } from './entity-property-type-selector/module-store';
import { useEnumStore } from './entity-property-type-selector/enum-store';
import { useEntityStore } from './entity-property-type-selector/entity-store';
import { MOCK_CONFIG } from './api/mock-config';

const { Title, Text } = Typography;

export const MockTestPage: React.FC = () => {
  const { modules, loading: modulesLoading } = useModuleStore();
  const { entities, loading: entitiesLoading } = useEntityStore();
  const { getAllEnumClasses } = useEnumStore();
  const [mockStatus, setMockStatus] = useState<string>('检查中...');

  const enumClasses = getAllEnumClasses();

  useEffect(() => {
    // 检查mock状态
    if (MOCK_CONFIG.ENABLED) {
      setMockStatus('✅ Mock模式已启用');
    } else {
      setMockStatus('❌ Mock模式已禁用，使用真实API');
    }
  }, []);

  const handleTestApi = async () => {
    try {
      const { apiRequest, buildApiUrl, API_CONFIG } = await import('./api/config');

      console.log('测试API调用...');
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
      const result = await apiRequest(url);
      console.log('API调用成功:', result);
      alert(`API调用成功！获取到 ${result.length} 个模块`);
    } catch (error: any) {
      console.error('API调用失败:', error);
      alert(`API调用失败: ${error.message}`);
    }
  };

  const handleClearMockData = () => {
    if (window.mockUtils) {
      window.mockUtils.clearAllMockData();
      window.location.reload();
    } else {
      alert('mockUtils不可用');
    }
  };

  const handleResetMockData = async () => {
    if (window.mockUtils) {
      await window.mockUtils.resetMockData();
      window.location.reload();
    } else {
      alert('mockUtils不可用');
    }
  };

  const handleExportData = () => {
    if (window.mockUtils) {
      const data = window.mockUtils.exportMockData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mock-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('mockUtils不可用');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title heading={2}>Mock数据系统测试页面</Title>

      {/* 状态信息 */}
      <Card title="系统状态" style={{ marginBottom: '24px' }}>
        <Space vertical style={{ width: '100%' }}>
          <div>
            <Text strong>Mock状态: </Text>
            <Tag color={MOCK_CONFIG.ENABLED ? 'green' : 'red'}>{mockStatus}</Tag>
          </div>
          <div>
            <Text strong>API延迟: </Text>
            <Text>{MOCK_CONFIG.DELAY}ms</Text>
          </div>
          <div>
            <Text strong>数据持久化: </Text>
            <Tag color={MOCK_CONFIG.PERSIST_DATA ? 'blue' : 'orange'}>
              {MOCK_CONFIG.PERSIST_DATA ? '已启用' : '已禁用'}
            </Tag>
          </div>
          <div>
            <Text strong>请求日志: </Text>
            <Tag color={MOCK_CONFIG.LOG_REQUESTS ? 'blue' : 'orange'}>
              {MOCK_CONFIG.LOG_REQUESTS ? '已启用' : '已禁用'}
            </Tag>
          </div>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <Card title="操作" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button type="primary" onClick={handleTestApi}>
            测试API调用
          </Button>
          <Button onClick={handleClearMockData}>清除Mock数据</Button>
          <Button onClick={handleResetMockData}>重置Mock数据</Button>
          <Button onClick={handleExportData}>导出数据备份</Button>
        </Space>
      </Card>

      {/* 数据统计 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card title="模块数据" loading={modulesLoading}>
          <div>
            <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-primary)' }}>
              {modules.length}
            </Text>
            <Text style={{ marginLeft: '8px' }}>个模块</Text>
          </div>
          <Divider margin="12px" />
          <Text type="secondary">包含用户信息、地址信息、车辆信息等模块</Text>
        </Card>

        <Card title="实体数据" loading={entitiesLoading}>
          <div>
            <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-success)' }}>
              {entities.length}
            </Text>
            <Text style={{ marginLeft: '8px' }}>个实体</Text>
          </div>
          <Divider margin="12px" />
          <Text type="secondary">包含客户、车辆、订单等实体</Text>
        </Card>

        <Card title="枚举类数据">
          <div>
            <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-warning)' }}>
              {enumClasses.length}
            </Text>
            <Text style={{ marginLeft: '8px' }}>个枚举类</Text>
          </div>
          <Divider margin="12px" />
          <Text type="secondary">包含车辆类型、颜色、尺寸等枚举</Text>
        </Card>
      </div>

      {/* 详细数据展示 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card title="模块列表" style={{ height: '400px', overflow: 'auto' }}>
          <List
            dataSource={modules}
            renderItem={(module) => (
              <List.Item>
                <div>
                  <Text strong>{module.name}</Text>
                  <br />
                  <Text type="secondary" size="small">
                    {module.description}
                  </Text>
                  <br />
                  <Tag size="small">{module.attributes.length} 个属性</Tag>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card title="实体列表" style={{ height: '400px', overflow: 'auto' }}>
          <List
            dataSource={entities}
            renderItem={(entity) => (
              <List.Item>
                <div>
                  <Text strong>{entity.name}</Text>
                  <br />
                  <Text type="secondary" size="small">
                    {entity.description}
                  </Text>
                  <br />
                  <Space>
                    <Tag size="small">{entity.attributes.length} 个属性</Tag>
                    {entity.bundles && (
                      <Tag size="small" color="blue">
                        {entity.bundles.length} 个模块
                      </Tag>
                    )}
                  </Space>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 使用说明 */}
      <Card title="使用说明" style={{ marginTop: '24px' }}>
        <Space vertical style={{ width: '100%' }}>
          <Text>1. 当前系统运行在Mock模式下，所有数据都是模拟数据</Text>
          <Text>2. 您可以在模块选择器和实体编辑器中正常操作，数据会保存在localStorage中</Text>
          <Text>3. 打开浏览器控制台可以看到API调用日志</Text>
          <Text>
            4. 在控制台中使用 <code>mockUtils</code> 对象可以管理mock数据
          </Text>
          <Text>
            5. 要切换到真实API，请修改 <code>mock-config.ts</code> 中的 <code>ENABLED</code> 为{' '}
            <code>false</code>
          </Text>
        </Space>
      </Card>
    </div>
  );
};

// 扩展window类型以支持mockUtils
declare global {
  interface Window {
    mockUtils?: {
      clearAllMockData: () => void;
      resetMockData: () => Promise<void>;
      exportMockData: () => string;
      importMockData: (data: string) => void;
      config: any;
    };
  }
}
