import styled from 'styled-components';

export const UIContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
`;

export const UIMain = styled.div`
  flex-grow: 1;

  & .semi-tree-select,
  & .semi-input-number,
  & .semi-select,
  & .semi-input {
    width: 100%;
  }
`;

export const UITrigger = styled.div`
  flex-shrink: 0;
  width: auto;
`;
