import { useState, useCallback } from 'react';

interface DebugPanelState {
  visible: boolean;
  data: any;
  title: string;
}

export const useDebugPanel = () => {
  const [debugState, setDebugState] = useState<DebugPanelState>({
    visible: false,
    data: null,
    title: 'Debug 数据',
  });

  const showDebugPanel = useCallback((data: any, title?: string) => {
    setDebugState({
      visible: true,
      data,
      title: title || 'Debug 数据',
    });
  }, []);

  const hideDebugPanel = useCallback(() => {
    setDebugState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const toggleDebugPanel = useCallback((data?: any, title?: string) => {
    setDebugState((prev) => ({
      visible: !prev.visible,
      data: data !== undefined ? data : prev.data,
      title: title || prev.title,
    }));
  }, []);

  const updateDebugData = useCallback((data: any, title?: string) => {
    setDebugState((prev) => ({
      ...prev,
      data,
      title: title || prev.title,
    }));
  }, []);

  return {
    debugState,
    showDebugPanel,
    hideDebugPanel,
    toggleDebugPanel,
    updateDebugData,
  };
};
