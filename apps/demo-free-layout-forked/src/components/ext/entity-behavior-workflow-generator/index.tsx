import React, { useEffect, useState } from 'react';

import { Button, Card, Space, Typography, Tag, Divider, Spin } from '@douyinfe/semi-ui';
import { IconPlay, IconRefresh, IconTreeTriangleDown } from '@douyinfe/semi-icons';

import { useBehaviorStore } from '../../../stores';
import { useEntityStore } from '../../../stores';

const { Title, Text, Paragraph } = Typography;

interface EntityBehaviorMatch {
  entity: any;
  behaviors: any[];
  matchType: 'exact' | 'partial' | 'related';
}

interface EntityBehaviorWorkflowGeneratorProps {
  selectedEntityId?: string;
  onGenerateWorkflow?: (matches: EntityBehaviorMatch[]) => void;
}

export const EntityBehaviorWorkflowGenerator: React.FC<EntityBehaviorWorkflowGeneratorProps> = ({
  selectedEntityId,
  onGenerateWorkflow,
}) => {
  const { behaviors, loading: behaviorsLoading } = useBehaviorStore();
  const { entities, loading: entitiesLoading } = useEntityStore();
  const [matches, setMatches] = useState<EntityBehaviorMatch[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // 实体行为匹配算法
  const findEntityBehaviorMatches = (entityId: string): EntityBehaviorMatch[] => {
    const entity = entities.find((e) => e._indexId === entityId);
    if (!entity) return [];

    const entityName = entity.name?.toLowerCase() || '';
    const entityRealId = entity.id?.toLowerCase() || ''; // 使用真实的实体ID
    const entityId_lower = entityId.toLowerCase();

    console.log(`[EntityBehaviorMatcher] 分析实体: ${entity.id} (${entity.name})`);
    console.log(`[EntityBehaviorMatcher] 可用行为总数: ${behaviors.length}`);

    const matches: EntityBehaviorMatch[] = [];

    // 1. 精确匹配：类名包含实体名称
    const exactMatches = behaviors.filter((behavior) => {
      const className = behavior.className?.toLowerCase() || '';
      const fullClassName = behavior.fullClassName?.toLowerCase() || '';

      return (
        className.includes(entityRealId) ||
        fullClassName.includes(entityRealId) ||
        className.includes(entityName) ||
        fullClassName.includes(entityName)
      );
    });

    if (exactMatches.length > 0) {
      matches.push({
        entity,
        behaviors: exactMatches,
        matchType: 'exact',
      });
    }

    // 2. 部分匹配：方法名或描述包含实体相关词汇
    const partialMatches = behaviors.filter((behavior) => {
      if (exactMatches.includes(behavior)) return false; // 避免重复

      const methodName = behavior.methodName?.toLowerCase() || '';
      const description = behavior.description?.toLowerCase() || '';
      const name = behavior.name?.toLowerCase() || '';

      return (
        methodName.includes(entityRealId) ||
        methodName.includes(entityName) ||
        description.includes(entityRealId) ||
        description.includes(entityName) ||
        name.includes(entityRealId) ||
        name.includes(entityName)
      );
    });

    if (partialMatches.length > 0) {
      matches.push({
        entity,
        behaviors: partialMatches,
        matchType: 'partial',
      });
    }

    // 3. 相关匹配：基于实体类别的通用行为
    const relatedMatches = behaviors.filter((behavior) => {
      if (exactMatches.includes(behavior) || partialMatches.includes(behavior)) return false;

      const category = behavior.category?.toLowerCase() || '';
      return category === 'entity'; // 默认匹配entity类别的行为
    });

    if (relatedMatches.length > 0) {
      matches.push({
        entity,
        behaviors: relatedMatches.slice(0, 10), // 限制相关匹配数量
        matchType: 'related',
      });
    }

    console.log(`[EntityBehaviorMatcher] 匹配结果:`, {
      exact: exactMatches.length,
      partial: partialMatches.length,
      related: relatedMatches.length,
    });

    return matches;
  };

  // 分析当前选中的实体
  const analyzeCurrentEntity = async () => {
    if (!selectedEntityId || behaviors.length === 0 || entities.length === 0) return;

    setAnalyzing(true);
    try {
      // 模拟异步分析过程
      await new Promise((resolve) => setTimeout(resolve, 500));

      const entityMatches = findEntityBehaviorMatches(selectedEntityId);
      setMatches(entityMatches);

      console.log(
        `[EntityBehaviorWorkflowGenerator] 为实体 ${selectedEntityId} 找到 ${entityMatches.length} 组匹配`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // 生成工作流
  const generateWorkflow = () => {
    if (matches.length === 0) return;

    console.log('[EntityBehaviorWorkflowGenerator] 生成工作流:', matches);
    onGenerateWorkflow?.(matches);
  };

  // 当实体或数据变化时自动分析
  useEffect(() => {
    analyzeCurrentEntity();
  }, [selectedEntityId, behaviors.length, entities.length]);

  const loading = behaviorsLoading || entitiesLoading || analyzing;
  const totalBehaviors = matches.reduce((sum, match) => sum + match.behaviors.length, 0);

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact':
        return 'green';
      case 'partial':
        return 'blue';
      case 'related':
        return 'grey';
      default:
        return 'grey';
    }
  };

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'exact':
        return '精确匹配';
      case 'partial':
        return '部分匹配';
      case 'related':
        return '相关匹配';
      default:
        return '未知';
    }
  };

  return (
    <Card
      title="实体行为工作流生成器"
      style={{ margin: '16px 0' }}
      headerExtraContent={
        <Space>
          <Button
            icon={<IconRefresh />}
            onClick={analyzeCurrentEntity}
            loading={analyzing}
            size="small"
          >
            重新分析
          </Button>
          <Button
            type="primary"
            icon={<IconPlay />}
            onClick={generateWorkflow}
            disabled={matches.length === 0}
            size="small"
          >
            生成工作流
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">正在分析实体行为关系...</Text>
          </div>
        </div>
      ) : (
        <div>
          {selectedEntityId ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>当前实体: </Text>
                <Tag color="blue" size="large">
                  {selectedEntityId}
                </Tag>
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  找到 {totalBehaviors} 个相关行为
                </Text>
              </div>

              {matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">未找到与该实体相关的行为函数</Text>
                </div>
              ) : (
                <div>
                  {matches.map((match, index) => (
                    <div key={index} style={{ marginBottom: '24px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <Tag color={getMatchTypeColor(match.matchType)} size="large">
                          {getMatchTypeText(match.matchType)}
                        </Tag>
                        <Text style={{ marginLeft: '8px' }}>{match.behaviors.length} 个行为</Text>
                      </div>

                      <div
                        style={{
                          background: '#fafafa',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #e6e6e6',
                        }}
                      >
                        {match.behaviors.map((behavior, behaviorIndex) => (
                          <div
                            key={behaviorIndex}
                            style={{
                              marginBottom:
                                behaviorIndex < match.behaviors.length - 1 ? '8px' : '0',
                              padding: '8px',
                              background: 'white',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Tag color="orange" size="small">
                                {behavior.className}
                              </Tag>
                              <Text strong>{behavior.methodName}</Text>
                              {behavior.parameters?.length > 0 && (
                                <Text type="secondary" size="small">
                                  ({behavior.parameters.length} 参数)
                                </Text>
                              )}
                            </div>
                            {behavior.description && (
                              <Text
                                type="secondary"
                                size="small"
                                style={{ display: 'block', marginTop: '4px' }}
                              >
                                {behavior.description}
                              </Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">请先选择一个实体</Text>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default EntityBehaviorWorkflowGenerator;
