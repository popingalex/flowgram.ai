import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';
import { useClientContext, CommandService } from '@flowgram.ai/free-layout-editor';
import { Typography, Button, Toast } from '@douyinfe/semi-ui';
import { IconSmallTriangleDown, IconSmallTriangleLeft, IconRefresh } from '@douyinfe/semi-icons';

import { Feedback } from '../feedback';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { FlowCommandId } from '../../shortcuts';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { NodeMenu } from '../../components/node-menu';
import { getIcon } from './utils';
import { Header, Operators, Title } from './styles';

const { Text } = Typography;

export function FormHeader() {
  const { node, expanded, toggleExpand, readonly } = useNodeRenderContext();
  const ctx = useClientContext();
  const isSidebar = useIsSidebar();
  const { editingEntity } = useCurrentEntity();
  const { refreshEntity } = useCurrentEntityActions();

  const handleExpand = (e: React.MouseEvent) => {
    toggleExpand();
    e.stopPropagation(); // Disable clicking prevents the sidebar from opening
  };

  const handleDelete = () => {
    ctx.get<CommandService>(CommandService).executeCommand(FlowCommandId.DELETE, [node]);
  };

  const handleRefresh = async () => {
    if (!editingEntity?.id) {
      Toast.warning('没有找到实体ID');
      return;
    }

    try {
      await refreshEntity(editingEntity.id);
      Toast.success('实体数据已刷新');
    } catch (error) {
      console.error('刷新实体失败:', error);
      Toast.error('刷新实体失败');
    }
  };

  // 判断是否为start节点
  const isStartNode = node.flowNodeType === 'start';

  return (
    <Header>
      {getIcon(node)}
      <Title>
        <Field name="title">
          {({ field: { value, onChange }, fieldState }: FieldRenderProps<string>) => (
            <div style={{ height: 24 }}>
              <Text ellipsis={{ showTooltip: true }}>{value}</Text>
              <Feedback errors={fieldState?.errors} />
            </div>
          )}
        </Field>
      </Title>
      {node.renderData.expandable && !isSidebar && (
        <Button
          type="primary"
          icon={expanded ? <IconSmallTriangleDown /> : <IconSmallTriangleLeft />}
          size="small"
          theme="borderless"
          onClick={handleExpand}
        />
      )}
      {readonly ? undefined : (
        <Operators>
          {isStartNode && (
            <Button
              icon={<IconRefresh />}
              size="small"
              theme="borderless"
              onClick={handleRefresh}
              title="刷新实体属性和模块"
            />
          )}
          <NodeMenu node={node} deleteNode={handleDelete} />
        </Operators>
      )}
    </Header>
  );
}
