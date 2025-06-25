import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Toast, Button, Popconfirm, Typography } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { useRouter } from '../../hooks/use-router';
import { DataListSidebar } from './sidebar';
import { DataManagementLayout } from './layout';
import { DetailPanel } from './detail-panel';

const { Text } = Typography;

// 基础数据项接口
export interface BaseDataItem {
  _indexId: string;
  id: string;
  name: string;
  description?: string;
  _status?: 'new' | 'editing' | 'saved';
}

// 基础管理配置
export interface BaseManagementConfig<T extends BaseDataItem> {
  // 路由配置
  routeName: string; // 'entities' | 'modules' | 'behavior'

  // 数据操作
  dataHooks: {
    useList: () => { data: T[]; loading: boolean };
    useActions: () => {
      loadData: () => Promise<void>;
      saveItem: (item: T) => Promise<void>;
      createItem: (item: T) => Promise<void>;
      deleteItem: (id: string) => Promise<void>;
    };
    useCurrent: () => {
      editingItem: T | null;
      isDirty: boolean;
      isSaving: boolean;
    };
    useCurrentActions: () => {
      selectItem: (item: T | null) => void;
      resetChanges: () => void;
      saveChanges?: () => Promise<void>;
    };
  };

  // UI配置
  ui: {
    title: string;
    newButtonText: string;
    itemDisplayName: string; // '实体' | '模块' | '行为'
    searchPlaceholder: string;
  };

  // 自定义渲染
  renderDetail: (item: T | null, onSave: () => void, onUndo: () => void) => React.ReactNode;
  renderListItem?: (item: T, isSelected: boolean, searchText: string) => React.ReactNode;

  // 自定义逻辑
  createNewItem?: () => T;
  filterItems?: (items: T[], searchText: string) => T[];
  validateItem?: (item: T) => { isValid: boolean; errors: string[] };
}

// 通用管理页面Hook
export function useBaseManagement<T extends BaseDataItem>(config: BaseManagementConfig<T>) {
  const { routeState, navigate } = useRouter();
  const [searchText, setSearchText] = useState('');

  // 数据hooks
  const { data: items, loading } = config.dataHooks.useList();
  const { loadData, saveItem, createItem, deleteItem } = config.dataHooks.useActions();
  const { editingItem, isDirty, isSaving } = config.dataHooks.useCurrent();
  const { selectItem, resetChanges, saveChanges } = config.dataHooks.useCurrentActions();

  // 获取当前选中的项
  const selectedItem = useMemo(() => {
    if (!routeState.entityId) return null;

    // 新建模式
    if (routeState.entityId === 'new') {
      return config.createNewItem
        ? config.createNewItem()
        : ({
            _indexId: nanoid(),
            id: '',
            name: '',
            description: '',
            _status: 'new' as const,
          } as T);
    }

    // 查找现有项
    const item = items.find((item) => item.id === routeState.entityId);
    return item || null;
  }, [items, routeState.entityId, config.createNewItem]);

  // 同步选中项到Current Store
  useEffect(() => {
    if (selectedItem) {
      selectItem(selectedItem);
    } else {
      selectItem(null);
    }
  }, [selectedItem, selectItem]);

  // 默认选择第一个项
  useEffect(() => {
    if (!loading && items.length > 0 && !routeState.entityId) {
      const firstItem = items[0];
      navigate({ route: config.routeName as any, entityId: firstItem.id });
    }
  }, [loading, items.length, routeState.entityId, navigate, config.routeName]);

  // 过滤项列表
  const filteredItems = useMemo(() => {
    if (config.filterItems) {
      return config.filterItems(items, searchText);
    }

    if (!searchText.trim()) return items;

    const searchLower = searchText.toLowerCase();
    return items.filter(
      (item) =>
        item.id?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  }, [items, searchText, config.filterItems]);

  // 选择项
  const handleItemSelect = useCallback(
    (item: T) => {
      navigate({ route: config.routeName as any, entityId: item.id });
    },
    [navigate, config.routeName]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(() => routeState.entityId === 'new', [routeState.entityId]);

  // 添加新项
  const handleAdd = useCallback(async () => {
    if (hasUnsavedNew) return;
    navigate({ route: config.routeName as any, entityId: 'new' });
  }, [navigate, hasUnsavedNew, config.routeName]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    await loadData();
    Toast.info('数据已刷新');
  }, [loadData]);

  // 保存项
  const handleSave = useCallback(async () => {
    const itemToSave = editingItem || selectedItem;
    if (!itemToSave) return;

    // 验证
    if (config.validateItem) {
      const validation = config.validateItem(itemToSave);
      if (!validation.isValid) {
        Toast.error(validation.errors.join(', '));
        return;
      }
    }

    try {
      const wasNew = itemToSave._status === 'new';

      if (saveChanges) {
        // 使用Current Store的保存方法
        await saveChanges();
      } else {
        // 直接调用API
        if (wasNew) {
          await createItem(itemToSave);
        } else {
          await saveItem(itemToSave);
        }
      }

      // 刷新数据
      await loadData();

      Toast.success(`${config.ui.itemDisplayName}保存成功`);

      // 如果是新建，跳转到新项的详情页面
      if (wasNew && itemToSave.id) {
        navigate({ route: config.routeName as any, entityId: itemToSave.id });
      }
    } catch (error) {
      console.error(`${config.ui.itemDisplayName}保存失败:`, error);
      Toast.error(`${config.ui.itemDisplayName}保存失败`);
    }
  }, [editingItem, selectedItem, saveChanges, createItem, saveItem, loadData, navigate, config]);

  // 撤销修改
  const handleUndo = useCallback(() => {
    if (!selectedItem) return;
    resetChanges();
    Toast.info('已撤销修改');
  }, [selectedItem, resetChanges]);

  // 删除项
  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteItem(selectedItem._indexId);

      // 刷新数据
      await loadData();

      Toast.success(`${config.ui.itemDisplayName}删除成功`);

      // 删除后导航到第一个项或空状态
      if (filteredItems.length > 1) {
        const remainingItems = filteredItems.filter(
          (item) => item._indexId !== selectedItem._indexId
        );
        if (remainingItems.length > 0) {
          navigate({ route: config.routeName as any, entityId: remainingItems[0].id });
        } else {
          navigate({ route: config.routeName as any });
        }
      } else {
        navigate({ route: config.routeName as any });
      }
    } catch (error) {
      console.error(`${config.ui.itemDisplayName}删除失败:`, error);
      Toast.error(`${config.ui.itemDisplayName}删除失败`);
    }
  }, [selectedItem, deleteItem, loadData, filteredItems, navigate, config]);

  return {
    // 状态
    items,
    loading,
    selectedItem,
    editingItem,
    isDirty,
    isSaving,
    searchText,
    filteredItems,
    hasUnsavedNew,

    // 操作
    setSearchText,
    handleItemSelect,
    handleAdd,
    handleRefresh,
    handleSave,
    handleUndo,
    handleDelete,
  };
}

