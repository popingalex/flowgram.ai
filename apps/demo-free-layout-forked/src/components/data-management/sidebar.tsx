import React, { ReactNode, useState } from 'react';

import {
  Input,
  Button,
  Space,
  Spin,
  Empty,
  List,
  Tag,
  Typography,
  Highlight,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
  IconHandle,
} from '@douyinfe/semi-icons';

// 🔑 引入dnd-kit拖拽排序相关组件
import { CSS } from '@dnd-kit/utilities';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';

const { Text } = Typography;

// 🔑 可拖拽的列表项组件 - 支持拖拽手柄
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function SortableItem({ id, children, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 🔑 修复：使用拖拽手柄模式，只有手柄可以拖拽
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 🔑 传递拖拽手柄的ref和listeners给子组件 */}
      {React.cloneElement(children as React.ReactElement, {
        dragHandleRef: setActivatorNodeRef,
        dragHandleListeners: listeners,
      })}
    </div>
  );
}

// 最基础的数据结构 - 只包含必需字段
interface BaseDataItem {
  id: string; // 业务ID
  _indexId: string; // nanoid索引ID (React key)
}

// 默认渲染需要的字段
interface DefaultRenderFields {
  name?: string; // 显示名称
  desc?: string; // 描述
  bundles?: string[]; // 关联模块ID列表
  attributes?: any[]; // 属性列表
}

// 拖拽排序相关字段
interface DragSortFields {
  _status?: 'new' | 'saved' | 'dirty' | 'saving'; // 状态管理
  priority?: number; // 优先级
}

// 完整的默认数据项（向后兼容）
type DataListItem = BaseDataItem &
  DefaultRenderFields &
  DragSortFields & {
    [key: string]: any; // 允许其他扩展字段
  };

// 渲染上下文
interface RenderContext<T extends BaseDataItem> {
  item: T;
  isSelected: boolean;
  index?: number;
  searchText: string;
  modules?: Array<{ id: string; name?: string; [key: string]: any }>;
  onItemSelect: (item: T) => void;
  // 拖拽排序相关
  enableDragSort?: boolean;
  onDragSort?: (oldIndex: number, newIndex: number) => void;
  testId?: string;
  // 列表总数（用于计算是否为最后一项）
  totalItems?: number;
}

// 渲染方式的联合类型
type RenderMethod<T extends BaseDataItem> =
  | { type: 'default' } // 使用默认渲染
  | {
      type: 'custom';
      render: (
        context: RenderContext<T> & { dragHandleRef?: any; dragHandleListeners?: any }
      ) => ReactNode;
    } // 自定义渲染函数
  | {
      type: 'children';
      children: (
        context: RenderContext<T> & { dragHandleRef?: any; dragHandleListeners?: any }
      ) => ReactNode;
    }; // render props

interface DataListSidebarProps<T extends BaseDataItem> {
  // 数据
  items: T[];
  loading?: boolean;

  // 搜索
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;

  // 选择
  selectedId?: string;
  onItemSelect: (item: T) => void;
  selectedIdField?: keyof T; // 指定用于选中比较的字段

  // 操作
  onAdd?: () => void;
  onRefresh?: () => void;
  addDisabled?: boolean;

  // 拖拽排序
  enableDragSort?: boolean;
  onDragSort?: (oldIndex: number, newIndex: number) => void;

  // 渲染方式 - 三选一
  renderMethod?: RenderMethod<T>;

  // 兼容性：旧的renderItem方法（已废弃，但保留向后兼容）
  /** @deprecated 请使用 renderMethod 替代 */
  renderItem?: (item: T, isSelected: boolean, index?: number) => ReactNode;

  // 其他配置
  emptyText?: string;
  modules?: Array<{ id: string; name?: string; [key: string]: any }>;
  style?: React.CSSProperties;
  testId?: string;
}

