import '@csstools/normalize.css';
import React, { useState, useEffect, useMemo } from 'react';

import styled from 'styled-components';
import { createRoot } from 'react-dom/client';
import {
  Nav,
  Layout,
  Typography,
  Avatar,
  Button,
  Dropdown,
  Space,
  Tag,
  Modal,
  Toast,
  Select,
  Form,
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
  IconSave,
  IconUndo,
} from '@douyinfe/semi-icons';

// 现有的组件
import { ModuleStoreProvider } from './stores/module.store';
import {
  useEntityStore,
  EntityEditProvider,
  useEntityEditState,
  useEntityEditActions,
  useEntityList,
  useEntityListActions,
  useCurrentEntity,
  useCurrentEntityActions,
} from './stores';
import { toggleMockMode, getApiMode } from './services/api-service';
import { Editor } from './editor';
import { TestNewArchitecture } from './components/test-new-architecture';
import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page';
import { EntityStoreTestPage } from './components/ext/entity-store/test-page';
import {
  EntityStoreProvider,
  useEntityStore as useOldEntityStore,
} from './components/ext/entity-store';
import { EnumStoreProvider } from './components/ext/entity-property-type-selector/enum-store';
import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// 数据初始化组件 - 从旧的EntityStore获取数据并设置到新的EntityStore
const EntityStoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { entities: oldEntities, loading: oldLoading } = useOldEntityStore();
  const { entities } = useEntityList();
  const { setEntities, setLoading } = useEntityListActions();
  const initializedRef = React.useRef(false);

  // 将旧EntityStore的数据同步到新EntityStore - 只执行一次
  React.useEffect(() => {
    if (!oldLoading && oldEntities.length > 0 && !initializedRef.current) {
      console.log('Initializing new EntityStore with data:', oldEntities);
      setEntities(oldEntities);
      setLoading(false);
      initializedRef.current = true;
    }
  }, [oldEntities.length, oldLoading]); // 移除函数依赖，只依赖数据状态

  // 只在初始加载时同步加载状态
  React.useEffect(() => {
    if (!initializedRef.current) {
      setLoading(oldLoading);
    }
  }, [oldLoading]); // 移除setLoading依赖

  return <>{children}</>;
};

// 使用新Zustand store的实体管理组件
const EntityManagementSection: React.FC = () => {
  const { entities, loading } = useEntityList();
  const { selectedEntityId } = useCurrentEntity();
  const { selectEntity } = useCurrentEntityActions();

  const handleEntityChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    const entityId = typeof value === 'string' ? value : null;
    if (entityId) {
      const entity = entities.find((e) => e._indexId === entityId);
      if (entity) {
        selectEntity(entity);
      }
    } else {
      selectEntity(null);
    }
  };

  return (
    <Space align="center">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Form.Label>当前实体:</Form.Label>
        <Select
          placeholder="选择实体"
          style={{ width: 200 }}
          value={selectedEntityId || undefined}
          onChange={handleEntityChange}
          loading={loading}
          showClear
        >
          {entities.map((entity) => (
            <Select.Option key={entity._indexId} value={entity._indexId}>
              {entity.name} ({entity.id})
            </Select.Option>
          ))}
        </Select>
      </div>
    </Space>
  );
};

// 编辑操作组件（需要在EntityEditProvider内部使用）
const EntityEditActions: React.FC = () => {
  const { isDirty, isSaving } = useEntityEditState();
  const { saveChanges, resetChanges } = useEntityEditActions();

  // 处理保存
  const handleSave = async () => {
    try {
      await saveChanges();
      Toast.success('保存成功');
    } catch (error) {
      Toast.error('保存失败');
    }
  };

  // 处理重置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置所有未保存的修改吗？此操作不可撤销。',
      // zIndex: 1001,
      onOk: () => {
        resetChanges();
        Toast.success('已重置到原始状态');
      },
    });
  };

  return (
    <Space>
      <Button
        icon={<IconSave />}
        onClick={handleSave}
        disabled={!isDirty}
        loading={isSaving}
        type="primary"
        size="small"
      >
        保存
      </Button>

      <Button icon={<IconUndo />} onClick={handleReset} disabled={!isDirty} size="small">
        撤销
      </Button>
    </Space>
  );
};

