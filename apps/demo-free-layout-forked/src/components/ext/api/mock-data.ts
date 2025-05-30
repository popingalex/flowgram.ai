// Mock数据配置
import { Module } from '../entity-property-type-selector/module-store';
import { EnumClass } from '../entity-property-type-selector/enum-store';
import { Entity } from '../entity-property-type-selector/entity-store';

// 模块Mock数据
export const MOCK_MODULES: Module[] = [
  {
    id: 'user-info',
    name: '用户信息',
    description: '用户基本信息模块，包含常用的用户属性',
    deprecated: false,
    attributes: [
      {
        id: 'user-info/name',
        name: '姓名',
        type: 's',
        description: '用户的真实姓名',
      },
      {
        id: 'user-info/email',
        name: '邮箱',
        type: 's',
        description: '用户的电子邮箱地址',
      },
      {
        id: 'user-info/phone',
        name: '手机号',
        type: 's',
        description: '用户的手机号码',
      },
      {
        id: 'user-info/age',
        name: '年龄',
        type: 'n',
        description: '用户的年龄',
      },
    ],
  },
  {
    id: 'address-info',
    name: '地址信息',
    description: '地址相关信息模块',
    deprecated: false,
    attributes: [
      {
        id: 'address-info/province',
        name: '省份',
        type: 's',
        description: '所在省份',
      },
      {
        id: 'address-info/city',
        name: '城市',
        type: 's',
        description: '所在城市',
      },
      {
        id: 'address-info/district',
        name: '区县',
        type: 's',
        description: '所在区县',
      },
      {
        id: 'address-info/street',
        name: '街道',
        type: 's',
        description: '详细街道地址',
      },
      {
        id: 'address-info/postal-code',
        name: '邮政编码',
        type: 's',
        description: '邮政编码',
      },
    ],
  },
  {
    id: 'vehicle-info',
    name: '车辆信息',
    description: '车辆相关信息模块',
    deprecated: false,
    attributes: [
      {
        id: 'vehicle-info/brand',
        name: '品牌',
        type: 's',
        description: '车辆品牌',
      },
      {
        id: 'vehicle-info/model',
        name: '型号',
        type: 's',
        description: '车辆型号',
      },
      {
        id: 'vehicle-info/year',
        name: '年份',
        type: 'n',
        description: '生产年份',
      },
      {
        id: 'vehicle-info/color',
        name: '颜色',
        type: 's',
        description: '车辆颜色',
      },
      {
        id: 'vehicle-info/license-plate',
        name: '车牌号',
        type: 's',
        description: '车牌号码',
      },
    ],
  },
  {
    id: 'order-info',
    name: '订单信息',
    description: '订单相关信息模块',
    deprecated: false,
    attributes: [
      {
        id: 'order-info/order-number',
        name: '订单号',
        type: 's',
        description: '订单编号',
      },
      {
        id: 'order-info/total-amount',
        name: '总金额',
        type: 'n',
        description: '订单总金额',
      },
      {
        id: 'order-info/status',
        name: '状态',
        type: 's',
        description: '订单状态',
      },
      {
        id: 'order-info/create-time',
        name: '创建时间',
        type: 's',
        description: '订单创建时间',
      },
      {
        id: 'order-info/items',
        name: '商品列表',
        type: '[s]',
        description: '订单包含的商品列表',
      },
    ],
  },
  {
    id: 'product-info',
    name: '商品信息',
    description: '商品相关信息模块',
    deprecated: false,
    attributes: [
      {
        id: 'product-info/name',
        name: '商品名称',
        type: 's',
        description: '商品的名称',
      },
      {
        id: 'product-info/price',
        name: '价格',
        type: 'n',
        description: '商品价格',
      },
      {
        id: 'product-info/category',
        name: '分类',
        type: 's',
        description: '商品分类',
      },
      {
        id: 'product-info/description',
        name: '描述',
        type: 's',
        description: '商品详细描述',
      },
      {
        id: 'product-info/stock',
        name: '库存',
        type: 'n',
        description: '库存数量',
      },
    ],
  },
  {
    id: 'payment-info',
    name: '支付信息',
    description: '支付相关信息模块',
    deprecated: false,
    attributes: [
      {
        id: 'payment-info/method',
        name: '支付方式',
        type: 's',
        description: '支付方式',
      },
      {
        id: 'payment-info/amount',
        name: '支付金额',
        type: 'n',
        description: '实际支付金额',
      },
      {
        id: 'payment-info/transaction-id',
        name: '交易号',
        type: 's',
        description: '支付交易号',
      },
      {
        id: 'payment-info/status',
        name: '支付状态',
        type: 's',
        description: '支付状态',
      },
    ],
  },
];

