// 统一的Mock数据文件
// 只包含测试数据，类型定义已移至types.ts

import type { Module, Entity, EnumClass } from './types';

// 模块Mock数据
export const MOCK_MODULES: Module[] = [
  {
    id: 'container',
    name: '容器',
    deprecated: false,
    attributes: [
      {
        id: 'container/content',
        type: '(entity:s,type_id:s,type_name:s,flow_min:n,flow_max:n,amount:n,detail:u,cost:n,capacity:n,delivery_rate:n,production_rate:n)[]',
        name: '内容物',
      },
      {
        id: 'container/strategy',
        type: 's',
        name: '策略',
      },
      {
        id: 'container/capacity',
        type: 'n',
        name: '容量',
      },
    ],
  },
  {
    id: 'mobile',
    name: '移动的',
    deprecated: false,
    attributes: [
      {
        id: 'mobile/path',
        type: 'n[6][]',
        name: '路径',
      },
      {
        id: 'mobile/step_path',
        type: 'n[6][]',
        name: '步进路径',
      },
      {
        id: 'mobile/road_path',
        type: 'n[6][]',
        name: '路网路径',
      },
      {
        id: 'mobile/step_road_path',
        type: 'n[6][]',
        name: '路网步进路径',
      },
      {
        id: 'mobile/road_position',
        type: 'n[3][]',
        name: '路网位置',
      },
      {
        id: 'mobile/destination',
        type: 'n[6]',
        name: '目的地',
      },
      {
        id: 'mobile/velocity',
        type: '(mode:s,scalar:n)[]',
        name: '速度',
      },
    ],
  },
  {
    id: 'terrain',
    name: '地形通用',
    deprecated: false,
    attributes: [
      {
        id: 'terrain/landform_matrix',
        type: '(depth:n,elevation:n,composition:(matter:s,amount:n)[])[][]',
        name: '地貌矩阵',
      },
      {
        id: 'terrain/hydrology_matrix',
        type: '(depth:n,elevation:n,velocities:(n:n,w:n,e:n,s:n),flow:n)[][]',
        name: '水文矩阵',
      },
      {
        id: 'terrain/road_network',
        type: '(node:s,position:n[3],neighbors:s[])[]',
        name: '路网',
      },
      {
        id: 'terrain/river_network',
        type: '(node:s,position:n[3],neighbors:s[])[]',
        name: '河网',
      },
    ],
  },
  {
    id: 'controlled',
    name: '可控制的',
    deprecated: false,
    attributes: [
      {
        id: 'controlled/commands',
        type: '(command:s,args:u)[]',
        name: '指令集合',
      },
      {
        id: 'controlled/standby_position',
        type: 'n[3]',
        name: '待机位置',
      },
      {
        id: 'controlled/work_position',
        type: 'n[3]',
        name: '工作位置',
      },
      {
        id: 'controlled/action',
        type: 's',
        name: '行为',
      },
      {
        id: 'controlled/action_cost',
        type: 'n',
        name: '行为消耗',
      },
      {
        id: 'controlled/action_progress',
        type: 'n',
        name: '行为进度',
      },
      {
        id: 'controlled/action_target',
        type: 's',
        name: '行为目标',
      },
      {
        id: 'controlled/stance',
        type: 's',
        name: '姿态',
      },
      {
        id: 'controlled/status',
        type: 's',
        name: '状态',
      },
    ],
  },
  {
    id: 'vehicle',
    name: '载具',
    deprecated: false,
    attributes: [
      {
        id: 'vehicle/loading_area',
        type: 's',
        name: 'loading_area',
      },
      {
        id: 'vehicle/unloading_area',
        type: 's',
        name: 'unloading_area',
      },
      {
        id: 'vehicle/type',
        type: 's',
        name: 'type',
      },
    ],
  },
  {
    id: 'transform',
    name: '变换',
    deprecated: false,
    attributes: [
      {
        id: 'transform/coordinates',
        type: 'n[3]',
        name: '坐标',
      },
      {
        id: 'transform/position',
        type: 'n[3]',
        name: '位置',
      },
      {
        id: 'transform/lonlatposition',
        type: 'n[3]',
        name: '经纬度位置',
      },
      {
        id: 'transform/rotation',
        type: 'n[3]',
        name: '旋转',
      },
      {
        id: 'transform/scale',
        type: 'n[3]',
        name: '缩放',
      },
    ],
  },
];

