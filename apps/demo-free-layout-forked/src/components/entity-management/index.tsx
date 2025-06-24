import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Toast, Button, Badge, Tooltip, Popconfirm, Typography } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import {
  useEntityList,
  useEntityListActions,
  useCurrentEntity,
  useCurrentEntityActions,
} from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { EntityDetail } from './entity-detail';

const { Text } = Typography;

// 导出子组件
export { EntityDetail };

export const EntityManagementPage: React.FC = () => {
  const { entities, loading } = useEntityList();
  const { addEntity, saveEntity, deleteEntity } = useEntityListActions();
  const { editingEntity, isDirty, isSaving } = useCurrentEntity();
  const { selectEntity, resetChanges } = useCurrentEntityActions();
  const { routeState, navigate } = useRouter();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 获取当前选中的实体
  const selectedEntity = useMemo(() => {
    if (!routeState.entityId) return null;

    // 🔑 特殊处理：新建实体模式 - 应该从store获取，而不是在组件中创建
    if (routeState.entityId === 'new') {
      // TODO: 这里应该调用 store 的 createNewEntity 方法
      // 暂时保持现有逻辑，但标记为需要重构
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
      console.log('🆕 进入新建实体模式:', newEntity._indexId);
      console.log('🆕 新实体对象:', newEntity);
      return newEntity;
    }

    // 🔑 正常实体：使用业务ID进行匹配
    const entity = entities.find((entity) => entity.id === routeState.entityId);
    if (entity) {
      console.log('🎯 选中实体:', entity.id, entity.name);
    }
    return entity;
  }, [entities, routeState.entityId]);

  // 🔑 关键修复：当选中实体变化时，同步到CurrentEntityStore
  useEffect(() => {
    if (selectedEntity) {
      console.log('🔄 同步实体到CurrentEntityStore:', selectedEntity.id || '新建实体');
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
        // 再次检查路由状态，确保不是正在恢复中，也不是新建模式
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
        const module = entities.find((m) => m.id === moduleId);
        return module?.name?.toLowerCase().includes(searchLower);
      });

      return matchesBasic || matchesModules;
    });
  }, [entities, searchText]);

  // 选择实体
  const handleEntitySelect = useCallback(
    (entity: any) => {
      // 🔑 直接使用业务ID进行路由跳转
      navigate({ route: 'entities', entityId: entity.id });
    },
    [navigate]
  );

  // 添加实体
  const handleAddEntity = useCallback(async () => {
    try {
      // 🔑 直接跳转到新建页面，不预先创建实体对象
      console.log('🔍 点击新建实体按钮，准备跳转');
      navigate({ route: 'entities', entityId: 'new' });
      console.log('✅ 跳转到新建实体页面');
    } catch (error) {
      console.error('❌ 跳转失败:', error);
      Toast.error('跳转失败');
    }
  }, [navigate]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    console.log('🔄 刷新实体列表');
    // 这里可以添加刷新逻辑
    Toast.info('数据已刷新');
  }, []);

  // 保存实体
  const handleSave = useCallback(async () => {
    // 🔑 修复：使用CurrentEntityStore的editingEntity，而不是临时的selectedEntity
    const entityToSave = editingEntity || selectedEntity;
    if (!entityToSave) return;

    try {
      const wasNewEntity = entityToSave._status === 'new';

      console.log('🔍 保存实体数据:', {
        entityToSave,
        wasNewEntity,
        id: entityToSave.id,
        name: entityToSave.name,
      });

      if (wasNewEntity) {
        // 🔑 新建实体：先添加到store，再保存
        selectEntity(entityToSave);
        await saveEntity(entityToSave);
        console.log('✅ 新实体创建并保存成功:', entityToSave.id);

        // 跳转到新实体的编辑页面
        if (entityToSave.id) {
          navigate({ route: 'entities', entityId: entityToSave.id });
        }
      } else {
        // 🔑 已有实体：直接保存
        await saveEntity(entityToSave);
        console.log('✅ 实体保存成功:', entityToSave.id);
      }

      Toast.success('实体保存成功');
    } catch (error) {
      console.error('❌ 实体保存失败:', error);
      Toast.error('实体保存失败');
    }
  }, [editingEntity, selectedEntity, selectEntity, saveEntity, navigate]);

  // 撤销修改
  const handleUndo = useCallback(() => {
    if (!selectedEntity) return;

    resetChanges();
    console.log('↩️ 撤销实体修改:', selectedEntity.id);
    Toast.info('已撤销修改');
  }, [selectedEntity, resetChanges]);

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

  // 🔑 修复：使用CurrentEntityStore的数据计算状态，包含属性验证
  const canSave = useMemo(() => {
    // 优先使用CurrentEntityStore的editingEntity
    const currentEntity = editingEntity || selectedEntity;
    if (!currentEntity) return false;

    // 基础验证：实体必须有ID
    if (!currentEntity.id?.trim()) {
      return false;
    }

    // 🚨 重要：验证所有属性的ID都不能为空
    if (currentEntity.attributes && currentEntity.attributes.length > 0) {
      const attributeIds = new Set();
      for (const attr of currentEntity.attributes) {
        // 检查属性ID是否为空
        if (!attr.id || attr.id.trim() === '') {
          console.warn('🚨 属性ID为空，禁用保存:', attr);
          return false;
        }
        // 检查属性ID是否重复
        if (attributeIds.has(attr.id)) {
          console.warn('🚨 属性ID重复，禁用保存:', attr.id);
          return false;
        }
        attributeIds.add(attr.id);
      }
    }

    // 检查实体ID是否与其他实体重复
    const otherEntities = entities.filter((e) => e._indexId !== currentEntity._indexId);
    if (otherEntities.some((e) => e.id === currentEntity.id)) {
      console.warn('🚨 实体ID重复，禁用保存:', currentEntity.id);
      return false;
    }

    return true;
  }, [editingEntity, selectedEntity, entities]);

  // 🎯 验证逻辑：生成详细的异常信息列表
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // 优先使用CurrentEntityStore的editingEntity
    const currentEntity = editingEntity || selectedEntity;
    if (!currentEntity) return errors;

    // 1. 检查实体ID
    if (!currentEntity.id?.trim()) {
      errors.push('实体ID不能为空');
    } else {
      // 检查实体ID是否与其他实体重复
      const otherEntities = entities.filter((e) => e._indexId !== currentEntity._indexId);
      if (otherEntities.some((e) => e.id === currentEntity.id)) {
        errors.push(`实体ID "${currentEntity.id}" 已存在`);
      }
    }

    // 2. 检查属性
    if (currentEntity.attributes && currentEntity.attributes.length > 0) {
      const attributeIds = new Set<string>();

      currentEntity.attributes.forEach((attr: any, index: number) => {
        const attrPosition = `第${index + 1}个属性`;

        // 检查属性ID是否为空
        if (!attr.id || attr.id.trim() === '') {
          errors.push(`${attrPosition}的ID不能为空`);
        } else {
          // 检查属性ID是否重复
          if (attributeIds.has(attr.id)) {
            errors.push(`属性ID "${attr.id}" 重复`);
          } else {
            attributeIds.add(attr.id);
          }
        }

        // 检查属性名称（可选，但如果填写了要有意义）
        if (attr.name && attr.name.trim().length === 0) {
          errors.push(`${attrPosition}的名称不能为空白字符`);
        }
      });
    }

    return errors;
  }, [editingEntity, selectedEntity, entities]);

  // 🔑 直接使用CurrentEntityStore的状态
  const currentEntityDirty = isDirty;
  const currentEntitySaving = isSaving;

  return (
    <DataManagementLayout
      title="实体管理"
      headerActions={
        selectedEntity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentEntitySaving && (
              <Text type="secondary" size="small">
                正在保存...
              </Text>
            )}

            {/* 保存按钮 */}
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
                    disabled={!canSave || !currentEntityDirty}
                    loading={currentEntitySaving}
                    type="primary"
                    size="small"
                    data-testid="save-entity-btn"
                  >
                    保存
                  </Button>
                </Badge>
              </Tooltip>
            ) : (
              <Button
                icon={<IconSave />}
                onClick={handleSave}
                disabled={!canSave || !currentEntityDirty}
                loading={currentEntitySaving}
                type="primary"
                size="small"
                data-testid="save-entity-btn"
              >
                保存
              </Button>
            )}
            <Button
              icon={<IconUndo />}
              onClick={handleUndo}
              disabled={!currentEntityDirty}
              size="small"
              data-testid="undo-entity-btn"
            >
              撤销
            </Button>
            <Popconfirm
              title="确定删除这个实体吗？"
              content="删除后将无法恢复，相关配置也会丢失"
              onConfirm={handleDelete}
            >
              <Button
                icon={<IconDelete />}
                type="danger"
                theme="borderless"
                size="small"
                data-testid="delete-entity-btn"
              >
                删除
              </Button>
            </Popconfirm>
          </div>
        )
      }
      sidebarContent={
        <DataListSidebar
          items={filteredEntities}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索实体ID、名称或模块..."
          selectedId={selectedEntity?._indexId}
          selectedIdField="_indexId"
          onItemSelect={handleEntitySelect}
          onAdd={handleAddEntity}
          onRefresh={handleRefresh}
          emptyText="暂无实体"
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedEntity}
          isDirty={currentEntityDirty}
          isSaving={currentEntitySaving}
          canSave={canSave}
          onSave={handleSave}
          onUndo={handleUndo}
          onDelete={handleDelete}
          validationErrors={validationErrors}
          emptyText="请选择左侧实体查看详情"
          deleteConfirmTitle="确定删除这个实体吗？"
          deleteConfirmContent="删除后将无法恢复，相关配置也会丢失"
          testId="entity"
          renderContent={(entity, actionButtons, statusInfo) => (
            <EntityDetail
              selectedEntity={entity}
              isDirty={currentEntityDirty}
              isSaving={currentEntitySaving}
              canSave={canSave}
              onSave={handleSave}
              onUndo={handleUndo}
              onDelete={handleDelete}
              actionButtons={actionButtons}
              statusInfo={statusInfo}
            />
          )}
        />
      }
    />
  );
};
