import React, { useState } from 'react';

import { createRoot } from 'react-dom/client';
import { Nav, Layout, Select, Typography, Avatar, Button, Dropdown } from '@douyinfe/semi-ui';
import {
  IconCode,
  IconUser,
  IconFolder,
  IconSetting,
  IconBell,
  IconHelpCircle,
  IconSemiLogo,
  IconMore,
} from '@douyinfe/semi-icons';

import { WorkflowEditor } from './components/workflow-editor';
import { SidebarProvider } from './components/sidebar/sidebar-provider';

// 测试页面组件（放在下拉菜单中）
import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page';
import { EntityStoreTestPage } from './components/ext/entity-store/test-page';
import { ModuleStoreProvider } from './components/ext/entity-property-type-selector/module-store';
import {
  EntityStoreProvider,
  useEntityStore,
} from './components/ext/entity-property-type-selector/entity-store';
import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';
import { ApiTestPage } from './components/ext/api-test-page';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

type PageType =
  | 'workflow'
  | 'entities'
  | 'modules'
  | 'settings'
  | 'test-api'
  | 'test-properties'
  | 'test-store'
  | 'test-module-entity';

// 实体选择器组件
const EntitySelector: React.FC<{
  selectedEntityId: string | null;
  onEntityChange: (entityId: string | null) => void;
}> = ({ selectedEntityId, onEntityChange }) => {
  const { entities, loading } = useEntityStore();

  const handleChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    // 只处理字符串类型的值，其他类型转为null
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

// 实体管理页面
const EntityManagementPage: React.FC = () => {
  const { entities } = useEntityStore();

  return (
    <div style={{ padding: '24px' }}>
      <Title heading={3} style={{ marginBottom: '24px' }}>
        实体管理
      </Title>
      <Text type="secondary">实体管理功能正在开发中...</Text>
    </div>
  );
};

// 模块管理页面
const ModuleManagementPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <Title heading={3} style={{ marginBottom: '24px' }}>
      模块管理
    </Title>
    <Text type="secondary">模块管理功能正在开发中...</Text>
  </div>
);

// 系统设置页面
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

  // 主要导航项
  const mainNavItems = [
    { itemKey: 'workflow', text: '流程设计' },
    { itemKey: 'entities', text: '实体管理' },
    { itemKey: 'modules', text: '模块管理' },
    { itemKey: 'settings', text: '系统设置' },
  ];

  // 测试页面下拉菜单
  const testMenuItems = [
    { node: 'item', name: 'API连接测试', onClick: () => setCurrentPage('test-api') },
    { node: 'item', name: '属性编辑器测试', onClick: () => setCurrentPage('test-properties') },
    { node: 'item', name: '实体Store测试', onClick: () => setCurrentPage('test-store') },
    { node: 'item', name: '模块实体编辑器', onClick: () => setCurrentPage('test-module-entity') },
  ];

  const handleNavSelect = ({ selectedKeys }: { selectedKeys: any[] }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setCurrentPage(selectedKeys[0] as PageType);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'workflow':
        return (
          <SidebarProvider selectedEntityId={selectedEntityId}>
            <div style={{ height: '100%', position: 'relative' }}>
              <WorkflowEditor
                selectedEntityId={selectedEntityId}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </SidebarProvider>
        );
      case 'entities':
        return <EntityManagementPage />;
      case 'modules':
        return <ModuleManagementPage />;
      case 'settings':
        return <SystemSettingsPage />;
      case 'test-api':
        return <ApiTestPage />;
      case 'test-properties':
        return <EntityPropertiesEditorTestPage />;
      case 'test-store':
        return <EntityStoreTestPage />;
      case 'test-module-entity':
        return <ModuleEntityTestPage />;
      default:
        return (
          <SidebarProvider selectedEntityId={selectedEntityId}>
            <div style={{ height: '100%', position: 'relative' }}>
              <WorkflowEditor
                selectedEntityId={selectedEntityId}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </SidebarProvider>
        );
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航 */}
      <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
        <Nav
          mode="horizontal"
          selectedKeys={[currentPage]}
          onSelect={handleNavSelect}
          header={{
            logo: <IconSemiLogo style={{ fontSize: 36 }} />,
            text: '智能工作流管理系统',
          }}
          items={mainNavItems}
          footer={
            <>
              {/* 实体选择器 - 只在流程设计页面显示 */}
              {currentPage === 'workflow' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginRight: '24px',
                  }}
                >
                  <Text type="secondary">当前实体:</Text>
                  <EntitySelector
                    selectedEntityId={selectedEntityId}
                    onEntityChange={setSelectedEntityId}
                  />
                </div>
              )}

              {/* 测试功能下拉菜单 */}
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    {testMenuItems.map((item, index) => (
                      <Dropdown.Item key={index} onClick={item.onClick}>
                        {item.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                }
              >
                <Button
                  theme="borderless"
                  icon={<IconMore size="large" />}
                  style={{
                    color: 'var(--semi-color-text-2)',
                    marginRight: '12px',
                  }}
                >
                  测试功能
                </Button>
              </Dropdown>

              <Button
                theme="borderless"
                icon={<IconBell size="large" />}
                style={{
                  color: 'var(--semi-color-text-2)',
                  marginRight: '12px',
                }}
              />
              <Button
                theme="borderless"
                icon={<IconHelpCircle size="large" />}
                style={{
                  color: 'var(--semi-color-text-2)',
                  marginRight: '12px',
                }}
              />
              <Avatar color="orange" size="small">
                YJ
              </Avatar>
            </>
          }
        />
      </Header>

      {/* 主内容区域 - 全屏显示 */}
      <Content style={{ backgroundColor: 'var(--semi-color-bg-0)', overflow: 'hidden' }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

export const App: React.FC = () => (
  <ModuleStoreProvider>
    <EntityStoreProvider>
      <AppContent />
    </EntityStoreProvider>
  </ModuleStoreProvider>
);

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
