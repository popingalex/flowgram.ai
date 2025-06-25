import React, { ReactNode } from 'react';

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
} from '@douyinfe/semi-icons';

const { Text } = Typography;

interface DataListItem {
  id: string;
  _indexId: string;
  name?: string;
  [key: string]: any;
}

interface DataListSidebarProps<T extends DataListItem> {
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
  selectedIdField?: keyof T; // 新增：指定用于选中比较的字段

  // 操作
  onAdd?: () => void;
  onRefresh?: () => void;
  addDisabled?: boolean; // 新增：是否禁用新建按钮

  // 🔑 新增：拖拽排序
  enableDragSort?: boolean; // 是否启用拖拽排序
  onDragSort?: (oldIndex: number, newIndex: number) => void; // 拖拽排序回调

  // 渲染
  renderItem?: (item: T, isSelected: boolean, index?: number) => ReactNode; // 🔑 添加index参数
  emptyText?: string;

  // 模块数据（用于实体管理）
  modules?: Array<{ id: string; name?: string; [key: string]: any }>;

  // 行为树数据（用于实体管理）
  graphs?: Array<{ id: string; _indexId?: string; nodes?: any[]; [key: string]: any }>;

  // 样式和测试
  style?: React.CSSProperties;
  testId?: string; // 自定义测试ID
}

export function DataListSidebar<T extends DataListItem>({
  items,
  loading = false,
  searchText,
  onSearchChange,
  searchPlaceholder = '搜索...',
  selectedId,
  onItemSelect,
  selectedIdField = 'id', // 默认使用id字段
  onAdd,
  onRefresh,
  addDisabled = false, // 默认不禁用
  enableDragSort = false, // 🔑 新增：默认不启用拖拽排序
  onDragSort, // 🔑 新增：拖拽排序回调
  renderItem,
  emptyText = '暂无数据',
  modules,
  graphs,
  style,
  testId = 'entity-sidebar', // 默认值为entity-sidebar，保持向后兼容
}: DataListSidebarProps<T>) {
  // 渲染统计信息 - 垂直分布
  const renderStats = (item: T) => {
    // 🔑 计算模块数量
    const moduleCount = item.bundles?.length || 0;

    // 🔑 计算属性数量
    const attributeCount = item.attributes?.length || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {/* 模块统计 - 只有当有模块时才显示 */}
        {moduleCount > 0 && (
          <Tag size="small" color="green">
            模：{moduleCount}
          </Tag>
        )}

        {/* 属性统计 - 只有当有属性时才显示 */}
        {attributeCount > 0 && (
          <Tag size="small" color="blue">
            属：{attributeCount}
          </Tag>
        )}
      </div>
    );
  };

  // 渲染模块标签
  const renderModuleTags = (item: T) => {
    if (!item.bundles || !modules) return null;

    const searchWords = searchText.trim() ? [searchText.trim()] : [];

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

  // 🔑 新增：处理拖拽排序
  const handleMoveBehavior = (index: number, direction: 'up' | 'down') => {
    if (!onDragSort) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    onDragSort(index, newIndex);
  };

  // 默认渲染函数 - 新的两行布局
  const defaultRenderItem = (item: T, isSelected: boolean, index?: number) => (
    <List.Item
      style={{
        backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
        padding: '12px 16px',
        position: 'relative',
      }}
      className="data-list-item"
      data-testid={`${testId.replace('-sidebar', '')}-item-${item.id || item._indexId}`}
    >
      {/* 🔑 拖拽排序按钮 */}
      {enableDragSort && typeof index === 'number' && (
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 10,
          }}
        >
          <Button
            icon={<IconChevronUp />}
            size="small"
            theme="borderless"
            disabled={index === 0 || (item as any).isNew}
            onClick={(e) => {
              e.stopPropagation();
              handleMoveBehavior(index, 'up');
            }}
            style={{ width: '24px', height: '20px', padding: 0 }}
          />
          <Button
            icon={<IconChevronDown />}
            size="small"
            theme="borderless"
            disabled={index === items.length - 1 || (item as any).isNew}
            onClick={(e) => {
              e.stopPropagation();
              handleMoveBehavior(index, 'down');
            }}
            style={{ width: '24px', height: '20px', padding: 0 }}
          />
        </div>
      )}

      <div
        style={{
          width: '100%',
          cursor: 'pointer',
          paddingRight: enableDragSort ? '40px' : '0',
        }}
        onClick={() => onItemSelect(item)}
      >
        {/* 第一行：左侧实体信息 + 右侧统计 */}
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
              <Highlight
                sourceString={item.id || ''}
                searchWords={searchText.trim() ? [searchText.trim()] : []}
              />
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
                <Highlight
                  sourceString={item.name}
                  searchWords={searchText.trim() ? [searchText.trim()] : []}
                />
              </Text>
            )}
          </div>
          <div style={{ flexShrink: 0, marginLeft: '8px' }}>{renderStats(item)}</div>
        </div>

        {/* 第二行：模块标签 */}
        {renderModuleTags(item)}
      </div>
    </List.Item>
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // 防止整个容器滚动
        ...style,
      }}
      data-testid={testId}
    >
      <style>
        {`
          .data-list-item:hover {
            background-color: var(--semi-color-fill-0) !important;
          }
          .data-list-item:active {
            background-color: var(--semi-color-fill-1) !important;
          }
        `}
      </style>
      {/* 搜索栏和操作按钮 - 固定高度 */}
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
            data-testid={`${testId.replace('-sidebar', '')}-search-input`}
          />
          {onAdd && (
            <Button
              icon={<IconPlus />}
              type="primary"
              size="small"
              onClick={onAdd}
              disabled={addDisabled}
              data-testid={`add-${testId.replace('-sidebar', '')}-btn`}
            />
          )}
          {onRefresh && (
            <Button
              icon={<IconRefresh />}
              type="tertiary"
              size="small"
              onClick={onRefresh}
              loading={loading}
            />
          )}
        </Space>
      </div>

      {/* 列表内容 - 占满剩余空间并可滚动 */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden', // 外层容器不滚动
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            dataSource={items}
            size="small"
            split={true}
            style={{
              flex: 1,
              overflow: 'auto', // 只有List内容可滚动
            }}
            emptyContent={
              <Empty
                image={<IconSearch size="large" />}
                title="暂无数据"
                description={emptyText}
                style={{ padding: '32px' }}
              />
            }
            renderItem={(item, index) => {
              // 🔑 修复：使用id进行匹配，而不是_indexId
              const isSelected = selectedId === item[selectedIdField];
              return renderItem
                ? renderItem(item, isSelected, index)
                : defaultRenderItem(item, isSelected, index);
            }}
          />
        )}
      </div>
    </div>
  );
}
