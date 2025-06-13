import React, { useContext } from 'react';

import { PlaygroundEntityContext, FlowNodeFormData } from '@flowgram.ai/free-layout-editor';
import { TreeSelect, Tag } from '@douyinfe/semi-ui';

import { useBehaviorStore } from '../../../stores';

interface InvokeFunctionSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const InvokeFunctionSelector: React.FC<InvokeFunctionSelectorProps> = ({
  value,
  onChange,
}) => {
  const { behaviors, loadBehaviors, loading } = useBehaviorStore();
  const playgroundEntity = useContext(PlaygroundEntityContext);

  // 添加展开状态管理
  const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadBehaviors();
  }, [loadBehaviors]);

  // 计算实际显示的value - 支持从后台functionMeta.id转换为_indexId
  const displayValue = React.useMemo(() => {
    if (value) {
      return value; // 如果已经有_indexId，直接使用
    }

    // 尝试从节点的functionMeta中获取函数ID
    if (playgroundEntity) {
      try {
        const formData = playgroundEntity.getData(FlowNodeFormData);
        const functionId = formData?.getFormModel()?.values?.data?.functionMeta?.id;
        if (functionId) {
          // 根据functionMeta.id查找对应的behavior._indexId
          const matchedBehavior = behaviors.find((b) => b.id === functionId);
          return matchedBehavior?._indexId || undefined;
        }
      } catch (error) {
        // 忽略错误，使用默认值
      }
    }

    return undefined;
  }, [value, behaviors, playgroundEntity]);

  // 构建树形数据结构，按Java类名分组
  const treeData = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};

    behaviors.forEach((behavior) => {
      // 使用解析后的类名进行分组
      const className = behavior.className || '其他';

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push({
        label: (
          <div
            style={{ width: '100%', paddingRight: '12px' }}
            title={behavior.fullClassName || behavior.id} // 在tooltip中显示完整类名
          >
            {/* 只显示方法名，简洁明了 */}
            <span style={{ fontWeight: 500, fontSize: '14px' }}>
              {behavior.methodName || behavior.name}
            </span>
          </div>
        ),
        value: behavior._indexId,
        key: behavior._indexId,
      });
    });

    return Object.keys(grouped)
      .sort()
      .map((className) => ({
        label: (
          <div
            style={{
              cursor: 'pointer',
              width: '100%',
              padding: '4px 0',
            }}
            onClick={(e) => {
              e.stopPropagation();
              const nodeKey = className;

              if (expandedKeys.includes(nodeKey)) {
                // 如果已展开，则收缩
                setExpandedKeys(expandedKeys.filter((key) => key !== nodeKey));
              } else {
                // 如果未展开，则展开
                setExpandedKeys([...expandedKeys, nodeKey]);
              }
            }}
          >
            {className}
          </div>
        ),
        value: className,
        key: className,
        disabled: true, // 保持禁用，防止选择
        isLeaf: false,
        children: grouped[className],
      }));
  }, [behaviors, expandedKeys]); // 添加expandedKeys为依赖

  // 处理函数选择，动态更新inputs和outputs
  const handleFunctionSelect = (selectedValue: string) => {
    const selectedBehavior = behaviors.find((b) => b._indexId === selectedValue);
    if (!selectedBehavior) {
      return;
    }

    if (!playgroundEntity) {
      return;
    }

    try {
      // 使用正确的方式获取节点表单数据
      const formData = playgroundEntity.getData(FlowNodeFormData);
      if (!formData) {
        return;
      }

      // 获取当前表单值
      const formModel = formData.getFormModel();
      const currentValues = formModel.values;

      // 构建新的inputs schema - 只包含函数特定的参数
      const newInputs: any = {
        type: 'object',
        required: [],
        properties: {},
      };

      // 只添加函数特定的参数，不添加基础API参数
      selectedBehavior.parameters.forEach((param) => {
        newInputs.properties[param.name] = {
          type: param.type,
          title: param.name,
          description: param.description,
        };

        if (param.required) {
          newInputs.required.push(param.name);
        }
      });

      // 构建新的outputs schema
      const newOutputs: any = {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            title: '调用成功',
            description: '函数调用是否成功',
          },
          statusCode: {
            type: 'number',
            title: 'HTTP状态码',
            description: 'API调用返回的HTTP状态码',
          },
          responseTime: {
            type: 'number',
            title: '响应时间(ms)',
            description: 'API调用的响应时间',
          },
          error: {
            type: 'string',
            title: '错误信息',
            description: '调用失败时的错误信息',
          },
          result: {
            type: selectedBehavior.returns.type,
            title: '调用结果',
            description: selectedBehavior.returns.description || '函数返回的结果数据',
          },
        },
      };

      // 更新节点数据，保留其他现有数据，同时设置title
      const updatedData = {
        ...currentValues.data,
        title: selectedBehavior.methodName || selectedBehavior.name, // 使用函数名作为标题
        inputs: newInputs,
        outputs: newOutputs,
        functionMeta: {
          id: selectedBehavior.id,
          name: selectedBehavior.name,
          description: selectedBehavior.description,
          category: selectedBehavior.category,
          // Java函数没有HTTP端点和方法概念
          functionType: 'java-function',
          parameters: selectedBehavior.parameters,
          returns: selectedBehavior.returns,
        },
      };

      // 使用正确的更新方法 - 只传入data部分
      formData.updateFormValues(updatedData);
    } catch (error) {
      console.error('InvokeFunctionSelector: 更新节点数据失败:', error);
    }
  };

  // 处理展开状态变化
  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
  };

  const handleChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    const selectedValue = value as string;

    // 只有当选择的是叶子节点（实际的函数）时，才执行相关逻辑
    const selectedBehavior = behaviors.find((b) => b._indexId === selectedValue);
    if (selectedBehavior) {
      onChange?.(selectedValue);
      handleFunctionSelect(selectedValue);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <TreeSelect
        placeholder="选择要调用的函数"
        style={{ width: '100%' }}
        value={displayValue}
        onChange={handleChange}
        showClear
        filterTreeNode
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        dropdownStyle={{
          maxHeight: '400px',
          overflow: 'auto',
        }}
        disabled={loading}
        treeNodeFilterProp="label"
        expandAll={false} // 默认不展开
      />
    </div>
  );
};
