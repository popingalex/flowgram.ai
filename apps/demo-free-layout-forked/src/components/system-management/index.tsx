import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { Toast, Button, Badge, Tooltip, Popconfirm, Typography } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import { systemApi } from '../../services/api-service';
import { useRouter } from '../../hooks/use-router';

const { Text } = Typography;

interface SystemItem {
  _indexId: string;
  id: string;
  name: string;
  desc?: string;
  type?: string;
  version?: string;
  enabled?: boolean;
  inputs?: any[];
  expression?: any;
  _status?: 'new' | 'editing' | 'saved';
}

export const SystemManagementPage: React.FC = () => {
  const { routeState, navigate } = useRouter();
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 防抖和去重逻辑
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const LOAD_DEBOUNCE_MS = 500; // 500ms内的重复请求会被忽略

  // 加载系统列表 - 添加防抖和去重
  const loadSystems = useCallback(async (force: boolean = false) => {
    // 防抖：短时间内的重复请求直接忽略
    const now = Date.now();
    if (!force && now - lastLoadTimeRef.current < LOAD_DEBOUNCE_MS) {
      console.log('🚫 [SystemManagement] loadSystems 防抖跳过');
      return;
    }

    // 去重：如果已经在加载中，直接返回
    if (loadingRef.current) {
      console.log('🚫 [SystemManagement] loadSystems 已在加载中，跳过');
      return;
    }

    try {
      loadingRef.current = true;
      lastLoadTimeRef.current = now;
      setLoading(true);

      console.log('🔄 [SystemManagement] 开始加载系统数据...');
      const data = await systemApi.getAll();
      console.log('🔍 [SystemManagement] 加载系统数据:', data);

      // 转换为前端格式
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
        _status: 'saved' as const,
      }));

      console.log('✅ [SystemManagement] 系统数据加载完成:', systemItems.length, '个系统');
      setSystems(systemItems);
    } catch (error) {
      console.error('❌ 加载系统列表失败:', error);
      Toast.error('加载系统列表失败');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    loadSystems(true); // 初始加载强制执行
  }, [loadSystems]);

  // 获取当前选中的系统
  const selectedSystem = useMemo(() => {
    console.log('🔍 [SystemManagement] 计算selectedSystem:', {
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
    console.log('🔍 [SystemManagement] 查找系统结果:', {
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
    }
  }, [loading, systems, routeState.entityId, navigate]);

  // 过滤系统列表
  const filteredSystems = useMemo(() => {
    if (!searchText.trim()) return systems;
    const searchLower = searchText.toLowerCase();
    return systems.filter(
      (system) =>
        system.id.toLowerCase().includes(searchLower) ||
        (system.name || '').toLowerCase().includes(searchLower) ||
        (system.desc || '').toLowerCase().includes(searchLower)
    );
  }, [systems, searchText]);

  // 选择系统
  const handleSystemSelect = useCallback(
    (system: SystemItem) => {
      console.log('🔍 [SystemManagement] handleSystemSelect:', {
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
    await loadSystems(true); // 刷新时强制加载
    Toast.info('数据已刷新');
  }, [loadSystems]);

  // 保存系统 - 优化：减少不必要的重新加载
  const handleSave = useCallback(async () => {
    if (!selectedSystem) return;

    try {
      const wasNewSystem = selectedSystem._status === 'new';

      if (wasNewSystem) {
        const newSystem = await systemApi.create(selectedSystem);
        console.log('✅ 新系统创建成功:', newSystem.id);

        // 直接更新本地状态，避免重新加载
        setSystems((prev) => [
          ...prev,
          {
            ...newSystem,
            _indexId: newSystem.id,
            _status: 'saved' as const,
          },
        ]);

        if (newSystem.id) {
          navigate({ route: 'system', entityId: newSystem.id });
        }
      } else {
        const updatedSystem = await systemApi.update(selectedSystem.id, selectedSystem);
        console.log('✅ 系统保存成功:', updatedSystem.id);

        // 直接更新本地状态，避免重新加载
        setSystems((prev) =>
          prev.map((s) =>
            s.id === selectedSystem.id
              ? {
                  ...updatedSystem,
                  _indexId: updatedSystem.id,
                  _status: 'saved' as const,
                }
              : s
          )
        );
      }

      Toast.success('系统保存成功');
    } catch (error) {
      console.error('❌ 系统保存失败:', error);
      Toast.error('系统保存失败');
    }
  }, [selectedSystem, navigate]);

  // 撤销修改 - 优化：避免重新加载
  const handleUndo = useCallback(() => {
    if (!selectedSystem) return;
    console.log('↩️ 撤销系统修改:', selectedSystem.id);

    // 对于新建的系统，直接跳转到第一个系统
    if (selectedSystem._status === 'new') {
      if (systems.length > 0) {
        navigate({ route: 'system', entityId: systems[0].id });
      } else {
        navigate({ route: 'system' });
      }
    } else {
      // 对于已有系统，重新加载该系统数据
      loadSystems();
    }

    Toast.info('已撤销修改');
  }, [selectedSystem, systems, navigate, loadSystems]);

  // 删除系统 - 优化：直接更新本地状态
  const handleDelete = useCallback(async () => {
    if (!selectedSystem || selectedSystem._status === 'new') return;

    try {
      await systemApi.delete(selectedSystem.id);
      console.log('🗑️ 系统删除成功:', selectedSystem.id);
      Toast.success('系统删除成功');

      // 直接更新本地状态，避免重新加载
      const updatedSystems = systems.filter((s) => s.id !== selectedSystem.id);
      setSystems(updatedSystems);

      // 跳转到第一个系统或清空选择
      if (updatedSystems.length > 0) {
        navigate({ route: 'system', entityId: updatedSystems[0].id });
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

  // 渲染系统列表项
  const renderSystemItem = (system: SystemItem, isSelected: boolean) => (
    <div key={system._indexId} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ fontSize: 14 }}>
          {system.name}
        </Text>
        {system.enabled ? <Badge dot color="green" /> : <Badge dot color="red" />}
      </div>
      <div style={{ marginTop: 4 }}>
        <Text type="tertiary" size="small">
          ID: {system.id}
        </Text>
        <br />
        <Text type="secondary" size="small">
          {system.desc || '无描述'}
        </Text>
      </div>
      {system.inputs && system.inputs.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <Text type="tertiary" size="small">
            组件过滤器: {system.inputs.length} 个
          </Text>
        </div>
      )}
    </div>
  );

  // 渲染系统详情
  const renderSystemDetail = () => {
    console.log('🔍 [SystemManagement] renderSystemDetail:', {
      selectedSystem: selectedSystem ? `${selectedSystem.id} - ${selectedSystem.name}` : 'null',
      hasSelectedSystem: !!selectedSystem,
    });

    if (!selectedSystem) {
      return <div style={{ padding: 20 }}>请选择一个系统</div>;
    }

    return (
      <div style={{ padding: 20 }}>
        <h3>{selectedSystem.name || '新系统'}</h3>
        <div style={{ marginBottom: 16 }}>
          <Text strong>ID: </Text>
          <Text code>{selectedSystem.id}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>描述: </Text>
          <Text>{selectedSystem.desc || '无描述'}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>类型: </Text>
          <Text>{selectedSystem.type || 'ecs'}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>版本: </Text>
          <Text>{selectedSystem.version || '1.0'}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>状态: </Text>
          {selectedSystem.enabled ? (
            <Badge dot color="green">
              启用
            </Badge>
          ) : (
            <Badge dot color="red">
              禁用
            </Badge>
          )}
        </div>

        {selectedSystem.inputs && selectedSystem.inputs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>组件过滤器 ({selectedSystem.inputs.length}个):</Text>
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {selectedSystem.inputs.map((input: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: 8,
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  <Text strong size="small">
                    {input.name}
                  </Text>
                  <br />
                  <Text type="tertiary" size="small">
                    {input.description}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSystem.expression && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>执行逻辑:</Text>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                backgroundColor: 'var(--semi-color-fill-0)',
                borderRadius: 4,
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              <Text code size="small">
                {selectedSystem.expression.name || selectedSystem.expression.id}
              </Text>
              <br />
              <Text type="secondary" size="small">
                {selectedSystem.expression.desc ||
                  selectedSystem.expression.body?.substring(0, 100) + '...'}
              </Text>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DataManagementLayout
      title="系统管理"
      sidebarContent={
        <DataListSidebar
          items={filteredSystems}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索系统ID、名称..."
          selectedId={selectedSystem?.id}
          onItemSelect={handleSystemSelect}
          onAdd={handleAddSystem}
          onRefresh={handleRefresh}
          addDisabled={hasUnsavedNew}
          emptyText="暂无系统数据"
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedSystem}
          onSave={handleSave}
          onUndo={handleUndo}
          onDelete={handleDelete}
          canSave={canSave}
          renderDetail={renderSystemDetail}
        />
      }
    />
  );
};