// 默认渲染实现
function DefaultItemRenderer<T extends BaseDataItem & DefaultRenderFields & DragSortFields>({
  item,
  isSelected,
  index,
  searchText,
  modules,
  onItemSelect,
  enableDragSort,
  onDragSort,
  testId = 'data-sidebar',
  totalItems = 0,
  ...props // 🔑 接收拖拽手柄的props
}: RenderContext<T> & { dragHandleRef?: any; dragHandleListeners?: any }) {
  const searchWords = searchText.trim() ? [searchText.trim()] : [];

  // 🔑 获取拖拽手柄的props
  const { dragHandleRef, dragHandleListeners } = props;

  // 🔑 移除旧的HTML5拖拽代码，现在使用dnd-kit

  // 渲染统计信息
  const renderStats = () => {
    const moduleCount = item.bundles?.length || 0;
    const attributeCount = item.attributes?.length || 0;

    if (moduleCount === 0 && attributeCount === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {moduleCount > 0 && (
          <Tag size="small" color="green">
            模：{moduleCount}
          </Tag>
        )}
        {attributeCount > 0 && (
          <Tag size="small" color="blue">
            属：{attributeCount}
          </Tag>
        )}
      </div>
    );
  };

  // 渲染模块标签
  const renderModuleTags = () => {
    if (!item.bundles || !modules || item.bundles.length === 0) return null;

    return (
      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {item.bundles.map((moduleId: string) => {
          const module = modules.find((m) => m.id === moduleId);
          const displayText = module?.name || moduleId;

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
    );
  };

  return (
    <List.Item
      style={{
        backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
        padding: '12px 16px',
        position: 'relative',
      }}
      className="data-list-item"
      data-testid={`${testId.replace('-sidebar', '')}-item-${item.id || item._indexId}`}
    >
      {/* 🔑 拖拽手柄 - 修复：简化显示条件 */}
      {enableDragSort && (
        <div
          ref={dragHandleRef}
          {...(dragHandleListeners || {})}
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'grab',
            padding: '4px',
            borderRadius: '4px',
            backgroundColor: 'var(--semi-color-fill-0)',
            border: '1px solid var(--semi-color-border)',
            zIndex: 10,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="拖拽排序"
        >
          <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>⋮⋮</span>
        </div>
      )}

      <div
        style={{
          width: '100%',
          cursor: 'pointer',
          paddingLeft: enableDragSort ? '40px' : '0', // 🔑 修复：为左侧拖拽手柄留出空间
        }}
        onClick={() => onItemSelect(item)}
      >
        {/* 第一行：左侧信息 + 右侧统计 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
              <Highlight sourceString={item.id} searchWords={searchWords} />
            </Text>
            {item.name && (
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
                <Highlight sourceString={item.name} searchWords={searchWords} />
              </Text>
            )}
          </div>
          <div style={{ flexShrink: 0, marginLeft: '8px' }}>{renderStats()}</div>
        </div>

        {/* 第二行：模块标签 */}
        {renderModuleTags()}
      </div>
    </List.Item>
  );
}

export function DataListSidebar<T extends BaseDataItem>({
  items,
  loading = false,
  searchText,
  onSearchChange,
  searchPlaceholder = '搜索...',
  selectedId,
  onItemSelect,
  selectedIdField = 'id',
  onAdd,
  onRefresh,
  addDisabled = false,
  enableDragSort = false,
  onDragSort,
  renderMethod = { type: 'default' },
  renderItem, // 向后兼容
  emptyText = '暂无数据',
  modules,
  style,
  testId = 'data-sidebar',
}: DataListSidebarProps<T>) {
  // 🔑 配置拖拽传感器 - 修复：使用手柄模式，避免与选中冲突
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖拽8px才激活，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 🔑 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🔄 [DataListSidebar] 拖拽结束:', {
      activeId: active.id,
      overId: over?.id,
      hasOnDragSort: !!onDragSort,
      itemsCount: items.length,
      itemsIndexIds: items.map((item) => item._indexId),
    });

    if (active.id !== over?.id && onDragSort) {
      const oldIndex = items.findIndex((item) => item._indexId === active.id);
      const newIndex = items.findIndex((item) => item._indexId === over?.id);

      console.log('🔄 [DataListSidebar] 拖拽索引:', {
        oldIndex,
        newIndex,
        activeId: active.id,
        overId: over?.id,
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        onDragSort(oldIndex, newIndex);
      } else {
        console.log('❌ [DataListSidebar] 拖拽索引无效');
      }
    }
  };

  // 确定渲染函数
  const getRenderFunction = (): ((
    context: RenderContext<T> & { dragHandleRef?: any; dragHandleListeners?: any }
  ) => ReactNode) => {
    // 向后兼容：如果提供了旧的renderItem，优先使用
    if (renderItem) {
      return (context) => renderItem(context.item, context.isSelected, context.index);
    }

    // 根据renderMethod选择渲染方式
    switch (renderMethod.type) {
      case 'custom':
        return renderMethod.render;
      case 'children':
        return renderMethod.children;
      case 'default':
      default:
        return (context) =>
          DefaultItemRenderer(
            context as RenderContext<T & DefaultRenderFields & DragSortFields> & {
              dragHandleRef?: any;
              dragHandleListeners?: any;
            }
          );
    }
  };

  const renderFunction = getRenderFunction();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      {/* 搜索栏和操作按钮 - 恢复原来的一行布局 */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--semi-color-border)',
          backgroundColor: 'var(--semi-color-bg-1)',
          flexShrink: 0, // 不允许收缩
        }}
      >
        <Space style={{ width: '100%' }}>
          <Input
            prefix={<IconSearch />}
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={onSearchChange}
            style={{ flex: 1 }}
            size="small"
            showClear
            data-testid={`${testId}-search`}
          />
          {onAdd && (
            <Button
              icon={<IconPlus />}
              type="primary"
              size="small"
              onClick={onAdd}
              disabled={addDisabled}
              data-testid={`${testId}-add`}
            />
          )}
          {onRefresh && (
            <Button
              icon={<IconRefresh />}
              size="small"
              onClick={onRefresh}
              data-testid={`${testId}-refresh`}
            />
          )}
        </Space>
      </div>

      {/* 列表内容 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={loading}>
          {items.length === 0 ? (
            <Empty
              image={<IconSearch size="large" />}
              title="暂无数据"
              description={emptyText}
              style={{ padding: '40px 20px' }}
            />
          ) : enableDragSort ? (
            // 🔑 启用拖拽排序时使用DndContext
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item._indexId)}
                strategy={verticalListSortingStrategy}
              >
                <List
                  dataSource={items}
                  renderItem={(item, index) => {
                    const isSelected = String(item[selectedIdField]) === String(selectedId);
                    const context: RenderContext<T> = {
                      item,
                      isSelected,
                      index,
                      searchText,
                      modules,
                      onItemSelect,
                      enableDragSort,
                      onDragSort,
                      testId,
                      totalItems: items.length,
                    };

                    // 🔑 修复：创建一个可以接收拖拽props的组件
                    const DraggableItemWrapper = (props: any) => {
                      const extendedContext = { ...context, ...props };
                      return renderFunction(extendedContext);
                    };

                    return (
                      <SortableItem key={item._indexId} id={item._indexId} disabled={false}>
                        <DraggableItemWrapper />
                      </SortableItem>
                    );
                  }}
                  style={{ padding: 0 }}
                />
              </SortableContext>
            </DndContext>
          ) : (
            // 🔑 不启用拖拽排序时使用普通List
            <List
              dataSource={items}
              renderItem={(item, index) => {
                const isSelected = String(item[selectedIdField]) === String(selectedId);
                const context: RenderContext<T> = {
                  item,
                  isSelected,
                  index,
                  searchText,
                  modules,
                  onItemSelect,
                  enableDragSort,
                  onDragSort,
                  testId,
                  totalItems: items.length,
                };
                return renderFunction(context);
              }}
              style={{ padding: 0 }}
            />
          )}
        </Spin>
      </div>
    </div>
  );
}

// 导出类型定义
export type {
  BaseDataItem,
  DefaultRenderFields,
  DragSortFields,
  DataListItem,
  RenderContext,
  RenderMethod,
  DataListSidebarProps,
};
