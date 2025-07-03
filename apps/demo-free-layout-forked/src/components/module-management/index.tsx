import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import {
  Toast,
  Badge,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
  Tag,
  Highlight,
} from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

const { Text } = Typography;

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import {
  useModuleStore,
  useCurrentModule,
  useCurrentModuleActions,
  useEntityList,
} from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { ModuleDetail } from './module-detail';

export const ModuleManagementPage: React.FC = () => {
  const { modules, loading, loadModules } = useModuleStore();
  const { deleteModule } = useModuleStore();
  const { routeState, navigate } = useRouter();

  // 🔑 获取实体列表用于计算关联关系
  const { entities } = useEntityList();

  // 🔑 使用CurrentModuleStore管理编辑状态
  const { editingModule, isDirty, isSaving } = useCurrentModule();
  const { selectModule, saveChanges, resetChanges } = useCurrentModuleActions();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 获取当前选中的模块
  const selectedModule = useMemo(() => {
    if (!routeState.entityId) return null; // 复用entityId字段

    // 🎯 处理新建模块的情况
    if (routeState.entityId === 'new') {
      return {
        _indexId: nanoid(),
        id: '',
        name: '',
        description: '',
        attributes: [],
        _status: 'new' as const,
      };
    }

    // 🔑 修复：使用原始ID而不是nanoid进行匹配
    const found = modules.find((module) => module.id === routeState.entityId);

    console.log('🔍 [ModuleManagement] 选中模块查找:', {
      routeEntityId: routeState.entityId,
      foundModule: found ? { id: found.id, _indexId: found._indexId } : null,
      totalModules: modules.length,
      allModuleIds: modules.map((m) => m.id),
    });

    return found;
  }, [modules, routeState.entityId]);

  // 🎯 当选中模块变化时，同步到CurrentModuleStore
  useEffect(() => {
    if (selectedModule) {
      console.log('🔄 选中模块变化，同步到CurrentModuleStore:', selectedModule.id);
      selectModule(selectedModule);
    } else {
      selectModule(null);
    }
  }, [selectedModule, selectModule]);

  // 🎯 默认选中第一个模块（除非是新建模式）
  useEffect(() => {
    if (!loading && modules.length > 0 && !routeState.entityId) {
      const firstModule = modules[0];
      console.log('🎯 默认选中第一个模块:', firstModule.id);
      navigate({ route: 'module', entityId: firstModule.id });
    } else if (!loading && modules.length === 0 && !routeState.entityId) {
      // 如果没有模块，默认进入新建页面
      navigate({ route: 'module', entityId: 'new' });
    }
  }, [loading, modules, routeState.entityId, navigate]);

  // 🔑 计算每个模块的关联实体数量和模块关联数量
  const moduleStats = useMemo(() => {
    const stats: Record<string, { entityCount: number; moduleCount: number }> = {};

    modules.forEach((module) => {
      // 计算有多少个实体的bundles包含这个模块ID
      const relatedEntityCount = entities.filter((entity) =>
        entity.bundles?.includes(module.id)
      ).length;

      // 计算模块关联的其他模块数量（modules字段）
      const relatedModuleCount = module.modules?.length || 0;

      stats[module.id] = {
        entityCount: relatedEntityCount,
        moduleCount: relatedModuleCount,
      };
    });

    console.log('🔍 模块统计信息:', stats);
    return stats;
  }, [modules, entities]);

  // 过滤后的模块列表
  const filteredModules = useMemo(() => {
    const baseModules = !searchText.trim()
      ? modules
      : modules.filter((module) => {
          const searchLower = searchText.toLowerCase();

          // 搜索ID和名称 - 优先匹配单词边界
          const matchesBasic =
            module.id?.toLowerCase().includes(searchLower) ||
            module.name?.toLowerCase().includes(searchLower);

          // 搜索属性 - 更智能地匹配
          const matchesAttributes = module.attributes?.some((attr: any) => {
            const attrId = attr.id?.toLowerCase() || '';
            const attrDisplayId = attr.displayId?.toLowerCase() || '';
            const attrName = attr.name?.toLowerCase() || '';

            // 优先匹配完整单词或以搜索词开头的情况
            const matchesAttrId =
              attrId === searchLower || // 完全匹配
              attrId.startsWith(searchLower) || // 开头匹配
              attrId.includes('_' + searchLower) || // 下划线后匹配
              attrId.includes('/' + searchLower) || // 斜杠后匹配
              (searchLower.length >= 3 && attrId.includes(searchLower)); // 长度>=3才允许包含匹配

            const matchesAttrDisplayId =
              attrDisplayId === searchLower || // 完全匹配
              attrDisplayId.startsWith(searchLower) || // 开头匹配
              (searchLower.length >= 3 && attrDisplayId.includes(searchLower)); // 长度>=3才允许包含匹配

            const matchesAttrName =
              attrName === searchLower || // 完全匹配
              attrName.startsWith(searchLower) || // 开头匹配
              (searchLower.length >= 3 && attrName.includes(searchLower)); // 长度>=3才允许包含匹配

            return matchesAttrId || matchesAttrDisplayId || matchesAttrName;
          });

          return matchesBasic || matchesAttributes;
        });

    // 为每个模块添加统计信息字段，以适配默认渲染器
    return baseModules.map((module) => {
      const stats = moduleStats[module.id] || { entityCount: 0, moduleCount: 0 };

      // 🔑 为模块添加关联实体信息，用于在DataListSidebar中显示"实：实体名"标签
      const relatedEntities = entities
        .filter((entity) => entity.bundles?.includes(module.id))
        .map((entity) => entity.id);

      return {
        ...module,
        // 🔑 设置关联的实体ID列表，DataListSidebar会根据这个显示"实：实体名"标签
        bundles: relatedEntities,
        // attributes字段保持原样用于显示"属：Y"标签（属性数量）
        attributes: module.attributes || [],
      };
    });
  }, [modules, searchText, moduleStats]);

  // 选择模块
  const handleModuleSelect = useCallback(
    (module: any) => {
      // 🔑 修复：使用原始ID而不是nanoid作为URL参数
      navigate({ route: 'module', entityId: module.id });
    },
    [navigate]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(
    () =>
      // 🔑 修复：检查当前是否处于新建模式
      routeState.entityId === 'new',
    [routeState.entityId]
  );

  // 添加模块 - 创建新建模式
  const handleAddModule = useCallback(async () => {
    // 如果已经有未保存的新建元素，禁用新建
    if (hasUnsavedNew) return;

    // 🔑 修复：直接导航到新建模式，不要预先创建模块对象
    navigate({ route: 'module', entityId: 'new' });
  }, [navigate, hasUnsavedNew]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    console.log('🔄 刷新模块列表');
    Toast.info('数据已刷新');
  }, []);

  // 🔑 保存模块 - 使用CurrentModuleStore
  const handleSave = useCallback(async () => {
    if (!editingModule) return;

    try {
      const isNewModule = editingModule._status === 'new';
      const moduleId = editingModule.id;

      await saveChanges();
      console.log('✅ 模块保存成功:', moduleId);

      // 🔑 修复：保存成功后刷新模块列表
      await loadModules();
      console.log('🔄 模块列表已刷新');

      Toast.success('模块保存成功');

      // 🎯 如果是新建模块，保存成功后跳转到该模块的详情页面
      if (isNewModule && moduleId) {
        console.log('🔄 新建模块保存成功，跳转到详情页面:', moduleId);
        navigate({ route: 'module', entityId: moduleId });
      }
    } catch (error) {
      console.error('❌ 模块保存失败:', error);
      Toast.error('模块保存失败');
    }
  }, [editingModule, saveChanges, navigate, loadModules]);

  // 🔑 撤销修改 - 使用CurrentModuleStore
  const handleUndo = useCallback(() => {
    if (!editingModule) return;

    resetChanges();
    console.log('↩️ 撤销模块修改:', editingModule.id);
    Toast.info('已撤销修改');
  }, [editingModule, resetChanges]);

  // 删除模块
  const handleDelete = useCallback(async () => {
    if (!selectedModule) return;

    try {
      await deleteModule(selectedModule._indexId);
      console.log('🗑️ 模块删除成功:', selectedModule.id);

      // 🔑 修复：删除成功后刷新模块列表
      await loadModules();
      console.log('🔄 模块列表已刷新');

      // 删除后清空选择
      navigate({ route: 'module' });

      Toast.success('模块删除成功');
    } catch (error) {
      console.error('❌ 模块删除失败:', error);
      Toast.error('模块删除失败');
    }
  }, [selectedModule, deleteModule, navigate, loadModules]);

  // 🎯 验证逻辑：生成详细的异常信息列表
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!editingModule) return errors;

    // 1. 检查模块ID
    if (!editingModule.id?.trim()) {
      errors.push('模块ID不能为空');
    } else {
      // 检查模块ID是否与其他模块重复
      const otherModules = modules.filter((m: any) => m._indexId !== editingModule._indexId);
      if (otherModules.some((m: any) => m.id === editingModule.id)) {
        errors.push(`模块ID "${editingModule.id}" 已存在`);
      }
    }

    // 2. 检查属性
    if (editingModule.attributes && editingModule.attributes.length > 0) {
      const attributeIds = new Set<string>();

      editingModule.attributes.forEach((attr: any, index: number) => {
        const attrPosition = `第${index + 1}个属性`;

        // 使用displayId进行验证（用户输入的部分）
        const effectiveId = attr.displayId || attr.id?.split('/').pop() || '';

        // 检查属性ID是否为空
        if (!effectiveId || effectiveId.trim() === '') {
          errors.push(`${attrPosition}的ID不能为空`);
        } else {
          // 检查属性ID是否重复
          if (attributeIds.has(effectiveId)) {
            errors.push(`属性ID "${effectiveId}" 重复`);
          } else {
            attributeIds.add(effectiveId);
          }
        }

        // 检查属性名称（可选，但如果填写了要有意义）
        if (attr.name && attr.name.trim().length === 0) {
          errors.push(`${attrPosition}的名称不能为空白字符`);
        }
      });
    }

    return errors;
  }, [editingModule, modules]);

  // 检查是否可以保存
  const canSave = useMemo(() => {
    if (!editingModule) return false;
    return Boolean(editingModule.id?.trim());
  }, [editingModule]);

  return (
    <DataManagementLayout
      title="模块管理"
      headerActions={
        selectedModule && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSaving && (
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
                    disabled={!canSave || !isDirty}
                    loading={isSaving}
                    type="primary"
                    size="small"
                    data-testid="save-module-btn"
                  >
                    保存
                  </Button>
                </Badge>
              </Tooltip>
            ) : (
              <Button
                icon={<IconSave />}
                onClick={handleSave}
                disabled={!canSave || !isDirty}
                loading={isSaving}
                type="primary"
                size="small"
                data-testid="save-module-btn"
              >
                保存
              </Button>
            )}
            {/* 🔑 修复：新建状态下不显示撤销按钮 */}
            {selectedModule?._status !== 'new' && (
              <Button
                icon={<IconUndo />}
                onClick={handleUndo}
                disabled={!isDirty}
                size="small"
                data-testid="undo-module-btn"
              >
                撤销
              </Button>
            )}
            <Popconfirm
              title="确定删除这个模块吗？"
              content="删除后将无法恢复，相关配置也会丢失"
              onConfirm={handleDelete}
            >
              <Button
                icon={<IconDelete />}
                type="danger"
                theme="borderless"
                size="small"
                data-testid="delete-module-btn"
              >
                删除
              </Button>
            </Popconfirm>
          </div>
        )
      }
      sidebarContent={
        <DataListSidebar
          items={filteredModules}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索模块ID、名称或属性..."
          selectedId={selectedModule?.id}
          selectedIdField="id"
          onItemSelect={handleModuleSelect}
          onAdd={handleAddModule}
          onRefresh={handleRefresh}
          emptyText="暂无模块"
          entities={entities}
          testId="module-sidebar"
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedModule}
          isDirty={isDirty}
          isSaving={isSaving}
          canSave={canSave}
          onSave={handleSave}
          onUndo={handleUndo}
          onDelete={handleDelete}
          validationErrors={validationErrors}
          emptyText="请选择左侧模块查看详情"
          deleteConfirmTitle="确定删除这个模块吗？"
          deleteConfirmContent="删除后将无法恢复，相关配置也会丢失"
          testId="module"
          renderContent={(module, actionButtons, statusInfo) => (
            <ModuleDetail
              selectedModule={module}
              isDirty={isDirty}
              isSaving={isSaving}
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

// 导出所有组件
export { ModuleDetail } from './module-detail';
