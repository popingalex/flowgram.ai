import React, { useState, useMemo, useCallback } from 'react';

import { nanoid } from 'nanoid';
import { Layout, Tree, Typography, Space, Radio, Spin, Divider } from '@douyinfe/semi-ui';

import { useModuleStore } from '../../stores/module-list';
import { useEntityList } from '../../stores';
import { systemApi } from '../../services/api-service';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Group: RadioGroup } = Radio;

// ECharts 动态加载 - 简化版本
const loadECharts = async () => {
  try {
    const ReactECharts = await import('echarts-for-react');
    return ReactECharts.default;
  } catch (error) {
    console.error('ECharts 加载失败:', error);
    return null;
  }
};

// 图数据接口
interface GraphNode {
  id: string;
  name: string;
  category: string;
  symbolSize: number;
  value: number;
  visible: boolean;
  highlighted: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  visible: boolean;
  highlighted: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: Array<{ name: string; itemStyle: { color: string } }>;
}

// 系统数据接口
interface SystemData {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  participants?: any[];
}

export const ComponentRelationshipGraph: React.FC = () => {
  const { entities } = useEntityList();
  const moduleStore = useModuleStore();

  // 系统数据状态
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);

  // 节点和分类状态
  const [nodeStates, setNodeStates] = useState<
    Record<string, 'visible' | 'hidden' | 'highlighted'>
  >({});
  const [categoryStates, setCategoryStates] = useState<
    Record<string, 'visible' | 'hidden' | 'highlighted'>
  >({
    实体: 'visible',
    模块: 'visible',
    系统: 'visible',
  });
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['实体', '模块', '系统']);

  // ECharts 组件状态 - 简化版本
  const [ECharts, setECharts] = useState<any>(null);

  // 加载 ECharts - 简化版本
  React.useEffect(() => {
    loadECharts()
      .then((component) => {
        if (component) {
          setECharts(() => component);
        }
      })
      .catch(console.error);
  }, []);

  // 加载系统数据
  React.useEffect(() => {
    const loadSystems = async () => {
      try {
        setSystemsLoading(true);

        // 从API获取原始系统数据
        const systemsData = await systemApi.getAll();
        console.log('🔍 [ComponentGraph] 加载系统数据:', systemsData);
        setSystems(systemsData);
      } catch (error) {
        console.error('❌ 加载系统数据失败:', error);
        setSystems([]);
      } finally {
        setSystemsLoading(false);
      }
    };

    loadSystems();
  }, []);

  // 生成图数据
  const graphData = useMemo((): GraphData => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const categories = [
      { name: '实体', itemStyle: { color: '#5470c6' } },
      { name: '模块', itemStyle: { color: '#91cc75' } },
      { name: '系统', itemStyle: { color: '#fac858' } },
    ];

    console.log('🔍 [ComponentGraph] 开始生成图数据');
    console.log('🔍 [ComponentGraph] 实体数据:', entities?.length || 0);
    console.log('🔍 [ComponentGraph] 模块数据:', moduleStore.modules?.length || 0);
    console.log('🔍 [ComponentGraph] 系统数据:', systems?.length || 0);

    // 添加实体节点
    if (entities && Array.isArray(entities)) {
      entities.forEach((entity: any) => {
        const nodeId = `entity_${entity._indexId}`;
        const categoryVisible = categoryStates['实体'] !== 'hidden';
        const nodeVisible = nodeStates[nodeId] !== 'hidden';

        nodes.push({
          id: nodeId,
          name: entity.name || entity.id,
          category: '实体',
          symbolSize: 50,
          value: 1, // 实体节点基础值
          visible: categoryVisible && nodeVisible,
          highlighted:
            nodeStates[nodeId] === 'highlighted' || categoryStates['实体'] === 'highlighted',
        });

        // 添加实体与模块的关系边
        if (entity.bundles && Array.isArray(entity.bundles)) {
          entity.bundles.forEach((bundleId: string) => {
            // 查找对应的模块节点 - 使用 _indexId 或 id 匹配
            const targetModule = moduleStore.modules?.find(
              (m) => m._indexId === bundleId || m.id === bundleId
            );

            if (targetModule) {
              const targetId = `module_${targetModule._indexId}`;
              const edgeKey = `${nodeId}_${bundleId}`;
              edges.push({
                source: nodeId,
                target: targetId,
                visible: true, // 边默认总是可见，不在树形控制中管理
                highlighted: false, // 边不单独高亮，只响应节点高亮
              });
            }
          });
        }
      });
    }

    // 添加模块节点
    if (moduleStore.modules && Array.isArray(moduleStore.modules)) {
      moduleStore.modules.forEach((module: any) => {
        const nodeId = `module_${module._indexId}`;
        const categoryVisible = categoryStates['模块'] !== 'hidden';
        const nodeVisible = nodeStates[nodeId] !== 'hidden';

        nodes.push({
          id: nodeId,
          name: module.name || module.id,
          category: '模块',
          symbolSize: 40,
          value: module.attributes?.length || 0,
          visible: categoryVisible && nodeVisible,
          highlighted:
            nodeStates[nodeId] === 'highlighted' || categoryStates['模块'] === 'highlighted',
        });
      });
    }

    // 添加系统节点 - 使用真实数据
    if (systems && Array.isArray(systems)) {
      systems.forEach((system: SystemData) => {
        const nodeId = `system_${system.id}`;
        const categoryVisible = categoryStates['系统'] !== 'hidden';
        const nodeVisible = nodeStates[nodeId] !== 'hidden';

        nodes.push({
          id: nodeId,
          name: system.name,
          category: '系统',
          symbolSize: 60,
          value: 10,
          visible: categoryVisible && nodeVisible,
          highlighted:
            nodeStates[nodeId] === 'highlighted' || categoryStates['系统'] === 'highlighted',
        });

        // 添加系统与模块的关系边 (基于系统的participants字段)
        console.log(`🔍 [ComponentGraph] 处理系统: ${system.name} (ID: ${system.id})`);
        console.log(`🔍 [ComponentGraph] 系统participants:`, system.participants);

        if (system.participants && Array.isArray(system.participants)) {
          // 实体集合到模块组件的映射
          const entitySetToComponentsMap: Record<string, string[]> = {
            agents: ['agent_component', 'position_component'],
            fire_targets: ['burning_component', 'flammable_component', 'position_component'],
            refill_stations: ['refill_station_component', 'position_component'],
            moving_entities: ['position_component', 'target_component'],
            flammable_entities: ['flammable_component', 'position_component'],
            burning_entities: ['flammable_component', 'burning_component', 'position_component'],
            wind_entities: ['wind_component'],
            pressure_vessels: ['pressure_vessel_component', 'position_component'],
            active_agents: [
              'agent_component',
              'inventory_component',
              'emitter_component',
              'position_component',
            ],
            interaction_targets: [
              'flammable_component',
              'material_component',
              'position_component',
            ],
            consuming_agents: ['agent_component', 'inventory_component', 'emitter_component'],
            refilling_agents: ['agent_component', 'inventory_component', 'position_component'],
          };

          // 从participants中提取实体集合ID，然后映射到组件
          const componentIds: string[] = [];
          system.participants.forEach((participant: any) => {
            const entitySetId = participant.id || participant;
            if (entitySetToComponentsMap[entitySetId]) {
              componentIds.push(...entitySetToComponentsMap[entitySetId]);
            }
          });

          // 去重
          const uniqueComponentIds = [...new Set(componentIds)];
          console.log(`🔍 [ComponentGraph] 系统 ${system.name} 包含组件:`, uniqueComponentIds);

          if (moduleStore.modules && Array.isArray(moduleStore.modules)) {
            console.log(`🔍 [ComponentGraph] 检查 ${moduleStore.modules.length} 个模块`);
            moduleStore.modules.forEach((module: any) => {
              console.log(
                `🔍 [ComponentGraph] 检查模块: ${module.name || module.id} (ID: ${module.id})`
              );

              // 比较模块ID与映射得到的组件ID
              const hasMatchingComponent = uniqueComponentIds.includes(module.id);

              if (hasMatchingComponent) {
                const targetId = `module_${module._indexId}`;
                console.log(
                  `🔗 [ComponentGraph] 建立连接: ${system.name} -> ${module.name || module.id}`
                );
                edges.push({
                  source: nodeId,
                  target: targetId,
                  visible: true,
                  highlighted: false,
                });
              }
            });
          }
        } else {
          console.log(
            `⚠️ [ComponentGraph] 系统 ${system.name} (ID: ${system.id}) 没有participants数据`
          );
        }
      });
    }

    // 如果没有真实数据，添加一些测试数据以确保组件可以正常显示
    if (nodes.length === 0) {
      // 添加测试节点
      nodes.push(
        {
          id: 'test_entity_1',
          name: '测试实体1',
          category: '实体',
          symbolSize: 50,
          value: 5,
          visible: true,
          highlighted: false,
        },
        {
          id: 'test_module_1',
          name: '测试模块1',
          category: '模块',
          symbolSize: 40,
          value: 3,
          visible: true,
          highlighted: false,
        }
      );

      // 添加测试边
      edges.push({
        source: 'test_entity_1',
        target: 'test_module_1',
        visible: true,
        highlighted: false,
      });
    }

    console.log('✅ [ComponentGraph] 图数据生成完成:', {
      节点数: nodes.length,
      边数: edges.length,
      实体节点: nodes.filter((n) => n.category === '实体').length,
      模块节点: nodes.filter((n) => n.category === '模块').length,
      系统节点: nodes.filter((n) => n.category === '系统').length,
    });

    return { nodes, edges, categories };
  }, [entities, moduleStore.modules, systems, nodeStates, categoryStates]);

  // 节点控制函数
  const handleNodeStateChange = useCallback(
    (nodeId: string, newState: 'visible' | 'hidden' | 'highlighted') => {
      setNodeStates((prev) => ({
        ...prev,
        [nodeId]: newState,
      }));
    },
    []
  );

  // 分类控制函数
  const handleCategoryStateChange = useCallback(
    (category: string, newState: 'visible' | 'hidden' | 'highlighted') => {
      setCategoryStates((prev) => ({
        ...prev,
        [category]: newState,
      }));
    },
    []
  );

  // 生成树数据
  const treeData = useMemo(() => {
    // 按分类分组节点
    const nodesByCategory = graphData.nodes.reduce((acc, node) => {
      if (!acc[node.category]) acc[node.category] = [];
      acc[node.category].push(node);
      return acc;
    }, {} as Record<string, GraphNode[]>);

    // 生成分类作为一级节点
    const categories = ['实体', '模块', '系统'];
    const finalTreeData = categories.map((category) => {
      const nodes = nodesByCategory[category] || [];

      return {
        key: category,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingRight: '8px',
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {category} ({nodes.length})
            </span>
            <RadioGroup
              type="button"
              buttonSize="small"
              value={categoryStates[category] || 'visible'}
              onChange={(e) =>
                handleCategoryStateChange(
                  category,
                  e.target.value as 'visible' | 'hidden' | 'highlighted'
                )
              }
              style={{ marginLeft: '8px' }}
            >
              <Radio value="visible">显示</Radio>
              <Radio value="hidden">隐藏</Radio>
              <Radio value="highlighted">高亮</Radio>
            </RadioGroup>
          </div>
        ),
        children: nodes.map((node) => ({
          key: `node_${node.id}`,
          label: (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingRight: '8px',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </span>
              <RadioGroup
                type="button"
                buttonSize="small"
                value={nodeStates[node.id] || 'visible'}
                onChange={(e) =>
                  handleNodeStateChange(
                    node.id,
                    e.target.value as 'visible' | 'hidden' | 'highlighted'
                  )
                }
                style={{ marginLeft: '8px' }}
              >
                <Radio value="visible">显示</Radio>
                <Radio value="hidden">隐藏</Radio>
                <Radio value="highlighted">高亮</Radio>
              </RadioGroup>
            </div>
          ),
          isLeaf: true,
        })),
      };
    });

    return finalTreeData;
  }, [graphData, nodeStates, categoryStates, handleNodeStateChange, handleCategoryStateChange]);

  // ECharts 配置
  const echartsOption = useMemo(() => {
    const visibleNodes = graphData.nodes.filter((node) => node.visible);
    const visibleEdges = graphData.edges.filter((edge) => edge.visible);

    // 获取所有高亮的节点
    const highlightedNodes = visibleNodes.filter((node) => node.highlighted);

    // 如果有高亮节点，计算相邻关系
    let adjacentNodeIds = new Set<string>();
    let adjacentEdgeKeys = new Set<string>();

    if (highlightedNodes.length > 0) {
      highlightedNodes.forEach((highlightedNode) => {
        // 添加高亮节点自身
        adjacentNodeIds.add(highlightedNode.id);

        // 查找与高亮节点直接相连的边和节点
        visibleEdges.forEach((edge) => {
          if (edge.source === highlightedNode.id) {
            adjacentNodeIds.add(edge.target);
            adjacentEdgeKeys.add(`${edge.source}_${edge.target}`);
          } else if (edge.target === highlightedNode.id) {
            adjacentNodeIds.add(edge.source);
            adjacentEdgeKeys.add(`${edge.source}_${edge.target}`);
          }
        });
      });
    }

    return {
      title: {
        text: '组件关系图',
        subtext: '实体、模块、系统之间的关系',
        top: 'top',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `${params.data.name}<br/>类型: ${params.data.category}<br/>属性数量: ${params.data.value}`;
          } else if (params.dataType === 'edge') {
            return `${params.data.source} → ${params.data.target}`;
          }
          return '';
        },
      },
      legend: {
        data: graphData.categories.map((cat) => cat.name),
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '组件关系',
          type: 'graph',
          layout: 'force',
          data: visibleNodes.map((node) => {
            const isHighlighted = node.highlighted;
            const isAdjacent = adjacentNodeIds.has(node.id);
            const hasHighlightedNodes = highlightedNodes.length > 0;

            // 如果有高亮节点但当前节点不相邻，则半透明显示
            const opacity = hasHighlightedNodes && !isAdjacent ? 0.3 : 1;

            return {
              ...node,
              itemStyle: {
                color: isHighlighted ? '#ff4d4f' : undefined,
                borderColor: isHighlighted ? '#ff4d4f' : '#fff',
                borderWidth: isHighlighted ? 3 : 1,
                opacity: opacity,
              },
            };
          }),
          links: visibleEdges.map((edge, index) => {
            const edgeKey = `${edge.source}_${edge.target}`;
            const isAdjacentEdge = adjacentEdgeKeys.has(edgeKey);
            const hasHighlightedNodes = highlightedNodes.length > 0;

            // 如果有高亮节点但当前边不相邻，则半透明显示
            const opacity = hasHighlightedNodes && !isAdjacentEdge ? 0.3 : 1;

            return {
              ...edge,
              label: {
                show: true, // 显示关系标签
                formatter: '包含', // 关系标签内容
              },
              lineStyle: {
                color: edge.highlighted ? '#ff4d4f' : '#aaa',
                width: edge.highlighted ? 3 : 1,
                curveness: 0, // 设置为0表示直线
                type: 'solid', // 实线
                opacity: opacity,
              },
            };
          }),
          categories: graphData.categories,
          roam: true,
          focusNodeAdjacency: true,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
          },
          lineStyle: {
            color: 'source',
            curveness: 0, // 全局设置为直线
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 10,
            },
          },
          force: {
            repulsion: 2000,
            gravity: 0.2,
            edgeLength: [50, 200],
            layoutAnimation: true,
          },
        },
      ],
    };
  }, [graphData]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        style={{
          backgroundColor: 'var(--semi-color-bg-1)',
          borderRight: '1px solid var(--semi-color-border)',
          width: '360px',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
          <Title heading={5} style={{ margin: '0 0 16px 0' }}>
            节点控制
          </Title>

          <Divider margin={16} />

          <Tree
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            style={{ fontSize: '12px' }}
          />

          <Divider margin={16} />

          <Space vertical spacing={8}>
            <Space>
              <Text type="secondary" size="small">
                节点: {graphData.nodes.filter((n) => n.visible).length}/{graphData.nodes.length}
              </Text>
            </Space>
            <Space>
              <Text type="secondary" size="small">
                高亮: {graphData.nodes.filter((n) => n.highlighted).length}
              </Text>
            </Space>
          </Space>
        </div>
      </Sider>

      <Content style={{ padding: '16px', flex: 1 }}>
        {systemsLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '400px',
            }}
          >
            <Spin size="large" />
            <Text type="secondary" style={{ marginTop: '16px' }}>
              正在加载数据...
            </Text>
          </div>
        ) : ECharts ? (
          <ECharts
            option={echartsOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '400px',
            }}
          >
            <Title heading={4} style={{ color: '#999' }}>
              📊 组件关系图
            </Title>
            <Text type="secondary">ECharts 正在加载中...</Text>
            <Text type="tertiary" style={{ fontSize: '12px', marginTop: '16px' }}>
              节点: {graphData.nodes.length} | 连线: {graphData.edges.length}
            </Text>
          </div>
        )}
      </Content>
    </Layout>
  );
};
