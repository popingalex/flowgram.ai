import React from 'react';

import styled from 'styled-components';
import {
  Card,
  Typography,
  Space,
  Button,
  Divider,
  Badge,
  Tag,
  JsonViewer,
} from '@douyinfe/semi-ui';
import { IconClose, IconRefresh, IconEdit, IconGit } from '@douyinfe/semi-icons';

import { RouteType } from '../hooks/use-router';

const { Title, Paragraph, Text } = Typography;

const DebugContainer = styled.div`
  position: fixed;
  top: 64px; /* 考虑header高度 */
  right: 0;
  width: 500px;
  height: calc(100vh - 64px);
  background: var(--semi-color-bg-0);
  border-left: 1px solid var(--semi-color-border);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const DebugHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--semi-color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const DebugContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const CompareSection = styled.div`
  margin-bottom: 16px;
`;

// 上下布局的容器
const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 8px 0;
`;

const DataSection = styled.div`
  border: 1px solid var(--semi-color-border);
  border-radius: 6px;
  overflow: hidden;
`;

const DataHeader = styled.div<{ type: 'original' | 'editing' }>`
  background: ${(props) =>
    props.type === 'original'
      ? 'var(--semi-color-fill-1)'
      : 'var(--semi-color-primary-light-default)'};
  padding: 8px 12px;
  border-bottom: 1px solid var(--semi-color-border);
  font-size: 12px;
  font-weight: 600;
  color: ${(props) =>
    props.type === 'original' ? 'var(--semi-color-text-1)' : 'var(--semi-color-primary)'};
`;

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
  currentRoute: RouteType;
  data: any;
  title?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  visible,
  onClose,
  currentRoute,
  data,
  title = 'Debug 数据',
}) => {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showRawData, setShowRawData] = React.useState(false);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getRouteDisplayName = (route: RouteType): string => {
    const routeNames: Record<RouteType, string> = {
      entities: '实体管理',
      modules: '模块管理',
      'exp-remote': '远程表达式',
      'exp-local': '本地表达式',
      'entity-workflow': '实体工作流',
      'api-test': 'API测试',
      'test-new-architecture': '新架构测试',
      'test-indexed-store': '索引存储测试',
      'test-behavior': '行为测试',
      'test-variable-selector': '变量选择器测试',
      'test-properties': '属性测试',
    };
    return routeNames[route] || route;
  };

  // 格式化实体数据，只显示关键字段
  const formatEntityData = (entity: any) => {
    if (!entity) return null;

    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      bundles: entity.bundles || [],
      attributes: (entity.attributes || []).map((attr: any, index: number) => ({
        [`属性${index + 1}`]: {
          id: attr.id,
          name: attr.name,
          type: attr.type,
          description: attr.description || '',
          ...(attr.enumClassId && { enumClassId: attr.enumClassId }),
        },
      })),
    };
  };

  const renderEditingState = (editingState: any) => {
    const { originalEntity, editingEntity, isDirty, isSaving, selectedEntityId } = editingState;

    const originalData = formatEntityData(originalEntity);
    const editingData = formatEntityData(editingEntity);

    // 🔍 添加调试信息：显示深度比较的详细过程
    const debugComparison = React.useMemo(() => {
      if (!originalEntity || !editingEntity) return null;

      // 模拟cleanEntityForComparison的逻辑
      const cleanOriginal = { ...originalEntity };
      const cleanEditing = { ...editingEntity };

      // 移除状态字段
      delete (cleanOriginal as any)._status;
      delete (cleanOriginal as any)._editStatus;
      delete (cleanOriginal as any)._originalId;
      delete (cleanOriginal as any)._indexId;
      delete (cleanOriginal as any).moduleIds;
      delete (cleanEditing as any)._status;
      delete (cleanEditing as any)._editStatus;
      delete (cleanEditing as any)._originalId;
      delete (cleanEditing as any)._indexId;
      delete (cleanEditing as any).moduleIds;

      // 🎯 修复：统一处理bundles字段，undefined和空数组都视为空数组
      if (
        !cleanOriginal.bundles ||
        !Array.isArray(cleanOriginal.bundles) ||
        cleanOriginal.bundles.length === 0
      ) {
        cleanOriginal.bundles = []; // 统一为空数组
      } else {
        cleanOriginal.bundles = [...cleanOriginal.bundles].sort(); // 排序
      }

      if (
        !cleanEditing.bundles ||
        !Array.isArray(cleanEditing.bundles) ||
        cleanEditing.bundles.length === 0
      ) {
        cleanEditing.bundles = []; // 统一为空数组
      } else {
        cleanEditing.bundles = [...cleanEditing.bundles].sort(); // 排序
      }

      // 清理属性
      if (cleanOriginal.attributes) {
        cleanOriginal.attributes = cleanOriginal.attributes
          .map((attr: any) => {
            const cleanedAttr = { ...attr };
            delete cleanedAttr._status;
            delete cleanedAttr._editStatus;
            delete cleanedAttr._indexId;
            delete cleanedAttr._id;
            return cleanedAttr;
          })
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
      }

      if (cleanEditing.attributes) {
        cleanEditing.attributes = cleanEditing.attributes
          .map((attr: any) => {
            const cleanedAttr = { ...attr };
            delete cleanedAttr._status;
            delete cleanedAttr._editStatus;
            delete cleanedAttr._indexId;
            delete cleanedAttr._id;
            return cleanedAttr;
          })
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
      }

      return {
        cleanOriginal,
        cleanEditing,
        isEqual: JSON.stringify(cleanOriginal) === JSON.stringify(cleanEditing),
        differences: findDifferences(cleanOriginal, cleanEditing),
      };
    }, [originalEntity, editingEntity]);

    // 简单的差异检测函数
    const findDifferences = (obj1: any, obj2: any, path = ''): string[] => {
      const diffs: string[] = [];

      if (typeof obj1 !== typeof obj2) {
        diffs.push(`${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`);
        return diffs;
      }

      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
          diffs.push(`${path}: array length (${obj1.length} vs ${obj2.length})`);
        }
        const maxLen = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLen; i++) {
          if (i >= obj1.length) {
            diffs.push(`${path}[${i}]: missing in original`);
          } else if (i >= obj2.length) {
            diffs.push(`${path}[${i}]: missing in editing`);
          } else if (JSON.stringify(obj1[i]) !== JSON.stringify(obj2[i])) {
            diffs.push(...findDifferences(obj1[i], obj2[i], `${path}[${i}]`));
          }
        }
        return diffs;
      }

      if (obj1 && obj2 && typeof obj1 === 'object') {
        const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        for (const key of keys) {
          if (!(key in obj1)) {
            diffs.push(`${path}.${key}: missing in original`);
          } else if (!(key in obj2)) {
            diffs.push(`${path}.${key}: missing in editing`);
          } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
            if (typeof obj1[key] === 'object') {
              diffs.push(...findDifferences(obj1[key], obj2[key], `${path}.${key}`));
            } else {
              diffs.push(
                `${path}.${key}: ${JSON.stringify(obj1[key])} vs ${JSON.stringify(obj2[key])}`
              );
            }
          }
        }
        return diffs;
      }

      if (obj1 !== obj2) {
        diffs.push(`${path}: ${JSON.stringify(obj1)} vs ${JSON.stringify(obj2)}`);
      }

      return diffs;
    };

    return (
      <CompareSection>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text strong style={{ display: 'flex', alignItems: 'center' }}>
            <IconEdit style={{ marginRight: 4 }} />
            编辑状态对比
          </Text>
          <Space>
            {isDirty && (
              <Badge dot style={{ backgroundColor: 'var(--semi-color-warning)' }}>
                <Tag color="orange" size="small">
                  未保存
                </Tag>
              </Badge>
            )}
            {isSaving && (
              <Tag color="blue" size="small">
                保存中...
              </Tag>
            )}
          </Space>
        </Space>

        <div style={{ marginBottom: 12 }}>
          <Text type="tertiary" size="small">
            实体ID: {selectedEntityId} | 原数据 vs 编辑副本 (上下对比)
          </Text>
        </div>

        <DataContainer>
          {/* 原始数据 */}
          <DataSection>
            <DataHeader type="original">🔸 原始数据 (Original)</DataHeader>
            <JsonViewer
              value={JSON.stringify(originalData, null, 2)}
              height={350}
              options={{
                readOnly: true,
                lineHeight: 18,
                autoWrap: false,
                formatOptions: {
                  tabSize: 2,
                  insertSpaces: true,
                },
              }}
              showSearch={false}
            />
          </DataSection>

          {/* 编辑副本 */}
          <DataSection>
            <DataHeader type="editing">🔹 编辑副本 (Working Copy)</DataHeader>
            <JsonViewer
              value={JSON.stringify(editingData, null, 2)}
              height={350}
              options={{
                readOnly: true,
                lineHeight: 18,
                autoWrap: false,
                formatOptions: {
                  tabSize: 2,
                  insertSpaces: true,
                },
              }}
              showSearch={false}
            />
          </DataSection>
        </DataContainer>

        {/* 显示差异统计 */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--semi-color-fill-0)',
            borderRadius: 6,
            border: '1px solid var(--semi-color-border)',
          }}
        >
          <Text
            size="small"
            style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
          >
            <IconGit style={{ marginRight: 6 }} />
            <strong>状态:</strong>
            <Tag color={isDirty ? 'orange' : 'green'} size="small">
              {isDirty ? '有修改' : '无修改'}
            </Tag>
            <span style={{ color: 'var(--semi-color-text-2)' }}>|</span>
            <strong>属性数量:</strong>
            <span>
              {originalEntity?.attributes?.length || 0} → {editingEntity?.attributes?.length || 0}
            </span>
            <span style={{ color: 'var(--semi-color-text-2)' }}>|</span>
            <strong>模块关联:</strong>
            <span>
              {originalEntity?.bundles?.length || 0} → {editingEntity?.bundles?.length || 0}
            </span>
          </Text>

          {/* 显示bundles详细对比 */}
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--semi-color-text-2)' }}>
            <div>原始bundles: [{(originalEntity?.bundles || []).sort().join(', ')}]</div>
            <div>编辑bundles: [{(editingEntity?.bundles || []).sort().join(', ')}]</div>
          </div>

          {/* 🔍 调试信息：显示深度比较结果 */}
          {debugComparison && (
            <div
              style={{
                marginTop: 12,
                padding: 8,
                background: 'var(--semi-color-fill-1)',
                borderRadius: 4,
              }}
            >
              <Text strong size="small" style={{ color: 'var(--semi-color-text-0)' }}>
                🔍 深度比较调试:
              </Text>
              <div style={{ marginTop: 4, fontSize: 10, color: 'var(--semi-color-text-1)' }}>
                <div>清理后数据相等: {debugComparison.isEqual ? '✅ 是' : '❌ 否'}</div>
                {debugComparison.differences.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div>差异详情:</div>
                    {debugComparison.differences.slice(0, 5).map((diff, index) => (
                      <div key={index} style={{ marginLeft: 8, color: 'var(--semi-color-danger)' }}>
                        • {diff}
                      </div>
                    ))}
                    {debugComparison.differences.length > 5 && (
                      <div style={{ marginLeft: 8, color: 'var(--semi-color-text-2)' }}>
                        ... 还有 {debugComparison.differences.length - 5} 个差异
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CompareSection>
    );
  };

  const renderMainContent = () => {
    if (!data) {
      return <Text type="tertiary">无数据</Text>;
    }

    // 如果有编辑状态，只显示编辑状态对比
    if (data.editingState) {
      return renderEditingState(data.editingState);
    }

    // 没有编辑状态时的显示
    return (
      <Space vertical style={{ width: '100%' }}>
        <div>
          <Text strong>页面类型:</Text>
          <Text code style={{ marginLeft: 8 }}>
            {data.pageType}
          </Text>
        </div>

        {data.selectedEntity && (
          <div>
            <Text strong style={{ marginBottom: 8 }}>
              当前选中实体:
            </Text>
            <JsonViewer
              value={JSON.stringify(
                {
                  id: data.selectedEntity.id,
                  name: data.selectedEntity.name,
                  description: data.selectedEntity.description,
                  type: 'Entity',
                },
                null,
                2
              )}
              height={200}
              options={{
                readOnly: true,
                lineHeight: 18,
                autoWrap: false,
                formatOptions: {
                  tabSize: 2,
                  insertSpaces: true,
                },
              }}
              showSearch={false}
            />
          </div>
        )}

        {data.selectedModule && (
          <div>
            <Text strong style={{ marginBottom: 8 }}>
              当前选中模块:
            </Text>
            <JsonViewer
              value={JSON.stringify(
                {
                  id: data.selectedModule.id,
                  name: data.selectedModule.name,
                  description: data.selectedModule.description,
                  type: 'Module',
                },
                null,
                2
              )}
              height={200}
              options={{
                readOnly: true,
                lineHeight: 18,
                autoWrap: false,
                formatOptions: {
                  tabSize: 2,
                  insertSpaces: true,
                },
              }}
              showSearch={false}
            />
          </div>
        )}

        <div>
          <Text strong style={{ marginBottom: 8 }}>
            元数据:
          </Text>
          <JsonViewer
            value={JSON.stringify(data.metadata, null, 2)}
            height={180}
            options={{
              readOnly: true,
              lineHeight: 18,
              autoWrap: false,
              formatOptions: {
                tabSize: 2,
                insertSpaces: true,
              },
            }}
            showSearch={false}
          />
        </div>

        {showRawData && (
          <div>
            <Text strong style={{ marginBottom: 8 }}>
              完整数据:
            </Text>
            <JsonViewer
              value={JSON.stringify(data, null, 2)}
              height={400}
              options={{
                readOnly: true,
                lineHeight: 18,
                autoWrap: true,
                formatOptions: {
                  tabSize: 2,
                  insertSpaces: true,
                },
              }}
              showSearch={true}
            />
          </div>
        )}
      </Space>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <DebugContainer>
      <DebugHeader>
        <Space>
          <Title heading={6} style={{ margin: 0 }}>
            🐛 调试面板
          </Title>
          <Text type="tertiary" size="small">
            {getRouteDisplayName(currentRoute)}
          </Text>
        </Space>
        <Space>
          <Button
            size="small"
            type="tertiary"
            onClick={() => setShowRawData(!showRawData)}
            title="显示/隐藏完整数据"
          >
            {showRawData ? '简化' : '详细'}
          </Button>
          <Button
            icon={<IconRefresh />}
            size="small"
            type="tertiary"
            onClick={handleRefresh}
            title="刷新数据"
          />
          <Button
            icon={<IconClose />}
            size="small"
            type="tertiary"
            onClick={onClose}
            title="关闭"
          />
        </Space>
      </DebugHeader>

      <DebugContent key={refreshKey}>{renderMainContent()}</DebugContent>
    </DebugContainer>
  );
};
