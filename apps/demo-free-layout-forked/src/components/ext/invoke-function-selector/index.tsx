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
    // console.log('🔍 [InvokeFunctionSelector] 加载函数行为...');
  }, [loadBehaviors]);

  // React.useEffect(() => {
  //   console.log('🔍 [InvokeFunctionSelector] behaviors更新:', {
  //     behaviorsCount: behaviors.length,
  //     loading,
  //     behaviors: behaviors.slice(0, 3), // 只显示前3个
  //   });
  // }, [behaviors, loading]);

  // 计算实际显示的value - 支持从后台functionId转换为_indexId
  const displayValue = React.useMemo(() => {
    if (value) {
      return value; // 如果已经有_indexId，直接使用
    }

    // 尝试从节点的exp.id中获取函数ID
    if (playgroundEntity) {
      try {
        const formData = playgroundEntity.getData(FlowNodeFormData);

        if (formData) {
          const formModel = formData.getFormModel();

          if (formModel && formModel.values && formModel.values.data) {
            const functionId = formModel.values.data.exp?.id;

            if (functionId) {
              // 直接返回原始ID，不做转换
              return functionId;
            }
          }
        }
      } catch (error) {
        console.error('[InvokeFunctionSelector] 获取exp.id失败:', error);
      }
    }

    return undefined;
  }, [value, behaviors, playgroundEntity]);

  // 构建树形数据结构，按Java类名分组
  const treeData = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // 找到当前选中函数所属的类别
    const selectedBehavior = behaviors.find((b) => b.id === displayValue);
    const selectedClassName = selectedBehavior
      ? selectedBehavior.id.split('.').slice(-2, -1)[0]
      : null;

    behaviors.forEach((behavior) => {
      // 从完整ID中提取类名和方法名
      const fullId = behavior.id || '';
      const parts = fullId.split('.');
      const methodName = parts[parts.length - 1] || 'unknown';
      const className = parts[parts.length - 2] || '其他';

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push({
        label: methodName, // 使用纯文本作为label，支持高亮
        value: behavior.id,
        key: behavior.id,
        title: behavior.id, // 在tooltip中显示完整ID
      });
    });

    return Object.keys(grouped)
      .sort()
      .map((categoryName) => {
        // 🔧 判断当前类别是否包含选中的函数
        const isSelectedCategory = categoryName === selectedClassName;

        return {
          label: categoryName, // 使用纯文本，支持高亮
          value: categoryName,
          key: categoryName,
          disabled: true, // 保持禁用，防止选择分类节点
          isLeaf: false,
          children: grouped[categoryName],
        };
      });
  }, [behaviors, expandedKeys, displayValue]); // 🔧 添加displayValue为依赖，确保选中状态变化时重新渲染

  // React.useEffect(() => {
  //   console.log('🔍 [InvokeFunctionSelector] treeData更新:', {
  //     treeDataLength: treeData.length,
  //     categories: treeData.map((item) => item.label),
  //     displayValue,
  //   });
  // }, [treeData, displayValue]);

  // 处理函数选择，动态更新inputs和outputs
  const handleFunctionSelect = (selectedValue: string) => {
    const selectedBehavior = behaviors.find((b) => b.id === selectedValue);
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
      (selectedBehavior as any).inputs?.forEach((param: any) => {
        newInputs.properties[param.id] = {
          type: param.type,
          title: param.id,
          description: param.desc,
        };
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
            type: (selectedBehavior as any).output?.type || 'object',
            title: '调用结果',
            description: (selectedBehavior as any).output?.desc || '函数返回的结果数据',
          },
        },
      };

      // 更新节点数据，保留其他现有数据，同时设置title和exp
      const updatedData = {
        ...currentValues.data,
        title: selectedBehavior.methodName || selectedBehavior.name, // 使用函数名作为标题
        exp: { id: selectedBehavior.id }, // 保留后台的exp数据结构
        inputs: newInputs,
        outputs: newOutputs,
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
    const selectedBehavior = behaviors.find((b) => b.id === selectedValue);
    if (selectedBehavior) {
      onChange?.(selectedValue);
      handleFunctionSelect(selectedValue);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <TreeSelect
        searchPosition="trigger"
        placeholder="选择要调用的函数"
        style={{ width: '100%' }}
        value={displayValue}
        onChange={handleChange}
        showClear
        filterTreeNode
        showFilteredOnly // 只显示过滤后的结果
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        expandAction="click"
        dropdownStyle={{
          maxHeight: '400px',
          overflow: 'auto',
        }}
        disabled={loading}
        treeNodeFilterProp="label"
        expandAll={false} // 默认不展开
        onSearch={(inputValue, filteredExpandedKeys, filteredNodes) => {
          // 搜索时自动展开包含匹配项的父节点
          if (inputValue && filteredExpandedKeys) {
            setExpandedKeys(filteredExpandedKeys);
            console.log('🔍 搜索关键词:', inputValue);
            console.log('🔍 自动展开的节点:', filteredExpandedKeys);
            console.log('🔍 过滤后的节点数量:', filteredNodes?.length || 0);
          } else if (!inputValue) {
            // 清空搜索时，恢复原来的展开状态
            setExpandedKeys([]);
          }
        }}
      />
    </div>
  );
};
