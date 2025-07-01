import { subscribeWithSelector } from 'zustand/middleware';
import { create } from 'zustand';

// API响应接口
export interface ApiResponse {
  statusCode: number;
  statusText: string;
  body: any;
  headers: Record<string, string>;
  responseTimeMs: number;
  requestTime: string;
  errorMessage?: string;
  success: boolean;
}

// 请求历史记录
export interface RequestHistory {
  id: string;
  expressionId: string;
  expressionName: string;
  url: string;
  method: string;
  parameters: Record<string, any>;
  response: ApiResponse;
  timestamp: number;
}

interface RemoteApiRequestState {
  // 状态数据
  currentResponse: ApiResponse | null;
  requestHistory: RequestHistory[];
  loading: boolean;
  error: string | null;

  // 操作方法
  sendRequest: (expressionId: string, parameters?: Record<string, any>) => Promise<ApiResponse>;
  testConnection: (expressionId: string) => Promise<any>;
  clearResponse: () => void;
  clearHistory: () => void;
  getHistoryByExpression: (expressionId: string) => RequestHistory[];
  reset: () => void;
}

// API服务配置
const API_BASE_URL = 'http://localhost:8080/api/remote-request';

export const useRemoteApiRequestStore = create<RemoteApiRequestState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    currentResponse: null,
    requestHistory: [],
    loading: false,
    error: null,

    // 发送API请求
    sendRequest: async (expressionId: string, parameters?: Record<string, any>) => {
      try {
        set({ loading: true, error: null });

        console.log('🚀 [RemoteApiRequest] 发送请求:', { expressionId, parameters });

        const requestBody = parameters ? JSON.stringify(parameters) : undefined;

        const response = await fetch(`${API_BASE_URL}/send/${expressionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse: ApiResponse = await response.json();

        // 添加到历史记录
        const historyRecord: RequestHistory = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          expressionId,
          expressionName: expressionId, // 这里可以从其他store获取实际名称
          url: '', // 这里可以从expression获取URL
          method: '', // 这里可以从expression获取method
          parameters: parameters || {},
          response: apiResponse,
          timestamp: Date.now(),
        };

        set({
          currentResponse: apiResponse,
          requestHistory: [historyRecord, ...get().requestHistory.slice(0, 49)], // 保留最近50条
          loading: false,
        });

        console.log('✅ [RemoteApiRequest] 请求成功:', apiResponse);
        return apiResponse;
      } catch (error) {
        console.error('❌ [RemoteApiRequest] 请求失败:', error);
        const errorMessage = error instanceof Error ? error.message : '请求发送失败';

        set({
          error: errorMessage,
          loading: false,
        });

        throw error;
      }
    },

    // 测试连接
    testConnection: async (expressionId: string) => {
      try {
        set({ loading: true, error: null });

        console.log('🔗 [RemoteApiRequest] 测试连接:', expressionId);

        const response = await fetch(`${API_BASE_URL}/test/${expressionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        set({ loading: false });

        console.log('✅ [RemoteApiRequest] 连接测试完成:', result);
        return result;
      } catch (error) {
        console.error('❌ [RemoteApiRequest] 连接测试失败:', error);
        const errorMessage = error instanceof Error ? error.message : '连接测试失败';

        set({
          error: errorMessage,
          loading: false,
        });

        throw error;
      }
    },

    // 清除当前响应
    clearResponse: () => {
      set({ currentResponse: null, error: null });
    },

    // 清除历史记录
    clearHistory: () => {
      set({ requestHistory: [] });
    },

    // 获取指定表达式的历史记录
    getHistoryByExpression: (expressionId: string) =>
      get().requestHistory.filter((record) => record.expressionId === expressionId),

    // 重置状态
    reset: () => {
      set({
        currentResponse: null,
        requestHistory: [],
        loading: false,
        error: null,
      });
    },
  }))
);
