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
  IconArticle,
  IconBranch,
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
  useBehaviorActions,
  useGraphActions,
  useGraphList,
} from './stores';
import { toggleMockMode, getApiMode } from './services/api-service';
import { Editor } from './editor';
import { TestNewArchitecture } from './components/test-new-architecture';
// import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page'; // 已删除
import { EnumStoreProvider } from './components/ext/type-selector-ext/enum-store';
// import { BehaviorTestPage } from './components/ext/behavior-test'; // 已删除
import { EntityWorkflowSyncer } from './components/entity-workflow-syncer';
import { EntitySelector } from './components/entity-selector';
// import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// 实体数据初始化组件 - 直接使用EntityListStore加载数据
const EntityStoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { entities } = useEntityList();
  const { loadEntities } = useEntityListActions();
  const initializedRef = React.useRef(false);

  // 只在第一次加载时获取实体数据
  React.useEffect(() => {
    if (!initializedRef.current) {
      loadEntities();
      initializedRef.current = true;
    }
  }, [loadEntities]);

  return <>{children}</>;
};

// 函数行为数据初始化组件 - 加载后台函数列表
const BehaviorStoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loadBehaviors } = useBehaviorActions();
  const { loadGraphs } = useGraphActions();
  const initializedRef = React.useRef(false);

  // 只在第一次加载时获取函数行为数据和工作流图数据
  React.useEffect(() => {
    if (!initializedRef.current) {
      loadBehaviors();
      loadGraphs();
      initializedRef.current = true;
    }
  }, [loadBehaviors, loadGraphs]);

  return <>{children}</>;
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
  // | 'test-module-entity' // 已删除
  | 'test-new-architecture'
  | 'test-behavior'
  | 'test-variable-selector';

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

  // 🧪 测试实体切换功能
  const testEntitySwitch = React.useCallback(() => {
    console.log('=== 测试实体切换 ===');
    console.log('当前选中实体ID:', selectedEntityId);
    console.log('可用实体数量:', entities.length);
    console.log(
      '所有实体:',
      entities.map((e) => ({ id: e.id, name: e.name, _indexId: e._indexId }))
    );

    // 查找task实体
    const taskEntity = entities.find((e) => e.id === 'task');
    if (taskEntity) {
      console.log('找到task实体，切换中...', taskEntity);
      selectEntity(taskEntity);
    } else {
      // 如果没有task，切换到第一个不是当前选中的实体
      const otherEntity = entities.find((e) => e._indexId !== selectedEntityId);
      if (otherEntity) {
        console.log('切换到其他实体:', otherEntity);
        selectEntity(otherEntity);
      } else {
        console.log('没有找到其他实体可以切换');
      }
    }
  }, [entities, selectedEntityId, selectEntity]);

  // 自动选择第一个实体 - 只执行一次
  React.useEffect(() => {
    if (!loading && entities.length > 0 && !selectedEntityId && !autoSelectedRef.current) {
      // 优先选择vehicle实体，如果没有则选择第一个
      const vehicleEntity = entities.find(
        (e) => (e as any).$id === 'vehicle' || e.id === 'vehicle'
      );
      const defaultEntity = vehicleEntity || entities[0];

      console.log('[App] 自动选择实体:', {
        totalEntities: entities.length,
        selectedEntity: defaultEntity,
        entityBusinessId: (defaultEntity as any).$id || defaultEntity.id,
      });

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
      { itemKey: 'test-behavior', text: '函数行为测试' },
      { itemKey: 'test-variable-selector', text: 'VariableSelector测试' },
      // { itemKey: 'test-module-entity', text: '模块实体测试' }, // 已删除
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
    switch (currentPage) {
      case 'workflow': {
        const selectedEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;

        return selectedEntity ? (
          <EntityEditProvider entity={selectedEntity}>
            <Editor />
          </EntityEditProvider>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '18px',
              color: '#666',
            }}
          >
            请选择一个实体 (selectedEntityId: {selectedEntityId})
          </div>
        );
      }
      case 'entities':
        return <EntityManagementPage />;
      case 'modules':
        return <ModuleManagementPage />;
      case 'settings':
        return <SystemSettingsPage />;
      case 'test-new-architecture':
        return <TestNewArchitecture />;
      case 'test-behavior':
        return <div>测试页面已删除</div>;
      case 'test-variable-selector':
        return <div>VariableSelector测试页面</div>;
      default:
        return <div>未知页面: {currentPage}</div>;
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
        <Nav
          mode="horizontal"
          selectedKeys={[currentPage]}
          onSelect={handleNavSelect}
          header={{
            logo: <IconBranch style={{ fontSize: 36 }} />,
            text: 'Flowgram 流程设计器',
          }}
          footer={
            <Space>
              <EntitySelector />
              <Button
                size="small"
                type="tertiary"
                onClick={testEntitySwitch}
                style={{ backgroundColor: '#ff6b6b', color: 'white' }}
              >
                测试切换
              </Button>
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
      <EntityStoreInitializer>
        <BehaviorStoreInitializer>
          <EntityWorkflowSyncer />
          <AppContent />
        </BehaviorStoreInitializer>
      </EntityStoreInitializer>
    </ModuleStoreProvider>
  </EnumStoreProvider>
);

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
