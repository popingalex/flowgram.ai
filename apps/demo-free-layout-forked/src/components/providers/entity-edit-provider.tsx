import React from 'react';

import { useCurrentEntityActions } from '../../stores';
import { Entity } from '../../services/types';

interface EntityEditProviderProps {
  entity: Entity;
  children: React.ReactNode;
}

export const EntityEditProvider: React.FC<EntityEditProviderProps> = ({ entity, children }) => {
  const { selectEntity } = useCurrentEntityActions();

  // 当 entity prop 变化时，更新当前选中的实体
  React.useEffect(() => {
    if (entity) {
      selectEntity(entity);
    }
  }, [entity]);

  return <>{children}</>;
};
