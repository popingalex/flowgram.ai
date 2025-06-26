import React from 'react';

import { Tag, Typography } from '@douyinfe/semi-ui';

import {
  DataListSidebar,
  BaseDataItem,
  DefaultRenderFields,
  DragSortFields,
  RenderContext,
} from './sidebar';

const { Text } = Typography;

// 示例1: 最基础的数据结构
interface BasicItem extends BaseDataItem {
  // 只包含基础字段：id, _indexId
}

// 示例2: 扩展数据结构 - 实体
interface EntityItem extends BaseDataItem, DefaultRenderFields {
  entityType: string;
  version: string;
}

// 示例3: 完全自定义数据结构 - 行为
interface BehaviorItem extends BaseDataItem, DragSortFields {
  desc: string;
  nodeCount: number;
  edgeCount: number;
  tags: string[];
}

// 使用示例组件
export const DataListSidebarExamples: React.FC = () => {
  // 模拟数据
  const basicItems: BasicItem[] = [
    { id: 'item1', _indexId: 'idx1' },
    { id: 'item2', _indexId: 'idx2' },
  ];

  const entityItems: EntityItem[] = [
    {
      id: 'vehicle',
      _indexId: 'ent1',
      name: '车辆实体',
      desc: '移动载具',
      bundles: ['mobile', 'container'],
      attributes: [{ id: 'speed', name: '速度' }],
      entityType: 'physical',
      version: '1.0.0',
    },
  ];

  const behaviorItems: BehaviorItem[] = [
    {
      id: 'patrol',
      _indexId: 'beh1',
      desc: '巡逻行为',
      nodeCount: 5,
      edgeCount: 4,
      tags: ['movement', 'ai'],
      priority: 1,
      isNew: false,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
      {/* 示例1: 使用默认渲染 */}
      <div style={{ width: '300px', border: '1px solid #ccc' }}>
        <h3>默认渲染</h3>
        <DataListSidebar
          items={basicItems}
          searchText=""
          onSearchChange={() => {}}
          selectedId="item1"
          onItemSelect={(item) => console.log('选择:', item)}
          renderMethod={{ type: 'default' }}
        />
      </div>

      {/* 示例2: 使用自定义渲染函数 */}
      <div style={{ width: '300px', border: '1px solid #ccc' }}>
        <h3>自定义渲染函数</h3>
        <DataListSidebar
          items={entityItems}
          searchText=""
          onSearchChange={() => {}}
          selectedId="vehicle"
          onItemSelect={(item) => console.log('选择:', item)}
          renderMethod={{
            type: 'custom',
            render: ({ item, isSelected }: RenderContext<EntityItem>) => (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: isSelected ? '#e6f7ff' : 'white',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{item.id}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {item.name} - {item.entityType} v{item.version}
                </div>
                <div style={{ marginTop: '4px' }}>
                  {item.bundles?.map((bundle) => (
                    <Tag key={bundle} size="small" color="blue" style={{ marginRight: '4px' }}>
                      {bundle}
                    </Tag>
                  ))}
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* 示例3: 使用 render props (children) */}
      <div style={{ width: '300px', border: '1px solid #ccc' }}>
        <h3>Render Props</h3>
        <DataListSidebar
          items={behaviorItems}
          searchText=""
          onSearchChange={() => {}}
          selectedId="patrol"
          onItemSelect={(item) => console.log('选择:', item)}
          enableDragSort={true}
          onDragSort={(oldIndex, newIndex) => console.log('拖拽:', oldIndex, '->', newIndex)}
          renderMethod={{
            type: 'children',
            children: ({ item, isSelected, index }: RenderContext<BehaviorItem>) => (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: isSelected ? '#f6ffed' : 'white',
                  borderLeft: isSelected ? '3px solid #52c41a' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                {/* 优先级标记 */}
                {typeof item.priority === 'number' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#faad14',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.priority}
                  </div>
                )}

                <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                  {item.id}
                </Text>

                <Text
                  type="secondary"
                  size="small"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  {item.desc}
                </Text>

                {/* 统计信息 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Tag size="small" color="green">
                    节点: {item.nodeCount}
                  </Tag>
                  <Tag size="small" color="blue">
                    连线: {item.edgeCount}
                  </Tag>
                </div>

                {/* 标签 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {item.tags.map((tag) => (
                    <Tag key={tag} size="small" color="purple">
                      {tag}
                    </Tag>
                  ))}
                </div>

                {/* 拖拽指示器 */}
                {typeof index === 'number' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#ccc',
                      fontSize: '12px',
                    }}
                  >
                    #{index + 1}
                  </div>
                )}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

// 类型安全示例
export const TypeSafetyExample: React.FC = () => {
  // 自定义数据结构
  interface CustomItem extends BaseDataItem {
    status: 'active' | 'inactive';
    metadata: {
      created: string;
      updated: string;
    };
  }

  const items: CustomItem[] = [
    {
      id: 'custom1',
      _indexId: 'cust1',
      status: 'active',
      metadata: {
        created: '2024-01-01',
        updated: '2024-01-15',
      },
    },
  ];

  return (
    <DataListSidebar
      items={items}
      searchText=""
      onSearchChange={() => {}}
      selectedId="custom1"
      onItemSelect={(item) => {
        // TypeScript 会正确推断 item 的类型为 CustomItem
        console.log('状态:', item.status);
        console.log('创建时间:', item.metadata.created);
      }}
      renderMethod={{
        type: 'custom',
        render: ({ item }: RenderContext<CustomItem>) => (
          <div style={{ padding: '12px' }}>
            <div>{item.id}</div>
            <div>状态: {item.status}</div>
            <div>创建: {item.metadata.created}</div>
          </div>
        ),
      }}
    />
  );
};
