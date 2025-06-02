import React, { useState, useEffect } from 'react';

import { createRoot } from 'react-dom/client';
import {
  Nav,
  Layout,
  Select,
  Typography,
  Avatar,
  Button,
  Dropdown,
  Space,
  Tag,
} from '@douyinfe/semi-ui';
import {
  IconCode,
  IconUser,
  IconFolder,
  IconSetting,
  IconBell,
  IconHelpCircle,
  IconSemiLogo,
  IconMore,
  IconGlobe,
} from '@douyinfe/semi-icons';

// 现有的组件
import { toggleMockMode, getApiMode } from './services/api-service';
import { Editor } from './editor';
import { PropertyTableTestPage } from './components/ext/property-table/test-page';
import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page';
import { EntityStoreTestPage } from './components/ext/entity-store/test-page';
import { EntityStoreProvider, useEntityStore } from './components/ext/entity-store';
import { ModuleStoreProvider } from './components/ext/entity-property-type-selector/module-store';
import { EnumStoreProvider } from './components/ext/entity-property-type-selector/enum-store';
import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

type PageType =
  | 'workflow'
  | 'entities'
  | 'modules'
  | 'settings'
  | 'test-properties'
  | 'test-store'
  | 'test-module-entity'
  | 'test-property-table';

// 实体选择器组件
const EntitySelector: React.FC<{
  selectedEntityId: string | null;
  onEntityChange: (entityId: string | null) => void;
}> = ({ selectedEntityId, onEntityChange }) => {
  const { entities, loading } = useEntityStore();

  const handleChange = (
    value: string | number | string[] | Record<string, unknown> | undefined
  ) => {
    if (typeof value === 'string') {
      onEntityChange(value);
    } else {
      onEntityChange(null);
    }
  };

  return (
    <Select
      placeholder="选择实体"
      style={{ width: 200 }}
      value={selectedEntityId || undefined}
      onChange={handleChange}
      loading={loading}
      showClear
    >
      {entities.map((entity) => (
        <Select.Option key={entity.id} value={entity.id}>
          {entity.name} ({entity.id})
        </Select.Option>
      ))}
    </Select>
  );
};

// 简单的页面组件
const EntityManagementPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <Title heading={3} style={{ marginBottom: '24px' }}>
      实体管理
    </Title>
    <Text type="secondary">实体管理功能正在开发中...</Text>
  </div>
);

const ModuleManagementPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <Title heading={3} style={{ marginBottom: '24px' }}>
      模块管理
    </Title>
    <Text type="secondary">模块管理功能正在开发中...</Text>
  </div>
);

const SystemSettingsPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <Title heading={3} style={{ marginBottom: '24px' }}>
      系统设置
    </Title>
    <Text type="secondary">系统配置和设置选项</Text>
  </div>
);

// 主应用内容组件
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('workflow');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { entities, loading, getEntityCompleteProperties } = useEntityStore();
  const [apiMode, setApiMode] = useState(getApiMode());

  // 自动选择第一个实体
  useEffect(() => {
    if (!loading && entities.length > 0 && !selectedEntityId) {
      // 使用setTimeout来避免在渲染过程中直接setState
      const timer = setTimeout(() => {
        setSelectedEntityId(entities[0].id);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [entities, loading, selectedEntityId]);

  // 处理API模式切换
  const handleToggleApiMode = () => {
    const newMode = toggleMockMode();
    setApiMode(getApiMode());
    // 刷新页面以重新加载数据
    window.location.reload();
  };

  // 调试功能：打印实体属性信息
  const handleDebugEntityProperties = () => {
    if (!selectedEntityId) {
      console.log('没有选中的实体');
      return;
    }

    const properties = getEntityCompleteProperties(selectedEntityId);

    console.log('=== 实体属性调试信息 ===');
    console.log('当前选中实体ID:', selectedEntityId);
    console.log('完整属性结构:', properties);

    if (properties) {
      console.log('节点显示属性数量:', Object.keys(properties.allProperties.properties).length);
      console.log(
        '抽屉编辑属性数量:',
        Object.keys(properties.editableProperties.properties).length
      );
      console.log('总属性数量:', Object.keys(properties.allProperties.properties).length);
    }
  };

  // 主要导航项
  const mainNavItems = [
    { itemKey: 'workflow', text: '流程设计' },
    { itemKey: 'entities', text: '实体管理' },
    { itemKey: 'modules', text: '模块管理' },
    { itemKey: 'settings', text: '系统设置' },
  ];

  // 测试页面下拉菜单
  const testMenuItems = [
    { node: 'item', name: '属性编辑器测试', onClick: () => setCurrentPage('test-properties') },
    { node: 'item', name: '实体Store测试', onClick: () => setCurrentPage('test-store') },
    { node: 'item', name: '模块实体编辑器', onClick: () => setCurrentPage('test-module-entity') },
    { node: 'item', name: '属性表测试', onClick: () => setCurrentPage('test-property-table') },
  ];

  const handleNavSelect = ({ selectedKeys }: { selectedKeys: string[] }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setCurrentPage(selectedKeys[0] as PageType);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'workflow':
        return <Editor selectedEntityId={selectedEntityId} />;
      case 'entities':
        return <EntityManagementPage />;
      case 'modules':
        return <ModuleManagementPage />;
      case 'settings':
        return <SystemSettingsPage />;
      case 'test-properties':
        return <EntityPropertiesEditorTestPage />;
      case 'test-store':
        return <EntityStoreTestPage />;
      case 'test-module-entity':
        return <ModuleEntityTestPage />;
      case 'test-property-table':
        return <PropertyTableTestPage />;
      default:
        return <Editor selectedEntityId={selectedEntityId} />;
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航 */}
      <Header
        style={{
          backgroundColor: 'var(--semi-color-bg-1)',
          padding: '0 24px',
          borderBottom: '1px solid var(--semi-color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>
            Flowgram 工作流编辑器
          </Text>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text type="secondary">当前实体:</Text>
            <EntitySelector
              selectedEntityId={selectedEntityId}
              onEntityChange={setSelectedEntityId}
            />
          </div>
        </div>

        <Space>
          {/* API模式切换按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text type="secondary" size="small">
              API模式:
            </Text>
            <Tag color={apiMode.isMockMode ? 'orange' : 'green'} size="small">
              {apiMode.mode}
            </Tag>
            <Button
              size="small"
              icon={apiMode.isMockMode ? <IconGlobe /> : <IconCode />}
              onClick={handleToggleApiMode}
              type={apiMode.isMockMode ? 'primary' : 'secondary'}
            >
              切换到{apiMode.isMockMode ? '真实API' : 'Mock模式'}
            </Button>
          </div>

          {/* 调试按钮 */}
          <Button size="small" onClick={handleDebugEntityProperties}>
            调试
          </Button>
        </Space>
      </Header>

      {/* 主内容区域 */}
      <Content style={{ backgroundColor: 'var(--semi-color-bg-0)', overflow: 'hidden' }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

export const App: React.FC = () => (
  <EnumStoreProvider>
    <ModuleStoreProvider>
      <EntityStoreProvider>
        <AppContent />
      </EntityStoreProvider>
    </ModuleStoreProvider>
  </EnumStoreProvider>
);

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
