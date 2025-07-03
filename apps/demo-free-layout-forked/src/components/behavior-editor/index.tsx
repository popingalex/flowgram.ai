import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { Toast, Button, Badge, Tooltip, Popconfirm, Typography } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import { systemApi } from '../../services/api-service';
import { useRouter } from '../../hooks/use-router';
import { BehaviorDetail } from './behavior-detail';
import { CodeType } from '../../typings/behavior';

const { Text } = Typography;

interface SystemItem {
  _indexId: string;
  id: string;
  name: string;
  desc?: string;
  type: string;
  version: string;
  enabled: boolean;
  inputs?: any;
  expression?: any;
  participants?: any[];
  _status: 'saved' | 'new' | 'modified';
}

export const BehaviorEditor: React.FC = () => {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { routeState, navigate } = useRouter();

  const selectedSystemId = routeState.entityId || null;
  const [searchText, setSearchText] = useState('');

  // 加载系统列表
  const loadSystems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await systemApi.getAll();
      console.log('🔍 [BehaviorEditor] 加载系统数据:', data);
      console.log('🔍 [BehaviorEditor] 第一个系统的完整结构:', JSON.stringify(data[0], null, 2));

      // ECS系统participants映射 - 基于 simulation-disaster.coupling 源码分析
      const systemParticipantsMap: Record<string, any[]> = {
        agent_system: [
          {
            id: 'AgentComponent',
            name: '智能体组件',
            type: 'required',
            description: '标记实体为自主智能体',
          },
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '实体的空间位置',
          },
          {
            id: 'TargetComponent',
            name: '目标组件',
            type: 'optional',
            description: '智能体的行动目标',
          },
          {
            id: 'InventoryComponent',
            name: '库存组件',
            type: 'optional',
            description: '智能体携带的物品',
          },
          {
            id: 'EmitterComponent',
            name: '发射器组件',
            type: 'optional',
            description: '智能体的物质发射能力',
          },
          {
            id: 'NameComponent',
            name: '名称组件',
            type: 'optional',
            description: '实体的可读名称',
          },
          {
            id: 'BurningComponent',
            name: '燃烧组件',
            type: 'query',
            description: '用于查找燃烧目标',
          },
          {
            id: 'FlammableComponent',
            name: '易燃组件',
            type: 'query',
            description: '用于查找可燃目标',
          },
          {
            id: 'RefillStationComponent',
            name: '补给站组件',
            type: 'query',
            description: '用于查找补给站',
          },
        ],
        fire_system: [
          {
            id: 'FlammableComponent',
            name: '易燃组件',
            type: 'required',
            description: '可燃烧的实体',
          },
          {
            id: 'BurningComponent',
            name: '燃烧组件',
            type: 'optional',
            description: '正在燃烧的状态',
          },
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '用于热传播计算',
          },
          { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
          {
            id: 'MaterialComponent',
            name: '材料组件',
            type: 'optional',
            description: '材料属性影响燃烧',
          },
          {
            id: 'PressureVesselComponent',
            name: '压力容器组件',
            type: 'optional',
            description: '压力容器受热影响',
          },
          {
            id: 'StructuralIntegrityComponent',
            name: '结构完整性组件',
            type: 'optional',
            description: '结构受火灾影响',
          },
          { id: 'WindComponent', name: '风力组件', type: 'query', description: '影响火势传播方向' },
        ],
        movement_system: [
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '实体当前位置',
          },
          {
            id: 'TargetComponent',
            name: '目标组件',
            type: 'required',
            description: '移动目标位置',
          },
          {
            id: 'AgentComponent',
            name: '智能体组件',
            type: 'optional',
            description: '获取移动速度和状态',
          },
          { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于调试日志' },
        ],
        interaction_system: [
          {
            id: 'AgentComponent',
            name: '智能体组件',
            type: 'required',
            description: '执行交互的主体',
          },
          {
            id: 'InventoryComponent',
            name: '库存组件',
            type: 'required',
            description: '交互使用的物质',
          },
          { id: 'TargetComponent', name: '目标组件', type: 'required', description: '交互的目标' },
          {
            id: 'EmitterComponent',
            name: '发射器组件',
            type: 'optional',
            description: '控制交互范围和流量',
          },
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '计算交互距离',
          },
          {
            id: 'FlammableComponent',
            name: '易燃组件',
            type: 'query',
            description: '交互目标的材料属性',
          },
          {
            id: 'MaterialComponent',
            name: '材料组件',
            type: 'query',
            description: '用于本体论查询',
          },
          { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
        ],
        explosion_system: [
          {
            id: 'PressureVesselComponent',
            name: '压力容器组件',
            type: 'required',
            description: '可爆炸的压力容器',
          },
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '爆炸中心位置',
          },
          {
            id: 'ExplosionEventComponent',
            name: '爆炸事件组件',
            type: 'optional',
            description: '爆炸效果状态',
          },
        ],
        resource_system: [
          {
            id: 'AgentComponent',
            name: '智能体组件',
            type: 'required',
            description: '资源使用主体',
          },
          { id: 'InventoryComponent', name: '库存组件', type: 'required', description: '资源存储' },
          {
            id: 'EmitterComponent',
            name: '发射器组件',
            type: 'optional',
            description: '资源消耗设备',
          },
          {
            id: 'RefillStationComponent',
            name: '补给站组件',
            type: 'query',
            description: '资源补给点',
          },
          {
            id: 'PositionComponent',
            name: '位置组件',
            type: 'required',
            description: '计算补给距离',
          },
          {
            id: 'TargetComponent',
            name: '目标组件',
            type: 'optional',
            description: '补给目标位置',
          },
          { id: 'NameComponent', name: '名称组件', type: 'optional', description: '用于日志记录' },
        ],
      };

      // 转换为前端格式，并添加participants信息
      const systemItems: SystemItem[] = data.map((system: any) => ({
        _indexId: system.id,
        id: system.id,
        name: system.name || '未命名系统',
        desc: system.desc,
        type: system.type,
        version: system.version,
        enabled: system.enabled,
        inputs: system.inputs?.items || [],
        expression: system.expression,
        participants: systemParticipantsMap[system.id] || [], // 添加participants信息
        _status: 'saved' as const,
      }));

      setSystems(systemItems);
      console.log('🔍 [BehaviorEditor] 系统数量:', systemItems.length);
      console.log('🔍 [BehaviorEditor] 第一个系统的participants:', systemItems[0]?.participants);
    } catch (error) {
      console.error('❌ 加载系统数据失败:', error);
      Toast.error('加载系统数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  // 获取当前选中的系统
  const selectedSystem = useMemo(() => {
    console.log('🔍 [BehaviorEditor] 计算selectedSystem:', {
      entityId: routeState.entityId,
      systemsCount: systems.length,
      systemIds: systems.map((s) => s.id),
    });

    if (!routeState.entityId) return null;

    // 新建系统模式
    if (routeState.entityId === 'new') {
      return {
        _indexId: 'new',
        id: '',
        name: '',
        desc: '',
        type: 'ecs',
        version: '1.0',
        enabled: true,
        inputs: [],
        expression: null,
        _status: 'new' as const,
      };
    }

    // 查找现有系统
    const found = systems.find((system) => system.id === routeState.entityId);
    console.log('🔍 [BehaviorEditor] 查找系统结果:', {
      targetId: routeState.entityId,
      found: found ? `${found.id} - ${found.name}` : 'null',
    });

    return found || null;
  }, [systems, routeState.entityId]);

  // 默认选中第一个系统
  useEffect(() => {
    if (!loading && systems.length > 0 && !routeState.entityId) {
      const firstSystem = systems[0];
      navigate({ route: 'system', entityId: firstSystem.id });
    } else if (!loading && systems.length === 0 && !routeState.entityId) {
      // 如果没有系统，默认进入新建页面
      navigate({ route: 'system', entityId: 'new' });
    }
  }, [loading, systems, routeState.entityId, navigate]);

  // 过滤系统列表
  const filteredSystems = useMemo(() => {
    if (!searchText.trim()) return systems;
    const searchLower = searchText.toLowerCase();
    return systems.filter(
      (system) =>
        system.id.toLowerCase().includes(searchLower) ||
        (system.name || '').toLowerCase().includes(searchLower)
    );
  }, [systems, searchText]);

  // 选择系统
  const handleSystemSelect = useCallback(
    (system: any) => {
      console.log('🔍 [BehaviorEditor] handleSystemSelect:', {
        systemId: system.id,
        systemName: system.name,
        currentEntityId: routeState.entityId,
      });
      navigate({ route: 'system', entityId: system.id });
    },
    [navigate, routeState.entityId]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(() => routeState.entityId === 'new', [routeState.entityId]);

  // 添加系统
  const handleAddSystem = useCallback(async () => {
    if (hasUnsavedNew) return;
    navigate({ route: 'system', entityId: 'new' });
  }, [navigate, hasUnsavedNew]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    await loadSystems();
    Toast.info('数据已刷新');
  }, [loadSystems]);

  // 保存系统
  const handleSave = useCallback(async () => {
    if (!selectedSystem) return;

    try {
      const wasNewSystem = selectedSystem._status === 'new';

      if (wasNewSystem) {
        // TODO: 实现创建系统API
        console.log('✅ 新系统创建成功:', selectedSystem.id);
        if (selectedSystem.id) {
          navigate({ route: 'system', entityId: selectedSystem.id });
        }
      } else {
        // TODO: 实现更新系统API
        console.log('✅ 系统保存成功:', selectedSystem.id);
      }

      Toast.success('系统保存成功');
    } catch (error) {
      console.error('❌ 系统保存失败:', error);
      Toast.error('系统保存失败');
    }
  }, [selectedSystem, navigate]);

  // 撤销修改
  const handleUndo = useCallback(() => {
    if (!selectedSystem) return;
    console.log('↩️ 撤销系统修改:', selectedSystem.id);
    Toast.info('已撤销修改');
  }, [selectedSystem]);

  // 删除系统
  const handleDelete = useCallback(async () => {
    if (!selectedSystem || selectedSystem._status === 'new') return;

    try {
      // TODO: 实现删除系统API
      console.log('🗑️ 系统删除成功:', selectedSystem.id);
      Toast.success('系统删除成功');

      // 跳转到第一个系统或清空选择
      if (systems.length > 1) {
        const remainingSystems = systems.filter((s) => s._indexId !== selectedSystem._indexId);
        if (remainingSystems.length > 0) {
          navigate({ route: 'system', entityId: remainingSystems[0].id });
        }
      } else {
        navigate({ route: 'system' });
      }
    } catch (error) {
      console.error('❌ 系统删除失败:', error);
      Toast.error('系统删除失败');
    }
  }, [selectedSystem, systems, navigate]);

  // 验证能否保存
  const canSave = useMemo(() => {
    if (!selectedSystem) return false;
    if (!selectedSystem.id?.trim()) return false;
    if (!selectedSystem.name?.trim()) return false;
    return true;
  }, [selectedSystem]);

  // 验证错误信息
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedSystem) return errors;

    if (!selectedSystem.id?.trim()) {
      errors.push('系统ID不能为空');
    }
    if (!selectedSystem.name?.trim()) {
      errors.push('系统名称不能为空');
    }

    return errors;
  }, [selectedSystem]);

  return (
    <DataManagementLayout
      title="系统管理"
      headerActions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 原有的行为操作按钮 */}
          {selectedSystem && (
            <>
              {validationErrors.length > 0 ? (
                <Tooltip
                  content={
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        发现 {validationErrors.length} 个问题：
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px' }}>
                        {validationErrors.map((error, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                  position="bottomLeft"
                >
                  <Badge count={validationErrors.length} type="danger">
                    <Button
                      icon={<IconSave />}
                      onClick={handleSave}
                      disabled={!canSave}
                      type="primary"
                      size="small"
                      data-testid="save-system-btn"
                    >
                      保存
                    </Button>
                  </Badge>
                </Tooltip>
              ) : (
                <Button
                  icon={<IconSave />}
                  onClick={handleSave}
                  disabled={!canSave}
                  type="primary"
                  size="small"
                  data-testid="save-system-btn"
                >
                  保存
                </Button>
              )}

              {selectedSystem?._status !== 'new' && (
                <Button
                  icon={<IconUndo />}
                  onClick={handleUndo}
                  size="small"
                  data-testid="undo-system-btn"
                >
                  撤销
                </Button>
              )}

              <Popconfirm
                title="确定删除这个系统吗？"
                content="删除后将无法恢复"
                onConfirm={handleDelete}
              >
                <Button
                  icon={<IconDelete />}
                  type="danger"
                  theme="borderless"
                  size="small"
                  data-testid="delete-system-btn"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      }
      sidebarContent={
        <DataListSidebar
          items={filteredSystems}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索系统ID、名称..."
          selectedId={selectedSystemId || undefined}
          selectedIdField="id"
          onItemSelect={handleSystemSelect}
          onAdd={handleAddSystem}
          onRefresh={handleRefresh}
          emptyText="暂无系统"
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedSystem}
          isDirty={selectedSystem?._status === 'modified'}
          isSaving={selectedSystem?._status === 'new'}
          canSave={canSave}
          onSave={handleSave}
          onUndo={handleUndo}
          onDelete={handleDelete}
          validationErrors={validationErrors}
          emptyText="请选择左侧系统查看详情"
          deleteConfirmTitle="确定删除这个系统吗？"
          deleteConfirmContent="删除后将无法恢复"
          testId="system"
          renderContent={(system, actionButtons, statusInfo) => {
            // 将系统数据转换为行为数据格式
            const behaviorData = system
              ? {
                  _indexId: system._indexId,
                  id: system.id,
                  name: system.name,
                  description: system.desc || '',
                  parameters: [],
                  codeConfig: { type: CodeType.LOCAL },
                  exp: system.expression ? JSON.stringify(system.expression, null, 2) : '',
                  _status: system._status,
                }
              : null;

            return (
              <BehaviorDetail
                selectedBehavior={behaviorData}
                isSystemMode={true}
                systemData={system}
              />
            );
          }}
        />
      }
    />
  );
};
