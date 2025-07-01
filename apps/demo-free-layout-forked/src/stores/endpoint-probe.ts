import { subscribeWithSelector } from 'zustand/middleware';
import { create } from 'zustand';

// 探查状态枚举 - 对应Kuma状态
export type ProbeStatus = 'REACHABLE' | 'UNREACHABLE' | 'TIMEOUT' | 'ERROR';

// Kuma监控项接口
export interface KumaMonitor {
  id: number;
  name: string;
  status: number; // Kuma状态: 0=down, 1=up, 2=pending
  type: string;
  lastCheck?: string;
  responseTime?: number;
  message?: string;
}

// 端点状态接口
export interface EndpointStatus {
  endpoint: string;
  status: ProbeStatus;
  lastProbeTime: string;
  responseTimeMs?: number;
  errorMessage?: string;
  kumaMonitorId?: number;
}

// Kuma API响应接口
export interface KumaStatusResponse {
  success: boolean;
  monitors: KumaMonitor[];
  total: number;
  dashboardUrl: string;
  timestamp: string;
  message?: string;
}

// 同步响应接口
export interface SyncResponse {
  success: boolean;
  message: string;
  added?: number;
  removed?: number;
  total?: number;
  dashboardUrl?: string;
}

interface EndpointProbeState {
  // 状态数据
  endpointStatuses: Map<string, EndpointStatus>;
  kumaMonitors: KumaMonitor[];
  loading: boolean;
  error: string | null;
  lastUpdateTime: number;
  dashboardUrl: string;

  // 操作方法
  fetchKumaStatus: () => Promise<void>;
  syncToKuma: () => Promise<SyncResponse>;
  getEndpointStatus: (endpoint: string) => EndpointStatus | undefined;
  startPolling: () => void;
  stopPolling: () => void;
  reset: () => void;
}

// API服务配置
const API_BASE_URL = 'http://localhost:8080/api/endpoint-monitoring';
const POLL_INTERVAL = 30000; // 30秒轮询一次

let pollTimer: NodeJS.Timeout | null = null;

// Kuma状态转换为ProbeStatus
const convertKumaStatus = (kumaStatus: number): ProbeStatus => {
  switch (kumaStatus) {
    case 1:
      return 'REACHABLE';
    case 0:
      return 'UNREACHABLE';
    case 2:
      return 'TIMEOUT';
    default:
      return 'ERROR';
  }
};

export const useEndpointProbeStore = create<EndpointProbeState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    endpointStatuses: new Map(),
    kumaMonitors: [],
    loading: false,
    error: null,
    lastUpdateTime: 0,
    dashboardUrl: '',

    // 获取Kuma监控状态
    fetchKumaStatus: async () => {
      try {
        set({ loading: true, error: null });

        const response = await fetch(`${API_BASE_URL}/monitor-status`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: KumaStatusResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || '获取监控状态失败');
        }

        // 转换为端点状态映射
        const statusMap = new Map<string, EndpointStatus>();

        for (const monitor of data.monitors) {
          statusMap.set(monitor.name, {
            endpoint: monitor.name,
            status: convertKumaStatus(monitor.status),
            lastProbeTime: monitor.lastCheck || '',
            responseTimeMs: monitor.responseTime,
            errorMessage: monitor.message,
            kumaMonitorId: monitor.id,
          });
        }

        set({
          endpointStatuses: statusMap,
          kumaMonitors: data.monitors,
          dashboardUrl: data.dashboardUrl,
          lastUpdateTime: Date.now(),
          loading: false,
        });

        console.log('🔍 [EndpointProbeStore] 获取到 %d 个Kuma监控项', data.monitors.length);
      } catch (error) {
        console.error('获取Kuma监控状态失败:', error);
        set({
          error: error instanceof Error ? error.message : '获取监控状态失败',
          loading: false,
        });
      }
    },

    // 同步端点到Uptime Kuma
    syncToKuma: async (): Promise<SyncResponse> => {
      try {
        console.log('🔄 开始同步端点到Uptime Kuma');

        // 从expressionApi获取远程服务数据
        const { expressionApi } = await import('../services/api-service');
        const expressions = await expressionApi.getAll();

        // 提取所有URL并解析端点
        const endpoints: string[] = [];
        expressions.forEach((expr) => {
          if (expr.url) {
            try {
              const url = new URL(expr.url);
              const endpoint = `${url.hostname}:${
                url.port || (url.protocol === 'https:' ? '443' : '80')
              }`;
              if (!endpoints.includes(endpoint)) {
                endpoints.push(endpoint);
              }
            } catch (e) {
              console.warn('解析URL失败:', expr.url, e);
            }
          }
        });

        console.log('📡 提取到端点:', endpoints);

        if (endpoints.length === 0) {
          console.warn('⚠️ 没有找到有效的端点');
          return {
            success: false,
            message: '没有找到有效的端点',
          };
        }

        // 调用后端API同步到Kuma
        const response = await fetch(`${API_BASE_URL}/sync-to-kuma`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(endpoints),
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 同步成功:', result);
          return {
            success: true,
            message: `成功同步 ${endpoints.length} 个端点`,
          };
        } else {
          console.error('❌ 同步失败:', result.message);
          return {
            success: false,
            message: result.message || '同步失败',
          };
        }
      } catch (error) {
        console.error('❌ 同步到Kuma失败:', error);
        const errorMessage = error instanceof Error ? error.message : '同步失败';
        return {
          success: false,
          message: errorMessage,
        };
      }
    },

    // 获取指定端点的状态
    getEndpointStatus: (endpoint: string) => get().endpointStatuses.get(endpoint),

    // 开始轮询
    startPolling: () => {
      const { fetchKumaStatus } = get();

      // 立即执行一次
      fetchKumaStatus();

      // 设置定时轮询
      if (pollTimer) {
        clearInterval(pollTimer);
      }

      pollTimer = setInterval(() => {
        fetchKumaStatus();
      }, POLL_INTERVAL);

      console.log('🔍 [EndpointProbeStore] 开始轮询Kuma状态，间隔 %d 秒', POLL_INTERVAL / 1000);
    },

    // 停止轮询
    stopPolling: () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
        console.log('🔍 [EndpointProbeStore] 停止轮询');
      }
    },

    // 重置状态
    reset: () => {
      get().stopPolling();
      set({
        endpointStatuses: new Map(),
        kumaMonitors: [],
        loading: false,
        error: null,
        lastUpdateTime: 0,
        dashboardUrl: '',
      });
    },
  }))
);

// 状态颜色映射
export const getStatusColor = (status: ProbeStatus): string => {
  switch (status) {
    case 'REACHABLE':
      return '#52c41a'; // 绿色
    case 'UNREACHABLE':
      return '#ff4d4f'; // 红色
    case 'TIMEOUT':
      return '#fa8c16'; // 橙色
    case 'ERROR':
      return '#722ed1'; // 紫色
    default:
      return '#d9d9d9'; // 灰色
  }
};

// 状态文本映射
export const getStatusText = (status: ProbeStatus): string => {
  switch (status) {
    case 'REACHABLE':
      return '可达';
    case 'UNREACHABLE':
      return '不可达';
    case 'TIMEOUT':
      return '超时';
    case 'ERROR':
      return '错误';
    default:
      return '未知';
  }
};
