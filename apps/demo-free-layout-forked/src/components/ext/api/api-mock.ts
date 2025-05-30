// 统一的API Mock系统
// 基于真实后台数据结构

// Mock配置 - 简单的开关
export const MOCK_CONFIG = {
  ENABLED: true, // 设置为false使用真实API
  DELAY: 300, // mock延迟时间
};

// 切换mock模式的函数
export const toggleMockMode = () => {
  MOCK_CONFIG.ENABLED = !MOCK_CONFIG.ENABLED;
  console.log(`Mock模式已${MOCK_CONFIG.ENABLED ? '启用' : '禁用'}`);
};

// 获取当前mock状态
export const isMockEnabled = () => MOCK_CONFIG.ENABLED;

// 真实的模块数据 - 从后台API获取
const REAL_MODULES = [
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
      {
        id: '0',
        type: 's',
        name: '0',
      },
      {
        id: '1',
        type: 's',
        name: 'loading_area',
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

// 真实的实体数据 - 从后台API获取（只取前几个作为示例，完整数据太长）
const REAL_ENTITIES = [
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
        id: 'transform/position',
      },
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
        id: 'transform/position',
      },
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
  },
  {
    id: 'landslide',
    name: '滑坡体',
    deprecated: false,
    attributes: [
      {
        id: 'transform/position',
      },
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
  },
];

// Mock API处理函数
export const mockApiHandler = async (url: string, options?: RequestInit): Promise<any> => {
  console.log(`[MOCK] ${options?.method || 'GET'} ${url}`);

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.DELAY));

  const method = options?.method || 'GET';

  // 模块API
  if (url.includes('/cm/module/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/module/') ? REAL_MODULES : REAL_MODULES[0];
    }
    return { success: true };
  }

  // 实体API
  if (url.includes('/cm/entity/')) {
    if (method === 'GET') {
      return url.endsWith('/cm/entity/') ? REAL_ENTITIES : REAL_ENTITIES[0];
    }
    return { success: true };
  }

  throw new Error(`Mock not implemented for: ${url}`);
};
