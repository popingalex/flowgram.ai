import styled from 'styled-components';

// 自定义的UIRow，调整布局比例
export const CustomUIRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 300px; /* 减少最小宽度 */
`;

// 自定义的UIName，填充剩余宽度
export const CustomUIName = styled.div`
  flex: 1;
  min-width: 0; /* 允许收缩 */
`;

// 自定义的UIType，固定宽度
export const CustomUIType = styled.div`
  width: 56px; /* 28px类型选择器 + 24px按钮 + 4px间距 */
  flex-shrink: 0;
`;

// 自定义的UIRequired，固定宽度
export const CustomUIRequired = styled.div`
  width: 20px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
`;

// 自定义的UIActions，固定宽度
export const CustomUIActions = styled.div`
  white-space: nowrap;
  flex-shrink: 0;
  width: 84px; /* 固定宽度，容纳3个按钮：展开+添加子项+删除 */
  display: flex;
  justify-content: flex-end;
  gap: 2px;
`;

// 自定义的UIContainer，增加最小宽度
export const CustomUIContainer = styled.div`
  min-width: 400px; /* 减少最小宽度 */
`;
