import React from 'react';

import {
  ArrayIcons as OriginalArrayIcons,
  getSchemaIcon as originalGetSchemaIcon,
  IJsonSchema,
} from '@flowgram.ai/form-materials';
import { CascaderData } from '@douyinfe/semi-ui/lib/es/cascader';
import Icon from '@douyinfe/semi-icons';

const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5 };

const firstUppercase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// 数据限制图标定义（尺子图标）
export const DataRestrictionIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.96 7.404L16.596 1.04a.5.5 0 0 0-.707 0L1.04 15.889a.5.5 0 0 0 0 .707l6.364 6.364a.5.5 0 0 0 .707 0l3.18-3.18l.002-.002l2.827-2.827h.001v-.002l2.829-2.827v-.001l2.828-2.828l3.182-3.182a.5.5 0 0 0 0-.707m-3.535 2.828l-1.768-1.767l-.007-.007a.5.5 0 0 0-.7.714l1.768 1.767l-2.122 2.122l-3.182-3.182l-.007-.007a.5.5 0 0 0-.7.714l3.182 3.182l-2.121 2.121L12 14.121a.5.5 0 0 0-.707.707l1.767 1.768l-2.12 2.122l-3.183-3.183l-.007-.007a.5.5 0 1 0-.7.714l3.182 3.183l-2.475 2.474l-5.656-5.657L16.242 2.101L21.9 7.758z"
    />
  </svg>
);

// unknown类型图标（问号）
export const UnknownIcon = (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
      fill="currentColor"
    />
    <path
      d="M8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"
      fill="currentColor"
    />
    <path
      d="M8 9C8.41421 9 8.75 8.66421 8.75 8.25V8.20711C8.75 7.76165 8.92669 7.33432 9.23744 7.02357L9.53033 6.73068C10.2374 6.02362 10.2374 4.87638 9.53033 4.16932C8.82327 3.46226 7.67673 3.46226 6.96967 4.16932C6.26261 4.87638 6.26261 6.02362 6.96967 6.73068L7.25 7.01101"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 扩展getSchemaIcon函数，添加unknown类型支持
export const getSchemaIcon = (value?: Partial<IJsonSchema>) => {
  if (value?.type === 'unknown') {
    return UnknownIcon;
  }
  if (value?.type === 'array' && value?.items?.type === 'unknown') {
    return ArrayIcons.unknown;
  }
  return originalGetSchemaIcon(value);
};

// 扩展ArrayIcons，添加unknown类型的数组图标
export const ArrayIcons: { [key: string]: React.ReactNode } = {
  ...OriginalArrayIcons,
  unknown: (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.23759 1.00342H2.00391V14.997H5.23759V13.6251H3.35127V2.37534H5.23759V1.00342Z"
        fill="currentColor"
      />
      <path
        d="M10.7624 1.00342H13.9961V14.997H10.7624V13.6251H12.6487V2.37534H10.7624V1.00342Z"
        fill="currentColor"
      />
      <g transform="translate(4, 3) scale(0.6)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
          fill="currentColor"
        />
        <path
          d="M8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"
          fill="currentColor"
        />
        <path
          d="M8 9C8.41421 9 8.75 8.66421 8.75 8.25V8.20711C8.75 7.76165 8.92669 7.33432 9.23744 7.02357L9.53033 6.73068C10.2374 6.02362 10.2374 4.87638 9.53033 4.16932C8.82327 3.46226 7.67673 3.46226 6.96967 4.16932C6.26261 4.87638 6.26261 6.02362 6.96967 6.73068L7.25 7.01101"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  ),
};

// 基础选项（添加unknown类型）
const baseOptions: CascaderData[] = [
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={getSchemaIcon({ type: 'string' })} />
        {firstUppercase('string')}
      </div>
    ),
    value: 'string',
  },
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={getSchemaIcon({ type: 'number' })} />
        {firstUppercase('number')}
      </div>
    ),
    value: 'number',
  },
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={getSchemaIcon({ type: 'boolean' })} />
        {firstUppercase('boolean')}
      </div>
    ),
    value: 'boolean',
  },
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={getSchemaIcon({ type: 'object' })} />
        {firstUppercase('object')}
      </div>
    ),
    value: 'object',
  },
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={UnknownIcon} />
        {firstUppercase('unknown')}
      </div>
    ),
    value: 'unknown',
  },
];

export const options: CascaderData[] = [
  ...baseOptions,
  {
    label: (
      <div style={labelStyle}>
        <Icon size="small" svg={getSchemaIcon({ type: 'array' })} />
        {firstUppercase('array')}
      </div>
    ),
    value: 'array',
    children: baseOptions.map((_opt) => ({
      ..._opt,
      value: `${_opt.value}`,
      label: (
        <div style={labelStyle}>
          <Icon
            size="small"
            svg={getSchemaIcon({ type: 'array', items: { type: _opt.value as string } })}
          />
          {firstUppercase(_opt.value as string)}
        </div>
      ),
    })),
  },
];
