import React from 'react';

import { useEntityList, useEntityListActions } from '../../stores/entity-list';
import { StoreBoundInput, createIdValidator } from './store-bound-input';

// 实体字段输入组件
export const EntityFieldInput = React.memo(
  ({
    entityIndexId,
    field,
    placeholder,
    isIdField = false,
    required = false,
  }: {
    entityIndexId: string;
    field: 'id' | 'name';
    placeholder: string;
    isIdField?: boolean;
    required?: boolean;
  }) => {
    const validationFn = field === 'id' ? createIdValidator('entity-id') : undefined;

    return (
      <StoreBoundInput
        storeKey="entity"
        itemIndexId={entityIndexId}
        field={field}
        placeholder={placeholder}
        isIdField={isIdField}
        required={required}
        useStore={useEntityList}
        useStoreActions={useEntityListActions}
        validationFn={validationFn}
      />
    );
  }
);
EntityFieldInput.displayName = 'EntityFieldInput';

// 实体属性字段输入组件
export const EntityAttributeFieldInput = React.memo(
  ({
    entityIndexId,
    attributeIndexId,
    field,
    placeholder,
    isIdField = false,
    required = false,
    readonly = false,
  }: {
    entityIndexId: string;
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
        storeKey="entity"
        itemIndexId={entityIndexId}
        subItemIndexId={attributeIndexId}
        field={field}
        placeholder={placeholder}
        isIdField={isIdField}
        required={required}
        readonly={readonly}
        useStore={useEntityList}
        useStoreActions={useEntityListActions}
        validationFn={validationFn}
      />
    );
  }
);
EntityAttributeFieldInput.displayName = 'EntityAttributeFieldInput';
