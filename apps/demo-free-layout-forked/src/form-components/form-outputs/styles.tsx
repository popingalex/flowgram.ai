import styled from 'styled-components';

export const FormOutputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--semi-color-border);
  padding: 8px 0 0;
  width: 100%;

  :global(.semi-tag .semi-tag-content) {
    font-size: 10px;
  }
`;
