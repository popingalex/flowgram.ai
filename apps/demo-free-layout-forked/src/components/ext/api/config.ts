// API配置
export const API_CONFIG = {
  BASE_URL: 'http://localhost:9999',
  ENDPOINTS: {
    MODULE: '/cm/module/',
    ENTITY: '/cm/entity/',
  },
};

// 构建完整的API URL
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// API请求工具函数
export const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