// 通用管理页面组件
export function BaseManagementPage<T extends BaseDataItem>(props: {
  config: BaseManagementConfig<T>;
}) {
  const { config } = props;
  const management = useBaseManagement(config);

  const {
    filteredItems,
    selectedItem,
    editingItem,
    isDirty,
    isSaving,
    searchText,
    hasUnsavedNew,
    setSearchText,
    handleItemSelect,
    handleAdd,
    handleRefresh,
    handleSave,
    handleUndo,
    handleDelete,
  } = management;

  return (
    <DataManagementLayout
      title={config.ui.title}
      sidebarContent={
        <DataListSidebar
          items={filteredItems}
          searchText={searchText}
          searchPlaceholder={config.ui.searchPlaceholder}
          onSearchChange={setSearchText}
          onItemSelect={handleItemSelect}
          onAdd={handleAdd}
          onRefresh={handleRefresh}
          addDisabled={hasUnsavedNew}
          selectedId={selectedItem?.id}
          renderItem={
            config.renderListItem
              ? (item: T, isSelected: boolean) =>
                  config.renderListItem!(item, isSelected, searchText)
              : undefined
          }
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedItem}
          isDirty={isDirty}
          isSaving={isSaving}
          canSave={true}
          onSave={handleSave}
          onUndo={selectedItem?._status !== 'new' ? handleUndo : undefined}
          onDelete={selectedItem?._status !== 'new' ? handleDelete : undefined}
          saveButtonText="保存"
          undoButtonText="撤销"
          deleteButtonText="删除"
          deleteConfirmTitle={`确认删除${config.ui.itemDisplayName}？`}
          deleteConfirmContent="删除后无法恢复，请确认。"
          emptyText={`选择一个${config.ui.itemDisplayName}`}
          renderContent={(item) => config.renderDetail(item, handleSave, handleUndo)}
        />
      }
    />
  );
}
