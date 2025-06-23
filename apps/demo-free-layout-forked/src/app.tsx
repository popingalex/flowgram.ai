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
  IconMore,
  IconGlobe,
  IconSave,
  IconUndo,
  IconBranch,
  IconHelpCircle,
} from '@douyinfe/semi-icons';

// 现有的组件

import { ModuleStoreProvider } from './stores/module.store';
import { useEntityGraphMappingActions } from './stores/entity-graph-mapping.store';
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
import { useRouter, RouteType } from './hooks/use-router';
import { RouterProvider } from './hooks/use-router';
import { Editor } from './editor';
import { TestNewArchitecture } from './components/test-new-architecture';
// import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page'; // 已删除
import { IndexedStoreTest } from './components/test/indexed-store-test';
import { ModuleManagementPage } from './components/module-management';
import { ModuleListPage } from './components/module-list-page';
import { EnumStoreProvider } from './components/ext/type-selector-ext/enum-store';
import { ExpressionListPage } from './components/expression-list';
// import { BehaviorTestPage } from './components/ext/behavior-test'; // 已删除
import { EntityWorkflowSyncer } from './components/entity-workflow-syncer';
import { EntitySelector } from './components/entity-selector';
import { EntityManagementPage } from './components/entity-management';
import { EntityListPage } from './components/entity-list-page';
import { ApiTestPanel } from './components/api-test-panel';
// import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';

const { Header, Content } = Layout;
const { Title } = Typography;

// 🔑 统一数据初始化组件 - 按正确顺序加载，建立nanoid关联
const DataStoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { entities } = useEntityList();
  const { graphs } = useGraphList();
  const { loadEntities, clearNewEntities } = useEntityListActions();
  const { loadBehaviors } = useBehaviorActions();
  const { loadGraphs, updateEntityIdMapping, updateGraphs } = useGraphActions();
  const { initializeMappings } = useEntityGraphMappingActions();

  const [entitiesLoaded, setEntitiesLoaded] = React.useState(false);
  const [behaviorsLoaded, setBehaviorsLoaded] = React.useState(false);
  const initializedRef = React.useRef(false);
  const behaviorsLoadedRef = React.useRef(false);

  // 🔑 第一步：加载实体数据
  React.useEffect(() => {
    if (!initializedRef.current) {
      console.log('🔄 [DataInit] 第一步：加载实体数据');
      clearNewEntities();
      loadEntities().then(() => {
        setEntitiesLoaded(true);
        console.log('✅ [DataInit] 实体数据加载完成');
      });
      initializedRef.current = true;
    }
  }, []); // 移除函数依赖，确保只执行一次

  // 🔑 第二步：实体加载完成后，加载行为树数据
  React.useEffect(() => {
    if (entitiesLoaded && !behaviorsLoadedRef.current) {
      console.log('🔄 [DataInit] 第二步：加载行为树数据');
      Promise.all([loadBehaviors(), loadGraphs()]).then(() => {
        setBehaviorsLoaded(true);
        behaviorsLoadedRef.current = true;
        console.log('✅ [DataInit] 行为树数据加载完成');
      });
    }
  }, [entitiesLoaded]); // 只依赖实体加载状态

  // 🔑 第三步：建立实体-行为树nanoid共享关系
  const nanoidSharingCompletedRef = React.useRef(false);

  React.useEffect(() => {
    if (
      entitiesLoaded &&
      behaviorsLoaded &&
      entities.length > 0 &&
      graphs.length > 0 &&
      !nanoidSharingCompletedRef.current
    ) {
      console.log('🔄 [DataInit] 开始nanoid共享，实体:', entities.length, '行为树:', graphs.length);

      // 🔑 关键修复：让相同业务ID的实体和行为树共用同一个nanoid
      const updatedGraphs = graphs.map((graph) => {
        // 查找对应的实体
        const matchingEntity = entities.find(
          (entity) => entity.id === graph.id || entity.id.toLowerCase() === graph.id.toLowerCase()
        );

        if (matchingEntity) {
          // 让行为树使用实体的_indexId
          return {
            ...graph,
            _indexId: matchingEntity._indexId,
          };
        }

        return graph;
      });

      // 更新graphs store中的数据
      updateGraphs(updatedGraphs);

      // 🔗 建立映射关系（现在实体和行为树有相同的_indexId了）
      initializeMappings(entities, updatedGraphs);

      nanoidSharingCompletedRef.current = true;
      console.log('✅ [DataInit] nanoid共享完成');
    }
  }, [entitiesLoaded, behaviorsLoaded]); // 只依赖加载状态，不依赖数组数据

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

// 现在直接使用RouteType，不需要单独的PageType
// type PageType = RouteType;

// 工作流编辑页面组件
const WorkflowEditPage: React.FC = () => {
  const { selectedEntityId } = useCurrentEntity();
  const { getEntityByStableId } = useEntityListActions();

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
      请选择一个实体进行工作流编辑
    </div>
  );
};

