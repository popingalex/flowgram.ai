import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { nanoid } from 'nanoid';
import {
  Button,
  Space,
  Typography,
  Modal,
  Input,
  TextArea,
  Select,
  Toast,
  Tag,
  Popconfirm,
  List,
  Highlight,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconSetting, IconPlay } from '@douyinfe/semi-icons';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { useModuleStore } from '../../stores';
import { EntityEditProvider } from '../../stores';
import { EcsWorkflowEditor } from './ecs-workflow-editor';

const { Text } = Typography;

// 工作流系统数据结构
interface WorkflowSystem {
  _indexId: string; // nanoid，React key专用
  id: string; // 业务ID，如 "vehicle_control_system"
  name: string; // 显示名称，如 "载具控制系统"
  description?: string; // 描述
  moduleIds: string[]; // 关联的模块ID列表
  enabled: boolean; // 是否启用
  status: 'enabled' | 'disabled' | 'draft'; // 系统状态

  // 工作流图数据
  nodes: any[];
  edges: any[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  version: string;
}

// 模块-工作流关联表
interface ModuleSystemMapping {
  moduleId: string; // 模块ID
  systemId: string; // 系统ID
  role: 'primary' | 'secondary'; // 主要/次要角色
  createdAt: string;
}

// 创建默认工作流数据（包含start节点）
const createDefaultWorkflowData = (
  systemId: string,
  systemName: string,
  systemDescription?: string
) => {
  const startNodeId = nanoid();
  return {
    nodes: [
      {
        id: startNodeId,
        type: 'start',
        meta: {
          position: { x: 200, y: 100 },
          isStart: true,
          deleteDisable: true,
          copyDisable: true,
        },
        data: {
          title: systemName,
          id: systemId,
          description: systemDescription || '',
        },
      },
    ],
    edges: [],
  };
};

// Mock数据
const mockWorkflowSystems: WorkflowSystem[] = [
  {
    _indexId: nanoid(),
    id: 'vehicle_control_system',
    name: '载具控制系统',
    description: '管理载具的移动、旋转和状态控制',
    moduleIds: ['mobile', 'controlled', 'vehicle'],
    enabled: true,
    status: 'enabled',
    ...createDefaultWorkflowData(
      'vehicle_control_system',
      '载具控制系统',
      '管理载具的移动、旋转和状态控制'
    ),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
  },
  {
    _indexId: nanoid(),
    id: 'task_execution_system',
    name: '任务执行系统',
    description: '处理任务的分配、执行和状态跟踪',
    moduleIds: ['task', 'controlled'],
    enabled: true,
    status: 'enabled',
    ...createDefaultWorkflowData(
      'task_execution_system',
      '任务执行系统',
      '处理任务的分配、执行和状态跟踪'
    ),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
  },
  {
    _indexId: nanoid(),
    id: 'scene_management_system',
    name: '场景管理系统',
    description: '管理场景元素和环境状态',
    moduleIds: ['scene', 'container'],
    enabled: false,
    status: 'draft',
    ...createDefaultWorkflowData(
      'scene_management_system',
      '场景管理系统',
      '管理场景元素和环境状态'
    ),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
  },
];

// 系统编辑表单
interface SystemFormData {
  id: string;
  name: string;
  description: string;
  moduleIds: string[];
}

const SystemEditModal: React.FC<{
  visible: boolean;
  system?: WorkflowSystem;
  onOk: (data: SystemFormData) => void;
  onCancel: () => void;
}> = ({ visible, system, onOk, onCancel }) => {
  const { modules } = useModuleStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SystemFormData>({
    id: '',
    name: '',
    description: '',
    moduleIds: [],
  });

  useEffect(() => {
    if (visible && system) {
      setFormData({
        id: system.id,
        name: system.name,
        description: system.description || '',
        moduleIds: system.moduleIds,
      });
    } else if (visible) {
      setFormData({
        id: '',
        name: '',
        description: '',
        moduleIds: [],
      });
    }
  }, [visible, system]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // 简单验证
      if (!formData.id || !formData.name || formData.moduleIds.length === 0) {
        Toast.error('请填写所有必填字段');
        return;
      }
      onOk(formData);
    } catch (error) {
      console.error('表单提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={system ? '编辑工作流系统' : '创建工作流系统'}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            系统ID <span style={{ color: 'red' }}>*</span>
          </label>
          <Input
            value={formData.id}
            placeholder="如: vehicle_control_system"
            disabled={!!system}
            onChange={(value) => setFormData({ ...formData, id: value })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            系统名称 <span style={{ color: 'red' }}>*</span>
          </label>
          <Input
            value={formData.name}
            placeholder="如: 载具控制系统"
            onChange={(value) => setFormData({ ...formData, name: value })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>描述</label>
          <TextArea
            value={formData.description}
            placeholder="请描述系统的功能和用途"
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            关联模块 <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            value={formData.moduleIds}
            placeholder="选择系统使用的模块"
            multiple
            onChange={(value) => setFormData({ ...formData, moduleIds: value as string[] })}
            style={{ width: '100%' }}
          >
            {modules.map((module) => (
              <Select.Option key={module.id} value={module.id}>
                {module.name || module.id}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
};

export const EcsBehaviorEditor: React.FC = () => {
  const { modules } = useModuleStore();
  const [systems, setSystems] = useState<WorkflowSystem[]>(mockWorkflowSystems);
  const [selectedSystem, setSelectedSystem] = useState<WorkflowSystem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSystem, setEditingSystem] = useState<WorkflowSystem | undefined>();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 获取模块名称
  const getModuleName = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    return module?.name || moduleId;
  };

  // 过滤后的系统列表
  const filteredSystems = useMemo(() => {
    if (!searchText.trim()) return systems;

    const searchLower = searchText.toLowerCase();
    return systems.filter((system) => {
      // 搜索系统ID和名称
      const matchesBasic =
        system.id?.toLowerCase().includes(searchLower) ||
        system.name?.toLowerCase().includes(searchLower) ||
        system.description?.toLowerCase().includes(searchLower);

      // 搜索关联的模块
      const matchesModules = system.moduleIds?.some((moduleId) => {
        const module = modules.find((m) => m.id === moduleId);
        return (
          moduleId?.toLowerCase().includes(searchLower) ||
          module?.name?.toLowerCase().includes(searchLower)
        );
      });

      // 搜索状态
      const matchesStatus = system.status?.toLowerCase().includes(searchLower);

      return matchesBasic || matchesModules || matchesStatus;
    });
  }, [systems, searchText, modules]);

  // 选择系统
  const handleSystemSelect = useCallback((system: WorkflowSystem) => {
    setSelectedSystem(system);
  }, []);

  // 默认选中第一个系统
  useEffect(() => {
    if (!loading && systems.length > 0 && !selectedSystem) {
      const firstSystem = systems[0];
      console.log('🎯 默认选中第一个系统:', firstSystem.name);
      setSelectedSystem(firstSystem);
    }
  }, [loading, systems, selectedSystem]);

  // 创建系统
  const handleCreateSystem = useCallback(() => {
    setEditingSystem(undefined);
    setEditModalVisible(true);
  }, []);

  // 编辑系统
  const handleEditSystem = useCallback((system: WorkflowSystem) => {
    setEditingSystem(system);
    setEditModalVisible(true);
  }, []);

  // 删除系统
  const handleDeleteSystem = useCallback(
    (system: WorkflowSystem) => {
      setSystems((prev) => prev.filter((s) => s._indexId !== system._indexId));
      if (selectedSystem?._indexId === system._indexId) {
        setSelectedSystem(null);
      }
      Toast.success('系统删除成功');
    },
    [selectedSystem]
  );

  // 保存系统
  const handleSaveSystem = useCallback(
    (data: SystemFormData) => {
      if (editingSystem) {
        // 编辑现有系统
        setSystems((prev) =>
          prev.map((system) =>
            system._indexId === editingSystem._indexId
              ? { ...system, ...data, updatedAt: new Date().toISOString() }
              : system
          )
        );
        Toast.success('系统更新成功');
      } else {
        // 创建新系统
        const newSystem: WorkflowSystem = {
          _indexId: nanoid(),
          ...data,
          enabled: true,
          status: 'draft',
          ...createDefaultWorkflowData(data.id, data.name, data.description),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
        };
        setSystems((prev) => [...prev, newSystem]);
        Toast.success('系统创建成功');
      }
      setEditModalVisible(false);
    },
    [editingSystem]
  );

  // 刷新数据
  const handleRefresh = useCallback(() => {
    setLoading(true);
    // 模拟刷新
    setTimeout(() => {
      setLoading(false);
      Toast.info('数据已刷新');
    }, 500);
  }, []);

  // 打开工作流编辑器
  const handleOpenWorkflowEditor = useCallback((system: WorkflowSystem) => {
    // TODO: 实现跳转到工作流编辑器
    Toast.info(`即将打开 ${system.name} 的工作流编辑器`);
  }, []);

  // 自定义系统列表项渲染
  const renderSystemItem = useCallback(
    (system: WorkflowSystem, isSelected: boolean) => {
      const searchWords = searchText.trim() ? [searchText.trim()] : [];

      // 状态颜色映射
      const statusColorMap = {
        enabled: 'green' as const,
        disabled: 'orange' as const,
        draft: 'grey' as const,
      };

      const statusTextMap = {
        enabled: '已启用',
        disabled: '已禁用',
        draft: '草稿',
      };

      return (
        <List.Item
          onClick={() => handleSystemSelect(system)}
          style={{
            backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
            padding: '12px 16px',
            cursor: 'pointer',
          }}
          className="data-list-item"
        >
          <div style={{ width: '100%' }}>
            {/* 第一行：系统信息 + 状态 */}
            <div
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '13px',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Highlight sourceString={system.id} searchWords={searchWords} />
                </Text>
                {system.name && (
                  <Text
                    type="secondary"
                    size="small"
                    style={{
                      color: 'var(--semi-color-text-1)',
                      display: 'block',
                      margin: '2px 0 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <Highlight sourceString={system.name} searchWords={searchWords} />
                  </Text>
                )}
                {system.description && (
                  <Text
                    type="tertiary"
                    size="small"
                    style={{
                      display: 'block',
                      margin: '4px 0 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <Highlight sourceString={system.description} searchWords={searchWords} />
                  </Text>
                )}
              </div>
              <div
                style={{
                  flexShrink: 0,
                  marginLeft: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'flex-end',
                }}
              >
                <Tag size="small" color={statusColorMap[system.status]}>
                  {statusTextMap[system.status]}
                </Tag>
                {system.nodes.length > 0 && (
                  <Tag size="small" color="blue">
                    节点:{system.nodes.length}
                  </Tag>
                )}
              </div>
            </div>

            {/* 第二行：模块标签 */}
            {system.moduleIds.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {system.moduleIds.map((moduleId) => {
                  const displayText = getModuleName(moduleId);
                  return (
                    <Tag
                      key={moduleId}
                      size="small"
                      color="blue"
                      style={{
                        fontSize: '11px',
                        lineHeight: '16px',
                        padding: '2px 6px',
                      }}
                    >
                      <Highlight sourceString={displayText} searchWords={searchWords} />
                    </Tag>
                  );
                })}
              </div>
            )}
          </div>
        </List.Item>
      );
    },
    [searchText, handleSystemSelect, getModuleName]
  );

  // 渲染工作流编辑器
  const renderWorkflowEditor = () => {
    if (!selectedSystem) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <Text type="secondary" style={{ fontSize: '16px' }}>
            请从左侧选择一个ECS行为系统
          </Text>
          <Text type="quaternary" style={{ marginTop: '8px' }}>
            选择后将显示对应的工作流编辑器
          </Text>
        </div>
      );
    }

    // 渲染真正的工作流编辑器
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 系统信息头部 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--semi-color-border)',
            background: 'var(--semi-color-bg-1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {selectedSystem.name}
              </Text>
              <Text type="quaternary" style={{ marginLeft: '12px' }}>
                {selectedSystem.id}
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Space wrap spacing="tight">
                  {selectedSystem.moduleIds.map((moduleId) => (
                    <Tag key={moduleId} color="blue" size="small">
                      {getModuleName(moduleId)}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
            <Space>
              <Button
                type="tertiary"
                icon={<IconSetting />}
                onClick={() => handleEditSystem(selectedSystem)}
                size="small"
              >
                系统设置
              </Button>
              <Popconfirm
                title="确定要删除这个系统吗？"
                content="删除后不可恢复"
                onConfirm={() => handleDeleteSystem(selectedSystem)}
              >
                <Button type="danger" theme="borderless" icon={<IconDelete />} size="small">
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </div>

        {/* 工作流编辑器 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <EcsWorkflowEditor
            systemId={selectedSystem.id}
            systemName={selectedSystem.name}
            workflowData={{
              nodes: selectedSystem.nodes,
              edges: selectedSystem.edges,
            }}
            style={{ height: '100%' }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <DataManagementLayout
        title="行为系统"
        headerActions={
          selectedSystem && (
            <Space>
              <Button
                type="primary"
                icon={<IconPlay />}
                onClick={() => handleOpenWorkflowEditor(selectedSystem)}
              >
                编辑工作流
              </Button>
              <Button
                type="tertiary"
                icon={<IconSetting />}
                onClick={() => handleEditSystem(selectedSystem)}
              >
                系统设置
              </Button>
            </Space>
          )
        }
        sidebarContent={
          <DataListSidebar
            items={filteredSystems}
            loading={loading}
            searchText={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="搜索系统ID、名称、模块或状态..."
            selectedId={selectedSystem?._indexId}
            selectedIdField="_indexId"
            onItemSelect={handleSystemSelect}
            onAdd={handleCreateSystem}
            onRefresh={handleRefresh}
            emptyText="暂无ECS行为系统"
            renderItem={renderSystemItem}
            testId="ecs-system-sidebar"
          />
        }
        detailContent={renderWorkflowEditor()}
      />

      <SystemEditModal
        visible={editModalVisible}
        system={editingSystem}
        onOk={handleSaveSystem}
        onCancel={() => setEditModalVisible(false)}
      />
    </>
  );
};
