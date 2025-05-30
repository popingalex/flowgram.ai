// API配置
import { MOCK_CONFIG, mockApiHandler } from './api-mock';

export const API_CONFIG = {
  BASE_URL: 'http://localhost:9999',
  ENDPOINTS: {
    MODULE: '/cm/module/',
    ENTITY: '/cm/entity/',
  },
};

// 构建完整的API URL
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// API请求工具函数 - 统一入口
export const apiRequest = async (url: string, options?: RequestInit) => {
  // 简单的mock开关判断
  if (MOCK_CONFIG.ENABLED) {
    return mockApiHandler(url, options);
  }

  // 真实API请求
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
