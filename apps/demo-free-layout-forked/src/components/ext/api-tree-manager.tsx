import React, { useState, useMemo } from 'react';

import { Tree, Typography, Tag, Button, Tooltip } from '@douyinfe/semi-ui';
import { IconFolder, IconDelete } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface ApiTreeManagerProps {
  expressions: Array<{
    id: string;
    name: string;
    type: 'expression' | 'behavior';
    method?: string;
    url?: string;
    group?: string;
    _indexId?: string;
    isGroup?: boolean; // 标记是否为分组记录
  }>;
  selectedExpressionId?: string;
  onExpressionSelect?: (expressionId: string) => void;
  onDeleteExpression?: (expressionId: string) => void;
  onDeleteGroup?: (groupName: string) => void;
  onMoveApiToGroup?: (apiId: string, targetGroupKey: string) => void;
  onReorderApi?: (dragApiId: string, dropApiId: string, dropPosition: number) => void;
}

// 生成API的URL路径
const generateApiUrl = (expressionId: string): string => `/exp/remote/${expressionId}/`;

export const ApiTreeManager: React.FC<ApiTreeManagerProps> = ({
  expressions,
  selectedExpressionId,
  onExpressionSelect,
  onDeleteExpression,
  onDeleteGroup,
  onMoveApiToGroup,
  onReorderApi,
}) => {
  // 拖拽处理函数
  const onDrop = (info: any) => {
    console.log('拖拽操作:', info);
    const { dragNode, node: dropNode, dropPosition } = info;

    // 检查必要的参数是否存在
    if (!dragNode || !dropNode) {
      console.warn('拖拽参数不完整:', { dragNode, dropNode });
      return;
    }

    // 处理API拖拽到分组
    if (dragNode.key && dragNode.key.startsWith('api-')) {
      const dragApiId = dragNode.value;

      // 拖拽到分组节点上
      if (dropNode.key && dropNode.key.startsWith('group-')) {
        const targetGroupKey = dropNode.value;
        console.log('拖拽API到分组:', {
          dragApiId,
          targetGroupKey,
        });

        // 调用回调函数更新API的分组
        onMoveApiToGroup?.(dragApiId, targetGroupKey);
      }
      // 拖拽到其他API节点附近
      else if (dropNode.key && dropNode.key.startsWith('api-')) {
        const dropApiId = dropNode.value;
        console.log('拖拽API重排序:', {
          dragApiId,
          dropApiId,
          dropPosition,
        });

        // 调用回调函数实现API重排序
        onReorderApi?.(dragApiId, dropApiId, dropPosition);
      }
    }
  };
  console.log('🔍 [ApiTreeManager] Props:', {
    expressionsCount: expressions.length,
    selectedExpressionId,
  });

  // 展开的节点 - 根据数据动态设置
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    // 默认展开所有分组
    const groups = expressions.filter((exp) => exp.isGroup);
    const apis = expressions.filter((exp) => exp.type === 'expression' && !exp.isGroup);
    const groupedApis = apis.reduce((acc, api) => {
      const groupKey = api.group || 'remote/user';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(api);
      return acc;
    }, {} as Record<string, typeof apis>);

    // 解析隐含的初始分组
    const implicitGroups = new Set<string>();
    apis.forEach((api) => {
      if (
        api.group &&
        !groups.find((g) => g.group === api.group || `remote/${g.name}` === api.group)
      ) {
        implicitGroups.add(api.group);
      }
    });

    const allGroupKeys = [
      ...groups.map((g) => `group-${g.id}`),
      ...Object.keys(groupedApis).map((k) => `group-${k}`),
      ...Array.from(implicitGroups).map((k) => `group-${k}`),
    ];

    return allGroupKeys;
  });

  // 获取HTTP方法标签颜色
  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'blue';
      case 'POST':
        return 'green';
      case 'PUT':
        return 'orange';
      case 'DELETE':
        return 'red';
      case 'PATCH':
        return 'purple';
      default:
        return 'grey';
    }
  };

  // 🎯 处理API点击，支持Ctrl+点击新窗口打开
  const handleApiClick = (expressionId: string, event: React.MouseEvent) => {
    console.log('🔍 [ApiTreeManager] API点击:', {
      expressionId,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      button: event.button,
    });

    // 检查是否是修饰键点击（Ctrl、Cmd、中键等）
    const isModifiedClick = event.ctrlKey || event.metaKey || event.button === 1;

    if (isModifiedClick) {
      // 修饰键点击：让浏览器处理默认行为（新窗口打开）
      console.log('🔍 [ApiTreeManager] 修饰键点击，允许浏览器默认行为');
      return; // 不阻止默认行为
    }

    // 普通点击：阻止默认行为，使用编程式导航
    event.preventDefault();
    console.log('🔍 [ApiTreeManager] 普通点击，使用编程式导航');
    onExpressionSelect?.(expressionId);
  };

  // 构建树形数据 - 支持动态分组
  const treeData = useMemo(() => {
    // 分离分组和API
    const groups = expressions.filter((exp) => exp.isGroup);
    const apis = expressions.filter((exp) => exp.type === 'expression' && !exp.isGroup);

    // 按group字段分组API，同时解析隐含的初始分组
    const groupedApis = apis.reduce((acc, api) => {
      const groupKey = api.group || 'remote/user';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(api);
      return acc;
    }, {} as Record<string, typeof apis>);

    // 解析隐含的初始分组（从API的group字段中提取）
    const implicitGroups = new Set<string>();
    apis.forEach((api) => {
      if (
        api.group &&
        !groups.find((g) => g.group === api.group || `remote/${g.name}` === api.group)
      ) {
        implicitGroups.add(api.group);
      }
    });

    // 构建树形数据
    const data: any[] = [];

    // 添加用户创建的分组
    groups.forEach((group) => {
      const groupKey = group.group || `remote/${group.name}`;
      const groupApis = groupedApis[groupKey] || [];

      data.push({
        key: `group-${group.id}`,
        value: group.id,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text>{group.name}</Text>
            <Tooltip content="删除分组">
              <Button
                size="small"
                type="danger"
                icon={<IconDelete />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGroup?.(groupKey);
                }}
                style={{ opacity: 0.7 }}
              />
            </Tooltip>
          </div>
        ),
        icon: <IconFolder />, // 分组节点有文件夹图标
        children: groupApis.map((exp) => ({
          key: `api-${exp.id}`,
          value: exp.id,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <a
                href={generateApiUrl(exp.id)}
                onClick={(e) => handleApiClick(exp.id, e)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    console.log('🔍 [ApiTreeManager] 中键点击，允许浏览器默认行为');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {exp.method && (
                  <Tag color={getMethodColor(exp.method)} size="small">
                    {exp.method}
                  </Tag>
                )}
                <Text>{exp.id}</Text>
              </a>
              <Tooltip content="删除API">
                <Button
                  size="small"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteExpression?.(exp.id);
                  }}
                  style={{ opacity: 0.7 }}
                />
              </Tooltip>
            </div>
          ),
        })),
      });

      // 从已分组的API中移除
      delete groupedApis[groupKey];
    });

    // 添加默认分组（未分组的API）
    Object.entries(groupedApis).forEach(([groupKey, groupApis]) => {
      const groupName = groupKey.replace('remote/', '') || 'API列表';

      data.push({
        key: `group-${groupKey}`,
        value: groupKey,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text>{groupName}</Text>
            <Tooltip content="删除分组">
              <Button
                size="small"
                type="danger"
                icon={<IconDelete />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGroup?.(groupKey);
                }}
                style={{ opacity: 0.7 }}
              />
            </Tooltip>
          </div>
        ),
        icon: <IconFolder />, // 所有分组都有文件夹图标
        children: groupApis.map((exp) => ({
          key: `api-${exp.id}`,
          value: exp.id,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <a
                href={generateApiUrl(exp.id)}
                onClick={(e) => handleApiClick(exp.id, e)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    console.log('🔍 [ApiTreeManager] 中键点击，允许浏览器默认行为');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {exp.method && (
                  <Tag color={getMethodColor(exp.method)} size="small">
                    {exp.method}
                  </Tag>
                )}
                <Text>{exp.id}</Text>
              </a>
              <Tooltip content="删除API">
                <Button
                  size="small"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteExpression?.(exp.id);
                  }}
                  style={{ opacity: 0.7 }}
                />
              </Tooltip>
            </div>
          ),
        })),
      });
    });

    console.log('🔍 [ApiTreeManager] 树形数据:', data);
    return data;
  }, [
    expressions,
    onExpressionSelect,
    onDeleteExpression,
    onDeleteGroup,
    onMoveApiToGroup,
    onReorderApi,
  ]);

  // 🎯 禁用Tree的onChange，因为我们现在使用链接处理导航
  const handleChange = (value: any) => {
    // 不再处理Tree的onChange事件，因为我们使用链接导航
    console.log('🔍 [Tree] onChange被禁用，使用链接导航');
  };

  // 处理展开
  const handleExpand = (expandedKeys: string[]) => {
    console.log('🔍 [Tree] 展开节点:', expandedKeys);
    setExpandedKeys(expandedKeys);
  };

  console.log('🔍 [Tree] 当前选中值:', selectedExpressionId);

  return (
    <Tree
      treeData={treeData}
      value={selectedExpressionId}
      expandedKeys={expandedKeys}
      onChange={handleChange} // 保留但不使用
      onExpand={handleExpand}
      expandAction="click"
      blockNode
      showLine
      labelEllipsis
      draggable
      onDrop={onDrop}
      style={{ height: '100%' }}
    />
  );
};
