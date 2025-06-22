import React from 'react';

import { useModuleStore } from '../../stores/module.store';
import { StoreBoundInput, createIdValidator } from './store-bound-input';

// 模块字段输入组件
export const ModuleFieldInput = React.memo(
  ({
    moduleIndexId,
    field,
    placeholder,
    isIdField = false,
    required = false,
  }: {
    moduleIndexId: string;
    field: 'id' | 'name';
    placeholder: string;
    isIdField?: boolean;
    required?: boolean;
  }) => {
    const validationFn = field === 'id' ? createIdValidator('module-id') : undefined;

    return (
      <StoreBoundInput
        storeKey="module"
        itemIndexId={moduleIndexId}
        field={field}
        placeholder={placeholder}
        isIdField={isIdField}
        required={required}
        useStore={() => useModuleStore()}
        useStoreActions={() => useModuleStore()}
        validationFn={validationFn}
      />
    );
  }
);
ModuleFieldInput.displayName = 'ModuleFieldInput';

// 模块属性字段输入组件
export const ModuleAttributeFieldInput = React.memo(
  ({
    moduleIndexId,
    attributeIndexId,
    field,
    placeholder,
    isIdField = false,
    required = false,
    readonly = false,
  }: {
    moduleIndexId: string;
    attributeIndexId: string;
    field: 'id' | 'name';
    placeholder: string;
    isIdField?: boolean;
    required?: boolean;
    readonly?: boolean;
  }) => {
    const validationFn = field === 'id' ? createIdValidator('attribute-id') : undefined;

    return (
      <StoreBoundInput
        storeKey="module"
        itemIndexId={moduleIndexId}
        subItemIndexId={attributeIndexId}
        field={field}
        placeholder={placeholder}
        isIdField={isIdField}
        required={required}
        readonly={readonly}
        useStore={() => useModuleStore()}
        useStoreActions={() => useModuleStore()}
        validationFn={validationFn}
      />
    );
  }
);
ModuleAttributeFieldInput.displayName = 'ModuleAttributeFieldInput';
