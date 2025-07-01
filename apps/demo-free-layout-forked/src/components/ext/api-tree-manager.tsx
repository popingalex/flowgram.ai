import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { Tree, Typography, Tag, Button, Tooltip, Input } from '@douyinfe/semi-ui';
import { IconFolder, IconDelete, IconSearch, IconPlus } from '@douyinfe/semi-icons';

import { useEndpointProbeStore, getStatusColor, getStatusText } from '../../stores/endpoint-probe';

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

// 创建分组节点的label
const createGroupLabel = (
  groupName: string,
  onDeleteGroup: (groupKey: string) => void,
  groupKey: string
) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minWidth: 0, // 允许flex子元素收缩
    }}
  >
    <div
      style={{
        flex: 1,
        minWidth: 0, // 允许文本容器收缩
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      <Text
        style={{
          display: 'block',
          overflow: 'inherit',
          textOverflow: 'inherit',
          whiteSpace: 'inherit',
        }}
      >
        {groupName}
      </Text>
    </div>
    <div
      style={{
        flexShrink: 0, // 防止按钮被压缩
        width: '32px', // 固定按钮区域宽度
        display: 'flex',
        justifyContent: 'flex-end',
        marginLeft: '8px',
      }}
    >
      <Tooltip content="删除分组">
        <Button
          size="small"
          type="danger"
          icon={<IconDelete />}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteGroup(groupKey);
          }}
          style={{
            padding: '2px',
            width: '20px',
            height: '20px',
            flexShrink: 0,
            opacity: 0.7,
          }}
        />
      </Tooltip>
    </div>
  </div>
);

// 创建API节点的label
const createApiLabel = (
  exp: any,
  handleApiClick: (expressionId: string, event: React.MouseEvent) => void,
  getMethodColor: (method: string) => 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'grey',
  onDeleteExpression: (expressionId: string) => void,
  endpointProbe: any
) => {
  // 获取端点状态
  const getEndpointStatus = () => {
    if (!exp.url) return null;

    try {
      const url = new URL(exp.url);
      const endpoint = `${url.hostname}:${url.port || (url.protocol === 'https:' ? 443 : 80)}`;
      return endpointProbe.getEndpointStatus(endpoint);
    } catch {
      return null;
    }
  };

  const endpointStatus = getEndpointStatus();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
        padding: '4px 0',
      }}
    >
      {/* 左侧：Method tag，不设固定宽度 */}
      {exp.method && (
        <Tag
          color={getMethodColor(exp.method)}
          size="small"
          style={{
            flexShrink: 0,
            textAlign: 'center',
            fontSize: '10px',
            marginRight: '8px',
          }}
        >
          {exp.method}
        </Tag>
      )}

      {/* 中间：文本区域，填满剩余空间 */}
      <a
        href={generateApiUrl(exp.id)}
        onClick={(e) => handleApiClick(exp.id, e)}
        onMouseDown={(e) => {
          if (e.button === 1) {
            console.log('🔍 [ApiTreeManager] 中键点击，允许浏览器默认行为');
          }
        }}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontFamily: 'monospace',
            color: 'var(--semi-color-text-0)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {exp.id}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--semi-color-text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {exp.name || '未命名'}
        </div>
      </a>

      {/* 右侧：按钮区 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        {/* 端点状态指示器 */}
        {endpointStatus && (
          <Tooltip
            content={
              <div>
                <div>端点状态: {getStatusText(endpointStatus.status)}</div>
                <div>最近探查: {new Date(endpointStatus.lastProbeTime).toLocaleString()}</div>
                {endpointStatus.responseTimeMs && (
                  <div>响应时间: {endpointStatus.responseTimeMs}ms</div>
                )}
                {endpointStatus.errorMessage && <div>错误: {endpointStatus.errorMessage}</div>}
              </div>
            }
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(endpointStatus.status),
                border: '1px solid #fff',
                boxShadow: '0 0 2px rgba(0,0,0,0.3)',
              }}
            />
          </Tooltip>
        )}

        <Button
          icon={<IconDelete />}
          type="danger"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteExpression(exp.id);
          }}
          style={{
            padding: '2px',
            width: '20px',
            height: '20px',
            flexShrink: 0,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
};

export const ApiTreeManager: React.FC<ApiTreeManagerProps> = ({
  expressions,
  selectedExpressionId,
  onExpressionSelect,
  onDeleteExpression,
  onDeleteGroup,
  onMoveApiToGroup,
  onReorderApi,
}) => {
  const [searchText, setSearchText] = useState('');

  // 使用端点探查store
  const endpointProbe = useEndpointProbeStore();

  // 启动端点探查轮询
  useEffect(() => {
    endpointProbe.startPolling();
    return () => endpointProbe.stopPolling();
  }, []); // 移除依赖项，只在组件挂载时执行一次

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
  const getMethodColor = (
    method: string
  ): 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'grey' => {
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
        label: createGroupLabel(group.name, onDeleteGroup!, groupKey),
        icon: <IconFolder />,
        children: groupApis.map((exp) => ({
          key: `api-${exp.id}`,
          value: exp.id,
          label: createApiLabel(
            exp,
            handleApiClick,
            getMethodColor,
            onDeleteExpression!,
            endpointProbe
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
        label: createGroupLabel(groupName, onDeleteGroup!, groupKey),
        icon: <IconFolder />,
        children: groupApis.map((exp) => ({
          key: `api-${exp.id}`,
          value: exp.id,
          label: createApiLabel(
            exp,
            handleApiClick,
            getMethodColor,
            onDeleteExpression!,
            endpointProbe
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
