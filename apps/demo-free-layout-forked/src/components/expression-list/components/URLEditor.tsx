import React, { useCallback, useState, useRef, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Input, Select, Space } from '@douyinfe/semi-ui';

import { useCurrentExpressionActions } from '../../../stores/current-expression.store';

interface URLEditorProps {
  currentEditingApi: any;
  onFieldChange?: (field: string, value: any) => void;
}

export const URLEditor: React.FC<URLEditorProps> = ({ currentEditingApi, onFieldChange }) => {
  const currentExpressionActions = useCurrentExpressionActions();

  // 🔧 使用稳定的组件key，基于API ID而不是随机nanoid
  const componentKey = currentEditingApi?.id || 'new-api';

  // URL分段状态
  const [protocol, setProtocol] = useState('https');
  const [domain, setDomain] = useState('api.example.com');
  const [path, setPath] = useState(currentEditingApi?.url || '');

  // 🔧 优化输入框引用和光标位置管理
  const pathInputRef = useRef<any>(null);
  const lastCursorPosition = useRef<number>(0);

  // 更新API字段
  const handleUpdateApiField = useCallback(
    (field: string, value: any) => {
      if (onFieldChange) {
        onFieldChange(field, value);
      } else {
        currentExpressionActions.updateProperty(field, value);
      }
    },
    [onFieldChange, currentExpressionActions]
  );

  // 🔧 优化路径变化处理，减少不必要的光标操作
  const handlePathChange = useCallback(
    (value: string) => {
      // 保存当前光标位置
      if (pathInputRef.current?.input) {
        lastCursorPosition.current = pathInputRef.current.input.selectionStart || 0;
      }

      setPath(value);
      handleUpdateApiField('url', value);
    },
    [handleUpdateApiField]
  );

  // 🔧 优化光标位置恢复逻辑
  useEffect(() => {
    // 只在path变化且输入框存在时恢复光标位置
    if (pathInputRef.current?.input && lastCursorPosition.current > 0) {
      // 使用requestAnimationFrame确保DOM更新完成
      requestAnimationFrame(() => {
        if (pathInputRef.current?.input) {
          const input = pathInputRef.current.input;
          const position = Math.min(lastCursorPosition.current, input.value.length);
          input.setSelectionRange(position, position);
        }
      });
    }
  }, [path]);

  // 🔧 同步外部URL变化，避免不必要的状态更新
  useEffect(() => {
    const newUrl = currentEditingApi?.url || '';
    if (newUrl !== path) {
      setPath(newUrl);
    }
  }, [currentEditingApi?.url]);

  // 🔧 处理输入框焦点和选择事件
  const handleInputEvents = useCallback((e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      lastCursorPosition.current = target.selectionStart || 0;
    }
  }, []);

  return (
    <div
      key={componentKey}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
    >
      <Select
        value={currentEditingApi?.method || 'POST'}
        style={{ width: 80 }}
        onChange={(value) => handleUpdateApiField('method', value)}
      >
        <Select.Option value="GET">GET</Select.Option>
        <Select.Option value="POST">POST</Select.Option>
        <Select.Option value="PUT">PUT</Select.Option>
        <Select.Option value="DELETE">DELETE</Select.Option>
        <Select.Option value="PATCH">PATCH</Select.Option>
      </Select>

      <Select
        value={protocol}
        style={{ width: 80 }}
        onChange={(value) => setProtocol(value as string)}
      >
        <Select.Option value="https">HTTPS</Select.Option>
        <Select.Option value="http">HTTP</Select.Option>
      </Select>

      <span style={{ color: '#999', fontSize: '14px' }}>://</span>

      <Input
        value={domain}
        onChange={(value) => setDomain(value as string)}
        style={{ width: 180 }}
        placeholder="域名"
      />

      <Input
        ref={pathInputRef}
        key={`path-${componentKey}`} // 🔧 使用稳定的key
        value={path}
        onChange={handlePathChange}
        style={{ flex: 1 }}
        placeholder="/api/path"
        onFocus={handleInputEvents}
        onSelect={handleInputEvents}
        onKeyUp={handleInputEvents}
        onClick={handleInputEvents}
      />
    </div>
  );
};
