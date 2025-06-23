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
import { IconSearch, IconPlus, IconRefresh } from '@douyinfe/semi-icons';

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

  // 操作
  onAdd?: () => void;
  onRefresh?: () => void;

  // 渲染
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  emptyText?: string;

  // 模块数据（用于实体管理）
  modules?: Array<{ id: string; name?: string; [key: string]: any }>;

  // 行为树数据（用于实体管理）
  graphs?: Array<{ id: string; _indexId?: string; nodes?: any[]; [key: string]: any }>;

  // 样式
  style?: React.CSSProperties;
}

export function DataListSidebar<T extends DataListItem>({
  items,
  loading = false,
  searchText,
  onSearchChange,
  searchPlaceholder = '搜索...',
  selectedId,
  onItemSelect,
  onAdd,
  onRefresh,
  renderItem,
  emptyText = '暂无数据',
  modules,
  graphs,
  style,
}: DataListSidebarProps<T>) {
  // 渲染统计信息 - 垂直分布
  const renderStats = (item: T) => {
    // 🔑 计算行为树节点数量 - 使用_indexId进行关联
    let behaviorNodeCount = 0;
    if (graphs && item._indexId) {
      const graph = graphs.find((g) => g._indexId === item._indexId);
      behaviorNodeCount = graph?.nodes?.length || 0;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {/* 属性数量 - 只有当有属性时才显示 */}
        {item.attributes && item.attributes.length > 0 && (
          <Tag size="small" color="blue">
            属：{item.attributes.length}
          </Tag>
        )}

        {/* 行为树节点数量统计 - 只有当有节点时才显示 */}
        {behaviorNodeCount > 0 && (
          <Tag size="small" color="orange">
            行：{behaviorNodeCount}
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

  // 默认渲染函数 - 新的两行布局
  const defaultRenderItem = (item: T, isSelected: boolean) => (
    <List.Item
      onClick={() => onItemSelect(item)}
      style={{
        backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
        padding: '12px 16px',
        cursor: 'pointer',
      }}
      className="data-list-item"
    >
      <div style={{ width: '100%' }}>
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
          />
          {onAdd && <Button icon={<IconPlus />} type="primary" size="small" onClick={onAdd} />}
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
            renderItem={(item) => {
              // 🔑 修复：使用原始ID进行匹配，而不是nanoid
              const isSelected = selectedId === item.id;
              return renderItem
                ? renderItem(item, isSelected)
                : defaultRenderItem(item, isSelected);
            }}
          />
        )}
      </div>
    </div>
  );
}
