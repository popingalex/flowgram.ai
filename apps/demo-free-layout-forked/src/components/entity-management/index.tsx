import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Toast } from '@douyinfe/semi-ui';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import { useEntityList, useEntityListActions } from '../../stores/entity-list';
import { useModuleStore, useGraphList, useCurrentEntityActions } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { EntityDetail } from './entity-detail';

// 导出子组件
export { EntityDetail };

export const EntityManagementPage: React.FC = () => {
  const { entities, loading } = useEntityList();
  const { addEntity, saveEntity, deleteEntity, resetEntityChanges } = useEntityListActions();
  const { modules } = useModuleStore();
  const { graphs } = useGraphList();
  const { selectEntity } = useCurrentEntityActions();
  const { routeState, navigate } = useRouter();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 获取当前选中的实体
  const selectedEntity = useMemo(() => {
    if (!routeState.entityId) return null;
    // 🔑 修复：使用原始ID而不是nanoid进行匹配
    const entity = entities.find((entity) => entity.id === routeState.entityId);
    if (entity) {
      console.log('🎯 选中实体:', entity.id, entity.name);

      // 🔍 调试：检查行为树关联
      if (graphs.length > 0) {
        const graph = graphs.find((g) => g._indexId === entity._indexId);
        console.log('🔗 实体行为树关联:', {
          entityId: entity.id,
          entityIndexId: entity._indexId,
          foundGraph: graph ? { id: graph.id, nodeCount: graph.nodes?.length || 0 } : null,
          allGraphs: graphs.map((g) => ({
            id: g.id,
            _indexId: g._indexId,
            nodeCount: g.nodes?.length || 0,
          })),
        });
      }
    }
    return entity;
  }, [entities, routeState.entityId, graphs]);

  // 🔑 关键修复：当选中实体变化时，同步到CurrentEntityStore
  useEffect(() => {
    if (selectedEntity) {
      console.log('🔄 同步实体到CurrentEntityStore:', selectedEntity.id);
      selectEntity(selectedEntity);
    } else {
      console.log('🔄 清空CurrentEntityStore选择');
      selectEntity(null);
    }
  }, [selectedEntity, selectEntity]);

  // 🎯 默认选中第一个实体（延迟执行，确保路由状态完全恢复）
  useEffect(() => {
    if (!loading && entities.length > 0 && !routeState.entityId) {
      // 延迟检查，给路由状态恢复留出时间
      const timer = setTimeout(() => {
        // 再次检查路由状态，确保不是正在恢复中
        if (!routeState.entityId) {
          const firstEntity = entities[0];
          console.log('🎯 默认选中第一个实体:', firstEntity.id);
          navigate({ route: 'entities', entityId: firstEntity.id });
        } else {
          console.log('🔄 路由状态已恢复，跳过默认选中:', routeState.entityId);
        }
      }, 100); // 100ms延迟

      return () => clearTimeout(timer);
    }
  }, [loading, entities, routeState.entityId, navigate]);

  // 过滤后的实体列表
  const filteredEntities = useMemo(() => {
    if (!searchText.trim()) return entities;

    const searchLower = searchText.toLowerCase();
    return entities.filter((entity) => {
      // 搜索实体ID和名称
      const matchesBasic =
        entity.id?.toLowerCase().includes(searchLower) ||
        entity.name?.toLowerCase().includes(searchLower);

      // 搜索关联的模块ID和名称
      const matchesModules = entity.bundles?.some((moduleId) => {
        // 匹配模块ID
        if (moduleId?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // 匹配模块名称
        const module = modules.find((m) => m.id === moduleId);
        return module?.name?.toLowerCase().includes(searchLower);
      });

      return matchesBasic || matchesModules;
    });
  }, [entities, modules, searchText]);

  // 选择实体
  const handleEntitySelect = useCallback(
    (entity: any) => {
      // 🔑 修复：使用原始ID而不是nanoid作为URL参数
      navigate({ route: 'entities', entityId: entity.id });
    },
    [navigate]
  );

  // 添加实体
  const handleAddEntity = useCallback(async () => {
    try {
      const newEntity = {
        _indexId: nanoid(),
        id: '',
        name: '',
        description: '',
        attributes: [],
        moduleIds: [],
        bundles: [],
        _status: 'new' as const,
      };

      addEntity(newEntity);
      console.log('✅ 实体添加成功:', newEntity);

      // 自动选中新实体 - 等待用户输入ID后再跳转
      // navigate({ route: 'entities', entityId: newEntity.id });

      Toast.success('实体添加成功');
    } catch (error) {
      console.error('❌ 实体添加失败:', error);
      Toast.error('实体添加失败');
    }
  }, [addEntity, navigate]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    console.log('🔄 刷新实体列表');
    // 这里可以添加刷新逻辑
    Toast.info('数据已刷新');
  }, []);

  // 保存实体
  const handleSave = useCallback(async () => {
    if (!selectedEntity) return;

    try {
      await saveEntity(selectedEntity);
      console.log('✅ 实体保存成功:', selectedEntity.id);
      Toast.success('实体保存成功');
    } catch (error) {
      console.error('❌ 实体保存失败:', error);
      Toast.error('实体保存失败');
    }
  }, [selectedEntity, saveEntity]);

  // 撤销修改
  const handleUndo = useCallback(() => {
    if (!selectedEntity) return;

    resetEntityChanges(selectedEntity._indexId);
    console.log('↩️ 撤销实体修改:', selectedEntity.id);
    Toast.info('已撤销修改');
  }, [selectedEntity, resetEntityChanges]);

  // 删除实体
  const handleDelete = useCallback(async () => {
    if (!selectedEntity) return;

    try {
      await deleteEntity(selectedEntity._indexId);
      console.log('🗑️ 实体删除成功:', selectedEntity.id);

      // 删除后清空选择
      navigate({ route: 'entities' });

      Toast.success('实体删除成功');
    } catch (error) {
      console.error('❌ 实体删除失败:', error);
      Toast.error('实体删除失败');
    }
  }, [selectedEntity, deleteEntity, navigate]);

  // 检查是否可以保存
  const canSave = useMemo(() => {
    if (!selectedEntity) return false;
    return Boolean(selectedEntity.id?.trim());
  }, [selectedEntity]);

  // 获取当前实体的脏状态
  const currentEntityDirty = useMemo(() => {
    if (!selectedEntity) return false;
    return selectedEntity._status === 'modified' || selectedEntity._status === 'new';
  }, [selectedEntity]);

  // 获取当前实体的保存状态
  const currentEntitySaving = useMemo(() => {
    if (!selectedEntity) return false;
    return selectedEntity._editStatus === 'saving';
  }, [selectedEntity]);

  return (
    <DataManagementLayout
      title="实体管理"
      subtitle="管理系统中的所有实体定义"
      sidebarContent={
        <DataListSidebar
          items={filteredEntities}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索实体ID、名称或模块..."
          selectedId={selectedEntity?.id}
          onItemSelect={handleEntitySelect}
          onAdd={handleAddEntity}
          onRefresh={handleRefresh}
          emptyText="暂无实体"
          modules={modules}
          graphs={graphs}
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedEntity}
          emptyText="请选择左侧实体查看详情"
          renderContent={(entity) => (
            <EntityDetail
              selectedEntity={entity}
              isDirty={currentEntityDirty}
              isSaving={currentEntitySaving}
              canSave={canSave}
              onSave={handleSave}
              onUndo={handleUndo}
              onDelete={handleDelete}
            />
          )}
        />
      }
    />
  );
};
