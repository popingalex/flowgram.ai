import React, { useEffect, useState } from 'react';

import { Tag, Tooltip, Button, Spin } from '@douyinfe/semi-ui';
import { IconLink, IconRefresh } from '@douyinfe/semi-icons';

interface EndpointHealthStatusProps {
  /** endpoint格式：hostname:port */
  endpoint?: string;
  /** 显示模式：compact(只显示状态) | full(显示状态+跳转按钮) */
  mode?: 'compact' | 'full';
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
}

interface HealthStatus {
  status: 'UP' | 'DOWN' | 'PENDING' | 'UNKNOWN';
  dashboardUrl?: string;
  lastUpdate?: number;
}

// 状态颜色映射
const getStatusColor = (status: string) => {
  switch (status) {
    case 'UP':
      return 'green';
    case 'DOWN':
      return 'red';
    case 'PENDING':
      return 'orange';
    default:
      return 'grey';
  }
};

// 状态文本映射
const getStatusText = (status: string) => {
  switch (status) {
    case 'UP':
      return '正常';
    case 'DOWN':
      return '异常';
    case 'PENDING':
      return '检测中';
    default:
      return '未知';
  }
};

export const EndpointHealthStatus: React.FC<EndpointHealthStatusProps> = ({
  endpoint,
  mode = 'compact',
  showRefresh = false,
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ status: 'UNKNOWN' });
  const [loading, setLoading] = useState(false);

  // 获取健康状态
  const fetchHealthStatus = async () => {
    if (!endpoint) {
      console.log('🔍 [HealthStatus] 没有endpoint，跳过获取状态');
      setHealthStatus({ status: 'UNKNOWN' });
      return;
    }

    console.log('🔍 [HealthStatus] 开始获取健康状态，endpoint:', endpoint);
    setLoading(true);
    try {
      console.log('🔍 [HealthStatus] 发送API请求...');
      const response = await fetch('http://192.168.239.7:8080/api/endpoints/status');
      console.log('🔍 [HealthStatus] API响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [HealthStatus] API返回数据:', data);

        // 查找对应endpoint的状态
        const monitors = data.monitors || [];
        const monitor = monitors.find((m: any) => m.name === endpoint);
        console.log('🔍 [HealthStatus] 查找monitor结果:', monitor);

        if (monitor) {
          // 构建具体monitor的跳转URL
          const dashboardUrl = monitor.id
            ? `http://192.168.239.7:3001/dashboard/${monitor.id}`
            : data.dashboardUrl.replace('localhost', '192.168.239.7');

          // 根据active状态和实际status决定显示状态
          let displayStatus = monitor.status;
          if (monitor.status === 'UNKNOWN' && monitor.active === true) {
            displayStatus = 'UP'; // active但状态未知，显示为正常
          }

          setHealthStatus({
            status: displayStatus || 'UNKNOWN',
            dashboardUrl: dashboardUrl,
            lastUpdate: Date.now(),
          });
          console.log(
            '🔍 [HealthStatus] 设置状态为:',
            displayStatus,
            '(原始:',
            monitor.status,
            ', active:',
            monitor.active,
            ')'
          );
        } else {
          console.log('🔍 [HealthStatus] 未找到对应的monitor，设置为UNKNOWN');
          setHealthStatus({
            status: 'UNKNOWN',
            dashboardUrl: data.dashboardUrl, // 使用通用dashboard URL
          });
        }
      } else {
        console.error('🔍 [HealthStatus] API请求失败，状态码:', response.status);
        setHealthStatus({ status: 'UNKNOWN' });
      }
    } catch (error) {
      console.error('🔍 [HealthStatus] 获取健康状态失败:', error);
      setHealthStatus({ status: 'UNKNOWN' });
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取状态
  useEffect(() => {
    fetchHealthStatus();
  }, [endpoint]);

  // 跳转到Uptime Kuma
  const handleJumpToKuma = () => {
    if (healthStatus.dashboardUrl) {
      window.open(healthStatus.dashboardUrl, '_blank');
    } else {
      // 如果没有具体的monitor URL，跳转到dashboard首页
      window.open('http://192.168.239.7:3001/dashboard', '_blank');
    }
  };

  // 如果没有endpoint，不显示
  if (!endpoint) {
    return null;
  }

  const statusColor = getStatusColor(healthStatus.status);
  const statusText = getStatusText(healthStatus.status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* 健康状态标签 */}
      <Tooltip
        content={`Endpoint: ${endpoint}\n状态: ${statusText}\n${
          healthStatus.lastUpdate
            ? `更新时间: ${new Date(healthStatus.lastUpdate).toLocaleString()}`
            : ''
        }`}
      >
        <Tag
          color={statusColor}
          size="small"
          style={{ cursor: 'pointer' }}
          onClick={mode === 'full' ? handleJumpToKuma : undefined}
        >
          {loading ? <Spin size="small" /> : statusText}
        </Tag>
      </Tooltip>

      {/* 完整模式下显示跳转和刷新按钮 */}
      {mode === 'full' && (
        <>
          <Tooltip content="跳转到 Uptime Kuma">
            <Button
              icon={<IconLink />}
              size="small"
              theme="borderless"
              onClick={handleJumpToKuma}
            />
          </Tooltip>

          {showRefresh && (
            <Tooltip content="刷新健康状态">
              <Button
                icon={<IconRefresh />}
                size="small"
                theme="borderless"
                loading={loading}
                onClick={fetchHealthStatus}
              />
            </Tooltip>
          )}
        </>
      )}
    </div>
  );
};
