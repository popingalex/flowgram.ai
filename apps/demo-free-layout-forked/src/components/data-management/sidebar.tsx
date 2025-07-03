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
  Tooltip,
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
  entities?: Array<{ id: string; name?: string; bundles?: string[]; [key: string]: any }>;
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
  entities?: Array<{ id: string; name?: string; bundles?: string[]; [key: string]: any }>;
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
  entities,
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

  // 渲染统计信息
  const renderStats = () => {
    const moduleCount = item.bundles?.length || 0;
    const attributeCount = 0; // 实体不再支持属性

    // 🔑 检测是否为模块管理页面（通过testId判断）
    const isModulePage = testId?.includes('module');

    // 🔑 计算被实体引用次数（仅在模块管理页面显示）
    let entityReferenceCount = 0;
    if (isModulePage && entities && entities.length > 0) {
      entityReferenceCount = entities.filter((entity) => entity.bundles?.includes(item.id)).length;
    }

    // 如果所有统计都为0，不显示统计区域
    if (moduleCount === 0 && entityReferenceCount === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {/* 在模块页面显示被实体引用次数 */}
        {isModulePage && entityReferenceCount > 0 && (
          <Tag size="small" color="orange">
            实：{entityReferenceCount}
          </Tag>
        )}
        {/* 在实体页面显示关联的模块数量，添加tooltip显示具体模块列表 */}
        {!isModulePage && moduleCount > 0 && (
          <Tooltip
            content={
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>关联模块：</div>
                {item.bundles?.map((moduleId: string) => {
                  const module = modules?.find((m) => m.id === moduleId);
                  const displayText = module?.name || moduleId;
                  return (
                    <div key={moduleId} style={{ fontSize: '12px', marginBottom: '2px' }}>
                      • {displayText}
                    </div>
                  );
                })}
              </div>
            }
            position="left"
          >
            <Tag size="small" color="green">
              模：{moduleCount}
            </Tag>
          </Tooltip>
        )}
        {/* 实体不再支持属性，移除属性计数显示 */}
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: '20px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
            <Text
              style={{
                color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '13px',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '20px',
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
                  lineHeight: '16px',
                }}
              >
                <Highlight sourceString={item.name} searchWords={searchWords} />
              </Text>
            )}
          </div>
          <div style={{ 
            flexShrink: 0, 
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            minWidth: 'fit-content'
          }}>
            {renderStats()}
          </div>
        </div>
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
  entities,
  style,
  testId = 'data-sidebar',
}: DataListSidebarProps<T>) {
  const [draggedItems, setDraggedItems] = useState<T[]>([]);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = draggedItems.findIndex((item) => getRowKey(item) === active.id);
      const newIndex = draggedItems.findIndex((item) => getRowKey(item) === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(draggedItems, oldIndex, newIndex);
        setDraggedItems(newItems);
        onDragSort?.(oldIndex, newIndex);
      }
    }
  };

  // 获取行键值
  const getRowKey = (item: T) => {
    return item[selectedIdField] as string;
  };

  // 初始化拖拽数据
  React.useEffect(() => {
    if (enableDragSort) {
      setDraggedItems([...items]);
    }
  }, [items, enableDragSort]);

  // 获取渲染函数
  const getRenderFunction = (): ((
    context: RenderContext<T> & { dragHandleRef?: any; dragHandleListeners?: any }
  ) => ReactNode) => {
    // 1. 优先使用新的 renderMethod
    if (renderMethod.type === 'custom') {
      return renderMethod.render;
    }
    if (renderMethod.type === 'children') {
      return renderMethod.children;
    }

    // 2. 向后兼容：使用旧的 renderItem
    if (renderItem) {
      return ({ item, isSelected, index }) => renderItem(item, isSelected, index);
    }

    // 3. 默认渲染
    return DefaultItemRenderer;
  };

  const renderFunction = getRenderFunction();
  const displayItems = enableDragSort ? draggedItems : items;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      data-testid={testId}
    >
      {/* 修复：顶部操作栏 - 单行布局，左侧搜索框，右侧按钮 */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--semi-color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--semi-color-bg-1)',
        }}
      >
        {/* 搜索框 - 占据剩余空间 */}
        <Input
          prefix={<IconSearch />}
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={onSearchChange}
          showClear
          style={{ flex: 1 }}
          data-testid={`${testId}-search`}
        />
        
        {/* 按钮组 - 右对齐 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {onAdd && (
            <Button
              icon={<IconPlus />}
              onClick={onAdd}
              disabled={addDisabled}
              theme="borderless"
              size="small"
              data-testid={`${testId}-add`}
              style={{ padding: '4px' }}
            />
          )}
          {onRefresh && (
            <Button
              icon={<IconRefresh />}
              onClick={onRefresh}
              theme="borderless"
              size="small"
              data-testid={`${testId}-refresh`}
              style={{ padding: '4px' }}
            />
          )}
        </div>
      </div>

      {/* 列表内容 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <Spin />
          </div>
        ) : displayItems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <Empty description={emptyText} />
          </div>
        ) : enableDragSort ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayItems.map(getRowKey)} strategy={verticalListSortingStrategy}>
              <List
                dataSource={displayItems}
                renderItem={(item, index) => {
                  const key = getRowKey(item);
                  const isSelected = selectedId === key;

                  const DraggableItemWrapper = (props: any) => {
                    const context: RenderContext<T> = {
                      item,
                      isSelected,
                      index,
                      searchText,
                      modules,
                      entities,
                      onItemSelect,
                      enableDragSort,
                      onDragSort,
                      testId,
                      totalItems: displayItems.length,
                      ...props,
                    };

                    return renderFunction(context);
                  };

                  return (
                    <SortableItem key={key} id={key}>
                      <DraggableItemWrapper />
                    </SortableItem>
                  );
                }}
                style={{ padding: 0 }}
              />
            </SortableContext>
          </DndContext>
        ) : (
          <List
            dataSource={displayItems}
            renderItem={(item, index) => {
              const key = getRowKey(item);
              const isSelected = selectedId === key;

              const context: RenderContext<T> = {
                item,
                isSelected,
                index,
                searchText,
                modules,
                entities,
                onItemSelect,
                enableDragSort,
                onDragSort,
                testId,
                totalItems: displayItems.length,
              };

              return (
                <List.Item key={key} style={{ padding: 0 }}>
                  {renderFunction(context)}
                </List.Item>
              );
            }}
            style={{ padding: 0 }}
          />
        )}
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