// 实体Mock数据
export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'customer',
    name: '客户',
    description: '客户实体，包含客户的基本信息',
    deprecated: false,
    bundles: ['user-info', 'address-info'],
    attributes: [
      {
        id: 'customer/customer-id',
        name: '客户ID',
        type: 's',
        description: '客户的唯一标识',
      },
      {
        id: 'customer/vip-level',
        name: 'VIP等级',
        type: 's',
        description: '客户的VIP等级',
        enumClassId: 'vip-levels',
      },
      {
        id: 'customer/registration-date',
        name: '注册日期',
        type: 's',
        description: '客户注册日期',
      },
    ],
  },
  {
    id: 'vehicle',
    name: '车辆',
    description: '车辆实体，包含车辆的详细信息',
    deprecated: false,
    bundles: ['vehicle-info'],
    attributes: [
      {
        id: 'vehicle/vehicle-id',
        name: '车辆ID',
        type: 's',
        description: '车辆的唯一标识',
      },
      {
        id: 'vehicle/type',
        name: '车辆类型',
        type: 's',
        description: '车辆类型分类',
        enumClassId: 'vehicle-types',
      },
      {
        id: 'vehicle/fuel-type',
        name: '燃料类型',
        type: 's',
        description: '车辆使用的燃料类型',
        enumClassId: 'fuel-types',
      },
    ],
  },
  {
    id: 'order',
    name: '订单',
    description: '订单实体，包含订单的完整信息',
    deprecated: false,
    bundles: ['order-info', 'payment-info'],
    attributes: [
      {
        id: 'order/customer-id',
        name: '客户ID',
        type: 's',
        description: '下单客户的ID',
      },
      {
        id: 'order/priority',
        name: '优先级',
        type: 's',
        description: '订单处理优先级',
        enumClassId: 'order-priorities',
      },
      {
        id: 'order/delivery-method',
        name: '配送方式',
        type: 's',
        description: '订单配送方式',
        enumClassId: 'delivery-methods',
      },
    ],
  },
  {
    id: 'product',
    name: '商品',
    description: '商品实体，包含商品的详细信息',
    deprecated: false,
    bundles: ['product-info'],
    attributes: [
      {
        id: 'product/product-id',
        name: '商品ID',
        type: 's',
        description: '商品的唯一标识',
      },
      {
        id: 'product/size',
        name: '尺寸',
        type: 's',
        description: '商品尺寸',
        enumClassId: 'sizes',
      },
      {
        id: 'product/color',
        name: '颜色',
        type: 's',
        description: '商品颜色',
        enumClassId: 'colors',
      },
      {
        id: 'product/brand',
        name: '品牌',
        type: 's',
        description: '商品品牌',
        enumClassId: 'brands',
      },
    ],
  },
  {
    id: 'employee',
    name: '员工',
    description: '员工实体，包含员工的基本信息',
    deprecated: false,
    bundles: ['user-info'],
    attributes: [
      {
        id: 'employee/employee-id',
        name: '员工ID',
        type: 's',
        description: '员工的唯一标识',
      },
      {
        id: 'employee/department',
        name: '部门',
        type: 's',
        description: '员工所属部门',
        enumClassId: 'departments',
      },
      {
        id: 'employee/position',
        name: '职位',
        type: 's',
        description: '员工职位',
        enumClassId: 'positions',
      },
      {
        id: 'employee/salary',
        name: '薪资',
        type: 'n',
        description: '员工薪资',
      },
    ],
  },
];

// 枚举类Mock数据
export const MOCK_ENUM_CLASSES: Record<string, EnumClass> = {
  'vehicle-types': {
    id: 'vehicle-types',
    name: '车辆类型',
    description: '工程车辆分类',
    values: ['推土机', '挖掘机', '装载机', '压路机', '起重机', '混凝土搅拌车', '自卸车'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  colors: {
    id: 'colors',
    name: '颜色',
    description: '常用颜色选项',
    values: ['红色', '蓝色', '绿色', '黄色', '黑色', '白色', '银色', '灰色'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  sizes: {
    id: 'sizes',
    name: '尺寸',
    description: '标准尺寸规格',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'vip-levels': {
    id: 'vip-levels',
    name: 'VIP等级',
    description: '客户VIP等级分类',
    values: ['普通会员', '银卡会员', '金卡会员', '白金会员', '钻石会员'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'fuel-types': {
    id: 'fuel-types',
    name: '燃料类型',
    description: '车辆燃料类型',
    values: ['汽油', '柴油', '电动', '混合动力', '天然气'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'order-priorities': {
    id: 'order-priorities',
    name: '订单优先级',
    description: '订单处理优先级',
    values: ['低', '普通', '高', '紧急'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'delivery-methods': {
    id: 'delivery-methods',
    name: '配送方式',
    description: '订单配送方式',
    values: ['标准配送', '快速配送', '次日达', '当日达', '自提'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  brands: {
    id: 'brands',
    name: '品牌',
    description: '商品品牌',
    values: ['苹果', '三星', '华为', '小米', 'OPPO', 'vivo', '一加'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  departments: {
    id: 'departments',
    name: '部门',
    description: '公司部门',
    values: ['技术部', '产品部', '运营部', '市场部', '销售部', '人事部', '财务部'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  positions: {
    id: 'positions',
    name: '职位',
    description: '员工职位',
    values: [
      '初级工程师',
      '中级工程师',
      '高级工程师',
      '技术专家',
      '技术经理',
      '产品经理',
      '项目经理',
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// Mock API延迟模拟
export const MOCK_DELAY = 500; // 500ms延迟模拟网络请求

// Mock API响应工具函数
export const mockApiResponse = <T>(data: T, delay: number = MOCK_DELAY): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });

// 生成随机ID的工具函数
export const generateId = (prefix: string = 'item'): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