// 实体Mock数据
export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'vehicle',
    name: '载具',
    deprecated: false,
    attributes: [
      {
        id: 'vehicle_yard_id',
        type: 's',
        name: '集结点id',
      },
      {
        id: 'task_id',
        type: 's',
        name: '任务id',
      },
      {
        id: 'vehicle_name',
        type: 's',
        name: '载具名称',
      },
      {
        id: 'length',
        type: 'n',
        name: '长',
      },
      {
        id: 'width',
        type: 'n',
        name: '宽',
      },
      {
        id: 'height',
        type: 'n',
        name: '高',
      },
      {
        id: 'empty_weight',
        type: 'n',
        name: '空载重量',
      },
      {
        id: 'max_takeoff_weight',
        type: 'n',
        name: '最大起飞重量',
      },
      {
        id: 'max_people_count',
        type: 'n',
        name: '最大运输人数',
      },
      {
        id: 'rotor_diameter',
        type: 'n',
        name: '旋翼直径',
      },
      {
        id: 'tail_rotor_diameter',
        type: 'n',
        name: '尾桨直径',
      },
      {
        id: 'rated_flow',
        type: 'n',
        name: '额定排水流量',
      },
      {
        id: 'rated_head',
        type: 'n',
        name: '额定扬程',
      },
      {
        id: 'pumping_need_min_depth',
        type: 'n',
        name: '抽水所需最低水深',
      },
    ],
    bundles: ['mobile', 'transform', 'controlled', 'container', 'vehicle'],
  },
  {
    id: 'slope',
    name: '边坡',
    deprecated: false,
    attributes: [
      {
        id: 'slope_name',
        type: 's',
        name: '名称',
      },
      {
        id: 'slope_type',
        type: 's',
        name: '区分左右',
      },
      {
        id: 'slope_height',
        type: 'n',
        name: '边坡高度',
      },
    ],
    bundles: ['transform'],
  },
  {
    id: 'debris_flow',
    name: '泥石流',
    deprecated: false,
    attributes: [
      {
        id: 'region',
        type: 'n[]',
        name: '泥石流区域',
      },
      {
        id: 'area',
        type: 'n[]',
        name: '泥石流面积',
      },
      {
        id: 'volume',
        type: 'n',
        name: '泥石流量',
      },
      {
        id: 'state',
        type: 's',
        name: '泥石流状态',
      },
      {
        id: 'type',
        type: 's',
        name: '流域形态',
      },
      {
        id: 'form',
        type: 's',
        name: '物质状态',
      },
    ],
    bundles: [],
  },
  {
    id: 'landslide',
    name: '滑坡体',
    deprecated: false,
    attributes: [
      {
        id: 'landslide_amount',
        type: 'n',
        name: '滑坡量',
      },
      {
        id: 'excavated_volume',
        type: 'n',
        name: '已挖方量',
      },
      {
        id: 'landslide_height',
        type: 'n',
        name: '滑坡体高度',
      },
      {
        id: 'landslide_up_width',
        type: 'n',
        name: '滑坡体上宽',
      },
      {
        id: 'landslide_down_width',
        type: 'n',
        name: '滑坡体底宽',
      },
      {
        id: 'landslide_incline length',
        type: 'n',
        name: '滑坡体斜面长',
      },
      {
        id: 'digger_arr',
        type: 'n[]',
        name: '挖掘机工作点',
      },
    ],
    bundles: ['transform'],
  },
  {
    id: 'barrier_lake',
    name: '堰塞湖',
    deprecated: false,
    attributes: [
      {
        id: 'storage_capacity',
        type: 's',
        name: '储水量/库容',
      },
      {
        id: 'barrierlake_area',
        type: 'n',
        name: '堰塞湖面积',
      },
      {
        id: 'water_depth',
        type: 's',
        name: '水深',
      },
      {
        id: 'water_level',
        type: 's',
        name: '水位',
      },
      {
        id: 'max_water_level',
        type: 'n',
        name: '最高水位',
      },
      {
        id: 'water_level_diff',
        type: 'n',
        name: '上下游水位差',
      },
      {
        id: 'region',
        type: 'n[]',
        name: '堰塞湖区域',
      },
      {
        id: 'barrier_lake_water_depth',
        type: 'n',
        name: '堰塞湖底高程',
      },
      {
        id: 'risk_level',
        type: 'n',
        name: '风险等级',
      },
      {
        id: 'discharging_capacity',
        type: 'n',
        name: '泄流量',
      },
      {
        id: 'flood_discharge_time',
        type: 'n',
        name: '泄洪预估所需时长',
      },
      {
        id: 'barrier_lake_safe_water_level',
        type: 'n',
        name: '堰塞湖安全水位',
      },
      {
        id: 'peak_discharge',
        type: 'n',
        name: '洪峰流量',
      },
      {
        id: 'flood_peak_time',
        type: 'n',
        name: '洪峰时间',
      },
      {
        id: 'downstream_runoff_range',
        type: 'n',
        name: '下游径流范围',
      },
      {
        id: 'warn_range_time',
        type: 'n',
        name: '到达下游居住区警戒范围的时间',
      },
      {
        id: 'inflow',
        type: 'n',
        name: '进水流量',
      },
      {
        id: 'outflow',
        type: 'n',
        name: '出水流量',
      },
    ],
    bundles: [],
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
