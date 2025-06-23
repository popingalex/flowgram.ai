import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Toast } from '@douyinfe/semi-ui';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import { useModuleStore, useCurrentModule, useCurrentModuleActions } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { ModuleDetail } from './module-detail';

export const ModuleManagementPage: React.FC = () => {
  const { modules, loading } = useModuleStore();
  const { addModule, updateModule, deleteModule } = useModuleStore();
  const { routeState, navigate } = useRouter();

  // 🔑 使用CurrentModuleStore管理编辑状态
  const { editingModule, isDirty, isSaving } = useCurrentModule();
  const { selectModule, saveChanges, resetChanges } = useCurrentModuleActions();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 获取当前选中的模块
  const selectedModule = useMemo(() => {
    if (!routeState.entityId) return null; // 复用entityId字段
    // 🔑 修复：使用原始ID而不是nanoid进行匹配
    return modules.find((module) => module.id === routeState.entityId);
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

  // 🎯 默认选中第一个模块
  useEffect(() => {
    if (!loading && modules.length > 0 && !routeState.entityId) {
      const firstModule = modules[0];
      console.log('🎯 默认选中第一个模块:', firstModule.id);
      navigate({ route: 'modules', entityId: firstModule.id });
    }
  }, [loading, modules, routeState.entityId, navigate]);

  // 过滤后的模块列表
  const filteredModules = useMemo(() => {
    if (!searchText.trim()) return modules;

    const searchLower = searchText.toLowerCase();
    return modules.filter((module) => {
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
  }, [modules, searchText]);

  // 选择模块
  const handleModuleSelect = useCallback(
    (module: any) => {
      // 🔑 修复：使用原始ID而不是nanoid作为URL参数
      navigate({ route: 'modules', entityId: module.id });
    },
    [navigate]
  );

  // 添加模块
  const handleAddModule = useCallback(async () => {
    try {
      const newModule = {
        _indexId: nanoid(),
        id: '',
        name: '',
        description: '',
        attributes: [],
        _status: 'new' as const,
      };

      addModule(newModule);
      console.log('✅ 模块添加成功:', newModule);

      // 自动选中新模块 - 等待用户输入ID后再跳转
      // navigate({ route: 'modules', entityId: newModule.id });

      Toast.success('模块添加成功');
    } catch (error) {
      console.error('❌ 模块添加失败:', error);
      Toast.error('模块添加失败');
    }
  }, [addModule, navigate]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    console.log('🔄 刷新模块列表');
    Toast.info('数据已刷新');
  }, []);

  // 🔑 保存模块 - 使用CurrentModuleStore
  const handleSave = useCallback(async () => {
    if (!selectedModule) return;

    try {
      await saveChanges();
      console.log('✅ 模块保存成功:', selectedModule.id);
      Toast.success('模块保存成功');
    } catch (error) {
      console.error('❌ 模块保存失败:', error);
      Toast.error('模块保存失败');
    }
  }, [selectedModule, saveChanges]);

  // 🔑 撤销修改 - 使用CurrentModuleStore
  const handleUndo = useCallback(() => {
    if (!selectedModule) return;

    resetChanges();
    console.log('↩️ 撤销模块修改:', selectedModule.id);
    Toast.info('已撤销修改');
  }, [selectedModule, resetChanges]);

  // 删除模块
  const handleDelete = useCallback(async () => {
    if (!selectedModule) return;

    try {
      await deleteModule(selectedModule._indexId);
      console.log('🗑️ 模块删除成功:', selectedModule.id);

      // 删除后清空选择
      navigate({ route: 'modules' });

      Toast.success('模块删除成功');
    } catch (error) {
      console.error('❌ 模块删除失败:', error);
      Toast.error('模块删除失败');
    }
  }, [selectedModule, deleteModule, navigate]);

  // 检查是否可以保存
  const canSave = useMemo(() => {
    if (!editingModule) return false;
    return Boolean(editingModule.id?.trim());
  }, [editingModule]);

  return (
    <DataManagementLayout
      title="模块管理"
      subtitle="管理系统中的所有模块定义"
      sidebarContent={
        <DataListSidebar
          items={filteredModules}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索模块ID、名称或属性..."
          selectedId={selectedModule?.id}
          onItemSelect={handleModuleSelect}
          onAdd={handleAddModule}
          onRefresh={handleRefresh}
          emptyText="暂无模块"
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
          emptyText="请选择左侧模块查看详情"
          deleteConfirmTitle="确定删除这个模块吗？"
          deleteConfirmContent="删除后将无法恢复，相关配置也会丢失"
          renderContent={(module) => (
            <ModuleDetail
              selectedModule={module}
              isDirty={isDirty}
              isSaving={isSaving}
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

// 导出所有组件
export { ModuleDetail } from './module-detail';