// 主应用内容组件
const AppContent: React.FC = () => {
  const { routeState, navigate } = useRouter();
  // 移除独立的currentPage状态，直接使用routeState.route
  const currentPage: RouteType = routeState.route;

  // 🔍 添加路由状态调试
  console.log('🔍 [AppContent] 路由状态:', {
    routeState,
    currentPage,
    url: window.location.href,
  });

  const { entities, loading } = useEntityList();
  const { selectedEntityId } = useCurrentEntity();
  const { selectEntity } = useCurrentEntityActions();

  // 处理实体工作流页面的实体选择
  React.useEffect(() => {
    // 如果是实体工作流页面，确保选中正确的实体
    if (routeState.route === 'entity-workflow' && routeState.entityId) {
      const entity = entities.find(
        (e) => e._indexId === routeState.entityId || e.id === routeState.entityId
      );
      if (entity && selectedEntityId !== entity._indexId) {
        selectEntity(entity);
      }
    }
  }, [routeState.route, routeState.entityId, entities, selectedEntityId, selectEntity]);
  const { getEntity, getEntityByStableId } = useEntityListActions();
  const [apiMode, setApiMode] = useState(getApiMode());
  const autoSelectedRef = React.useRef(false);

  // 🧪 测试实体切换功能
  const testEntitySwitch = React.useCallback(() => {
    console.log('=== 测试实体切换 ===');
    console.log('当前选中实体ID:', selectedEntityId);

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

  // 自动选择第一个实体 - 只在实体工作流页面执行一次
  React.useEffect(() => {
    // 🔑 修复：只在实体工作流页面执行自动选择，避免干扰其他页面
    if (
      !loading &&
      entities.length > 0 &&
      !selectedEntityId &&
      !autoSelectedRef.current &&
      currentPage === 'entity-workflow' // 🎯 关键修复：只在工作流页面执行
    ) {
      // 优先选择vehicle实体，如果没有则选择第一个
      const vehicleEntity = entities.find(
        (e) => (e as any).$id === 'vehicle' || e.id === 'vehicle'
      );
      const defaultEntity = vehicleEntity || entities[0];

      console.log('[App] 自动选择实体 (仅工作流页面):', {
        currentPage,
        totalEntities: entities.length,
        selectedEntity: defaultEntity,
        entityBusinessId: (defaultEntity as any).$id || defaultEntity.id,
      });

      selectEntity(defaultEntity);
      autoSelectedRef.current = true;
    }
  }, [entities.length, loading, selectedEntityId, currentPage]); // 添加currentPage依赖

  // 处理API模式切换
  const handleToggleApiMode = React.useCallback(() => {
    const newMode = toggleMockMode();
    setApiMode(getApiMode());
    // 刷新页面以重新加载数据
    window.location.reload();
  }, []);

  // 主要导航项
  const mainNavItems = React.useMemo(
    () => [
      { itemKey: 'entities', text: '实体列表', link: '/#entities' },
      { itemKey: 'modules', text: '模块列表', link: '/#modules' },
      {
        itemKey: 'expressions',
        text: '表达式管理',
        items: [
          { itemKey: 'exp-remote', text: '远程服务', link: '/#exp/remote' },
          { itemKey: 'exp-local', text: '本地行为函数', link: '/#exp/local' },
        ],
      },
      { itemKey: 'entity-workflow', text: '实体工作流', link: '/#entity-workflow' },
    ],
    []
  );

  // 测试页面导航项
  const testNavItems = React.useMemo(
    () => [
      { itemKey: 'api-test', text: 'API连通性测试', link: '/#api-test' },
      { itemKey: 'test-new-architecture', text: '新架构测试', link: '/#test-new-architecture' },
      { itemKey: 'test-indexed-store', text: '抽象框架测试', link: '/#test-indexed-store' },
      { itemKey: 'test-properties', text: '属性编辑器测试', link: '/#test-properties' },
      { itemKey: 'test-behavior', text: '函数行为测试', link: '/#test-behavior' },
      {
        itemKey: 'test-variable-selector',
        text: 'VariableSelector测试',
        link: '/#test-variable-selector',
      },
      // { itemKey: 'test-module-entity', text: '模块实体测试' }, // 已删除
    ],
    []
  );

  // 根据当前页面和选中实体生成编辑器内容
  const editorContent = useMemo(() => {
    if (currentPage === 'entity-workflow') {
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

  // 处理查看工作流
  const handleViewWorkflow = (entityId: string) => {
    // 设置选中的实体
    const entity = entities.find((e) => e._indexId === entityId || e.id === entityId);
    if (entity) {
      selectEntity(entity);
      navigate({ route: 'entity-workflow', entityId });
    }
  };

  // 渲染主要内容区域
  const renderMainContent = () => {
    switch (routeState.route) {
      case 'entities':
        return <EntityManagementPage />;
      case 'modules':
        return <ModuleManagementPage />;
      case 'exp-remote':
        return <ExpressionListPage />;
      case 'exp-local':
        return <ExpressionListPage />;
      case 'entity-workflow':
        return <WorkflowEditPage />;
      case 'api-test':
        return <ApiTestPanel />;
      case 'test-new-architecture':
        return <TestNewArchitecture />;
      case 'test-indexed-store':
        return <IndexedStoreTest />;
      case 'test-behavior':
        return <div>测试页面已删除</div>;
      case 'test-variable-selector':
        return <div>VariableSelector测试页面</div>;
      case 'test-properties':
        return <div>属性测试页面</div>;
      default:
        return <EntityManagementPage />;
    }
  };

  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ backgroundColor: 'var(--semi-color-bg-1)', flexShrink: 0 }}>
        <Nav
          mode="horizontal"
          selectedKeys={[currentPage]}
          header={{
            logo: <IconBranch style={{ fontSize: 36 }} />,
            text: 'Flowgram 流程设计器',
          }}
          footer={
            <Space>
              {/* 只在实体工作流页面显示实体相关控件 */}
              {currentPage === 'entity-workflow' && (
                <>
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
                </>
              )}
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
      <Content style={{ flex: 1, overflow: 'hidden' }}>{renderMainContent()}</Content>
    </Layout>
  );
};

export const App: React.FC = () => (
  <RouterProvider>
    <EnumStoreProvider>
      <ModuleStoreProvider>
        <DataStoreInitializer>
          <EntityWorkflowSyncer />
          <AppContent />
        </DataStoreInitializer>
      </ModuleStoreProvider>
    </EnumStoreProvider>
  </RouterProvider>
);

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