type PageType =
  | 'workflow'
  | 'entities'
  | 'modules'
  | 'settings'
  | 'test-properties'
  | 'test-store'
  | 'test-module-entity'
  | 'test-new-architecture';

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
  const { entities, loading } = useEntityList();
  const { selectedEntityId } = useCurrentEntity();
  const { selectEntity } = useCurrentEntityActions();
  const { getEntity, getEntityByStableId } = useEntityListActions();
  const [apiMode, setApiMode] = useState(getApiMode());
  const autoSelectedRef = React.useRef(false);

  // 自动选择第一个实体 - 只执行一次
  React.useEffect(() => {
    if (!loading && entities.length > 0 && !selectedEntityId && !autoSelectedRef.current) {
      // 优先选择vehicle实体，如果没有则选择第一个
      const vehicleEntity = entities.find((e) => e.id === 'vehicle');
      const defaultEntity = vehicleEntity || entities[0];

      console.log('Auto-selecting entity:', defaultEntity.id);
      selectEntity(defaultEntity);
      autoSelectedRef.current = true;
    }
  }, [entities.length, loading, selectedEntityId]); // 移除selectEntity依赖，只依赖数据状态

  // 处理API模式切换
  const handleToggleApiMode = React.useCallback(() => {
    const newMode = toggleMockMode();
    setApiMode(getApiMode());
    // 刷新页面以重新加载数据
    window.location.reload();
  }, []);

  // 处理导航选择
  const handleNavSelect = React.useCallback((data: any) => {
    if (data.selectedKeys && data.selectedKeys.length > 0) {
      setCurrentPage(data.selectedKeys[0] as PageType);
    }
  }, []);

  // 主要导航项
  const mainNavItems = React.useMemo(
    () => [
      { itemKey: 'workflow', text: '流程设计' },
      { itemKey: 'entities', text: '实体管理' },
      { itemKey: 'modules', text: '模块管理' },
      { itemKey: 'settings', text: '系统设置' },
    ],
    []
  );

  // 测试页面导航项
  const testNavItems = React.useMemo(
    () => [
      { itemKey: 'test-new-architecture', text: '新架构测试' },
      { itemKey: 'test-properties', text: '属性编辑器测试' },
      { itemKey: 'test-store', text: '实体存储测试' },
      { itemKey: 'test-module-entity', text: '模块实体测试' },
    ],
    []
  );

  // 根据当前页面和选中实体生成编辑器内容
  const editorContent = useMemo(() => {
    if (currentPage === 'workflow') {
      const selectedEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;
      return selectedEntity ? (
        <EntityEditProvider entity={selectedEntity}>
          <Editor />
        </EntityEditProvider>
      ) : (
        <div>请选择一个实体</div>
      );
    }
    return <div>未知页面</div>;
  }, [currentPage, selectedEntityId]); // 移除getEntity依赖

  // 渲染主要内容区域
  const renderMainContent = () => {
    if (currentPage === 'workflow') {
      const selectedEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;
      return selectedEntity ? (
        <EntityEditProvider entity={selectedEntity}>
          <Editor />
        </EntityEditProvider>
      ) : (
        <div>请选择一个实体</div>
      );
    }
    return <div>未知页面</div>;
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
        <Nav
          mode="horizontal"
          selectedKeys={[currentPage]}
          onSelect={handleNavSelect}
          header={{
            logo: <IconSemiLogo style={{ fontSize: 36 }} />,
            text: 'Flowgram 流程设计器',
          }}
          footer={
            <Space>
              <EntityManagementSection />
              {(() => {
                const selectedEntity = selectedEntityId
                  ? getEntityByStableId(selectedEntityId)
                  : null;
                return selectedEntity ? (
                  <EntityEditProvider entity={selectedEntity}>
                    <EntityEditActions />
                  </EntityEditProvider>
                ) : null;
              })()}
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleToggleApiMode}>
                      <Space>
                        <IconGlobe />
                        <span>切换到 {apiMode.isMockMode ? '真实' : '模拟'} API</span>
                        <Tag color={apiMode.isMockMode ? 'orange' : 'green'} size="small">
                          {apiMode.isMockMode ? 'Mock' : 'Real'}
                        </Tag>
                      </Space>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item>
                      <Space>
                        <IconHelpCircle />
                        <span>帮助文档</span>
                      </Space>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <Avatar size="small" style={{ margin: 4 }}>
                  <IconMore />
                </Avatar>
              </Dropdown>
            </Space>
          }
          items={[
            ...mainNavItems,
            {
              itemKey: 'test',
              text: '测试页面',
              items: testNavItems,
            },
          ]}
        />
      </Header>
      <Content>{renderMainContent()}</Content>
    </Layout>
  );
};

export const App: React.FC = () => (
  <EnumStoreProvider>
    <ModuleStoreProvider>
      <EntityStoreProvider>
        <EntityStoreInitializer>
          <AppContent />
        </EntityStoreInitializer>
      </EntityStoreProvider>
    </ModuleStoreProvider>
  </EnumStoreProvider>
);

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
