// 测试新的抽象框架

import React, { useEffect } from 'react';

import { Button, Card, Space, Typography } from '@douyinfe/semi-ui';

import { IndexedInput, useIndexedFieldUpdate } from '../base/indexed-input';
import { useModuleListStore, ModuleListStoreExtensions } from '../../stores/module-list-new';
import { useEntityListStore, EntityListStoreExtensions } from '../../stores/entity-list-new';

const { Title, Text } = Typography;

export const IndexedStoreTest: React.FC = () => {
  // 使用新的抽象Store
  const entityStore = useEntityListStore();
  const moduleStore = useModuleListStore();

  // 加载数据
  useEffect(() => {
    console.log('🔄 加载测试数据...');
    entityStore.loadItems();
    moduleStore.loadItems();
  }, []);

  // 实体字段更新逻辑
  const entityFieldUpdate = useIndexedFieldUpdate({
    item: entityStore.items[0], // 测试第一个实体
    onFieldUpdate: entityStore.updateItemField,
    getIndexId: EntityListStoreExtensions.getEntityIndexId,
  });

  // 模块字段更新逻辑
  const moduleFieldUpdate = useIndexedFieldUpdate({
    item: moduleStore.items[0], // 测试第一个模块
    onFieldUpdate: moduleStore.updateItemField,
    getIndexId: ModuleListStoreExtensions.getModuleIndexId,
  });

  return (
    <div style={{ padding: '20px' }}>
      <Title heading={2}>抽象框架测试页面</Title>

      <Space vertical style={{ width: '100%' }} spacing={20}>
        {/* 实体测试区域 */}
        <Card title="实体Store测试" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <div>
              <Text strong>加载状态: </Text>
              <Text>{entityStore.loading ? '加载中...' : '已加载'}</Text>
            </div>

            <div>
              <Text strong>实体数量: </Text>
              <Text>{entityStore.items.length}</Text>
            </div>

            {entityStore.error && (
              <div>
                <Text strong type="danger">
                  错误:{' '}
                </Text>
                <Text type="danger">{entityStore.error}</Text>
              </div>
            )}

            <Space>
              <Button onClick={() => EntityListStoreExtensions.addNewEntity()} type="primary">
                添加新实体
              </Button>

              <Button onClick={() => entityStore.loadItems()} loading={entityStore.loading}>
                重新加载
              </Button>
            </Space>

            {/* 显示第一个实体的编辑测试 */}
            {entityStore.items[0] && (
              <Card title="实体编辑测试">
                <Space vertical style={{ width: '100%' }}>
                  <div>
                    <Text strong>ID: </Text>
                    <IndexedInput
                      value={entityStore.items[0].id}
                      onChange={entityFieldUpdate.createFieldUpdater('id')}
                      placeholder="实体ID"
                      stableKey={entityFieldUpdate.createInputKey('id')}
                    />
                  </div>

                  <div>
                    <Text strong>名称: </Text>
                    <IndexedInput
                      value={entityStore.items[0].name}
                      onChange={entityFieldUpdate.createFieldUpdater('name')}
                      placeholder="实体名称"
                      stableKey={entityFieldUpdate.createInputKey('name')}
                    />
                  </div>

                  <div>
                    <Text strong>状态: </Text>
                    <Text type={entityStore.items[0]._status === 'dirty' ? 'warning' : 'success'}>
                      {entityStore.items[0]._status || 'saved'}
                    </Text>
                  </div>

                  <Space>
                    <Button
                      onClick={() => entityStore.saveItem(entityStore.items[0])}
                      type="primary"
                      size="small"
                      disabled={entityStore.items[0]._status === 'saved'}
                    >
                      保存
                    </Button>

                    <Button
                      onClick={() => entityStore.resetItemChanges(entityStore.items[0]._indexId)}
                      size="small"
                      disabled={entityStore.items[0]._status === 'saved'}
                    >
                      撤销
                    </Button>
                  </Space>
                </Space>
              </Card>
            )}
          </Space>
        </Card>

        {/* 模块测试区域 */}
        <Card title="模块Store测试" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <div>
              <Text strong>加载状态: </Text>
              <Text>{moduleStore.loading ? '加载中...' : '已加载'}</Text>
            </div>

            <div>
              <Text strong>模块数量: </Text>
              <Text>{moduleStore.items.length}</Text>
            </div>

            {moduleStore.error && (
              <div>
                <Text strong type="danger">
                  错误:{' '}
                </Text>
                <Text type="danger">{moduleStore.error}</Text>
              </div>
            )}

            <Space>
              <Button onClick={() => ModuleListStoreExtensions.addNewModule()} type="primary">
                添加新模块
              </Button>

              <Button onClick={() => moduleStore.loadItems()} loading={moduleStore.loading}>
                重新加载
              </Button>
            </Space>

            {/* 显示第一个模块的编辑测试 */}
            {moduleStore.items[0] && (
              <Card title="模块编辑测试">
                <Space vertical style={{ width: '100%' }}>
                  <div>
                    <Text strong>ID: </Text>
                    <IndexedInput
                      value={moduleStore.items[0].id}
                      onChange={moduleFieldUpdate.createFieldUpdater('id')}
                      placeholder="模块ID"
                      stableKey={moduleFieldUpdate.createInputKey('id')}
                    />
                  </div>

                  <div>
                    <Text strong>名称: </Text>
                    <IndexedInput
                      value={moduleStore.items[0].name}
                      onChange={moduleFieldUpdate.createFieldUpdater('name')}
                      placeholder="模块名称"
                      stableKey={moduleFieldUpdate.createInputKey('name')}
                    />
                  </div>

                  <div>
                    <Text strong>状态: </Text>
                    <Text type={moduleStore.items[0]._status === 'dirty' ? 'warning' : 'success'}>
                      {moduleStore.items[0]._status || 'saved'}
                    </Text>
                  </div>

                  <Space>
                    <Button
                      onClick={() => moduleStore.saveItem(moduleStore.items[0])}
                      type="primary"
                      size="small"
                      disabled={moduleStore.items[0]._status === 'saved'}
                    >
                      保存
                    </Button>

                    <Button
                      onClick={() => moduleStore.resetItemChanges(moduleStore.items[0]._indexId)}
                      size="small"
                      disabled={moduleStore.items[0]._status === 'saved'}
                    >
                      撤销
                    </Button>
                  </Space>
                </Space>
              </Card>
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};
