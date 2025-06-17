import React from 'react';

import { Select, Form, Space, Tag } from '@douyinfe/semi-ui';

import { useEntityList, useCurrentEntity, useCurrentEntityActions, useGraphList } from '../stores';

export const EntitySelector: React.FC = () => {
  const { entities, loading } = useEntityList();
  const { selectedEntityId } = useCurrentEntity();
  const { selectEntity } = useCurrentEntityActions();
  const { graphs } = useGraphList();

  const handleEntityChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    const entityId = typeof value === 'string' ? value : null;
    if (entityId) {
      const entity = entities.find((e) => e._indexId === entityId);
      if (entity) {
        selectEntity(entity);
      }
    } else {
      selectEntity(null);
    }
  };

  // 计算实体统计信息
  const getEntityStats = (entity: any) => {
    // 计算属性数量（去掉模块属性）
    const attributeCount = entity.attributes?.length || 0;

    // 计算模块数量
    const moduleCount = entity.bundles?.length || 0;

    // 查找对应的工作流图 - 使用原始业务ID
    const businessId = (entity as any).$id || entity.id;
    const entityGraph = graphs.find(
      (graph: any) => graph.id === businessId || graph.id.toLowerCase() === businessId.toLowerCase()
    );
    const workflowNodeCount = entityGraph?.nodes?.length || 0;

    return { attributeCount, moduleCount, workflowNodeCount };
  };

  return (
    <Space align="center">
      <Form.Label>当前实体:</Form.Label>
      <Select
        placeholder="选择实体"
        style={{ width: 320 }}
        value={selectedEntityId || undefined}
        onChange={handleEntityChange}
        loading={loading}
        showClear
        renderSelectedItem={(option: any) => {
          const entity = entities.find((e) => e._indexId === option.value);
          const businessId = (entity as any)?.$id || entity?.id;
          return entity ? `${entity.name} (${businessId})` : option.label;
        }}
      >
        {entities.map((entity) => {
          const stats = getEntityStats(entity);
          return (
            <Select.Option key={entity._indexId} value={entity._indexId} showTick={false}>
              <div style={{ padding: '6px 0', lineHeight: '1.4', width: '100%' }}>
                {/* 第一行：ID 和 名称 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span>{(entity as any).$id || entity.id}</span>
                  <span>{entity.name}</span>
                </div>
                {/* 第二行：属性模块数量 和 工作流节点数量 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Tag size="small" color="blue">
                      {stats.attributeCount}属性
                    </Tag>
                    <Tag size="small" color="green">
                      {stats.moduleCount}模块
                    </Tag>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {stats.workflowNodeCount > 0 && (
                      <Tag size="small" color="orange">
                        {stats.workflowNodeCount}节点
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </Select.Option>
          );
        })}
      </Select>
    </Space>
  );
};
