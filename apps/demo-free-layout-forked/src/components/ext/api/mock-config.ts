// Mock模式配置文件
// 您可以通过修改这个文件来控制是否使用mock数据

export const MOCK_CONFIG = {
  // 是否启用mock模式
  // true: 使用本地mock数据，不依赖后台服务
  // false: 使用真实的后台API
  ENABLED: true,

  // Mock API延迟时间（毫秒）
  // 模拟网络请求延迟，让开发体验更接近真实环境
  DELAY: 300,

  // 是否在控制台打印mock API调用日志
  LOG_REQUESTS: true,

  // 是否持久化mock数据到localStorage
  // true: 数据会保存在浏览器本地存储中，刷新页面后数据不会丢失
  // false: 每次刷新页面都会重置为初始mock数据
  PERSIST_DATA: true,

  // localStorage的key前缀
  STORAGE_PREFIX: 'flowgram_mock_',
};

// 获取mock数据的localStorage key
export const getMockStorageKey = (dataType: string): string =>
  `${MOCK_CONFIG.STORAGE_PREFIX}${dataType}`;

// 清除所有mock数据
export const clearAllMockData = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(MOCK_CONFIG.STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('已清除所有mock数据');
};

// 重置mock数据到初始状态
export const resetMockData = async (): Promise<void> => {
  const { MOCK_MODULES, MOCK_ENTITIES, MOCK_ENUM_CLASSES } = await import('./mock-data');

  localStorage.setItem(getMockStorageKey('modules'), JSON.stringify(MOCK_MODULES));
  localStorage.setItem(getMockStorageKey('entities'), JSON.stringify(MOCK_ENTITIES));
  localStorage.setItem(getMockStorageKey('enum_classes'), JSON.stringify(MOCK_ENUM_CLASSES));

  console.log('已重置mock数据到初始状态');
};

// 导出mock数据（用于备份）
export const exportMockData = (): string => {
  const data = {
    modules: JSON.parse(localStorage.getItem(getMockStorageKey('modules')) || '[]'),
    entities: JSON.parse(localStorage.getItem(getMockStorageKey('entities')) || '[]'),
    enumClasses: JSON.parse(localStorage.getItem(getMockStorageKey('enum_classes')) || '{}'),
    exportTime: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
};

// 导入mock数据（用于恢复）
export const importMockData = (jsonData: string): void => {
  try {
    const data = JSON.parse(jsonData);

    if (data.modules) {
      localStorage.setItem(getMockStorageKey('modules'), JSON.stringify(data.modules));
    }
    if (data.entities) {
      localStorage.setItem(getMockStorageKey('entities'), JSON.stringify(data.entities));
    }
    if (data.enumClasses) {
      localStorage.setItem(getMockStorageKey('enum_classes'), JSON.stringify(data.enumClasses));
    }

    console.log('已导入mock数据');
  } catch (error) {
    console.error('导入mock数据失败:', error);
    throw new Error('无效的JSON数据');
  }
};

// 开发者工具：在控制台中可用的全局函数
if (typeof window !== 'undefined') {
  (window as any).mockUtils = {
    clearAllMockData,
    resetMockData,
    exportMockData,
    importMockData,
    config: MOCK_CONFIG,
  };

  console.log('Mock工具已加载，可在控制台使用 mockUtils 对象');
}
