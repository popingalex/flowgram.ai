import { useEffect } from 'react';

import { usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';
import { IconExpand } from '@douyinfe/semi-icons';

export const FitView = () => {
  const tools = usePlaygroundTools();

  // 监听全局fitView事件
  useEffect(() => {
    const handleFitView = () => {
      tools.fitView();
    };

    window.addEventListener('triggerFitView', handleFitView);
    return () => {
      window.removeEventListener('triggerFitView', handleFitView);
    };
  }, [tools]);

  return (
    <Tooltip content="FitView">
      <IconButton
        icon={<IconExpand />}
        type="tertiary"
        theme="borderless"
        onClick={() => tools.fitView()}
      />
    </Tooltip>
  );
};
