import { useState, useEffect, useCallback } from 'react';

export type RouteType = 'entities' | 'modules' | 'entity-workflow';

export interface RouteState {
  route: RouteType;
  entityId?: string;
}

// 解析URL路径（支持hash和正常路径）
const parseUrl = (pathname: string, hash?: string): RouteState => {
  // 优先解析hash路径
  if (hash && hash.startsWith('#')) {
    const hashPath = hash.substring(1); // 移除#

    if (hashPath === 'entities') {
      return { route: 'entities' };
    }

    if (hashPath === 'modules') {
      return { route: 'modules' };
    }

    // 匹配 entity-workflow/{entityId}
    const entityWorkflowMatch = hashPath.match(/^entity-workflow\/([^/]+)\/?$/);
    if (entityWorkflowMatch) {
      return {
        route: 'entity-workflow',
        entityId: entityWorkflowMatch[1],
      };
    }
  }

  // 解析正常路径
  const path = pathname.replace(/^\//, '');

  if (path === '' || path === 'entities') {
    return { route: 'entities' };
  }

  if (path === 'modules') {
    return { route: 'modules' };
  }

  // 匹配 entities/{entityId}
  const entityWorkflowMatch = path.match(/^entities\/([^/]+)\/?$/);
  if (entityWorkflowMatch) {
    return {
      route: 'entity-workflow',
      entityId: entityWorkflowMatch[1],
    };
  }

  // 默认返回实体列表
  return { route: 'entities' };
};

// 生成URL路径
const generateUrl = (routeState: RouteState): string => {
  switch (routeState.route) {
    case 'entities':
      return '/entities/';
    case 'modules':
      return '/modules/';
    case 'entity-workflow':
      return `/entities/${routeState.entityId}/`;
    default:
      return '/entities/';
  }
};

export const useRouter = () => {
  const [routeState, setRouteState] = useState<RouteState>(() =>
    parseUrl(window.location.pathname, window.location.hash)
  );

  // 初始化时确保URL正确，但不强制重定向
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const parsedRoute = parseUrl(currentPath, currentHash);

    // 只有在根路径且没有hash时才重定向
    if ((currentPath === '/' || currentPath === '') && !currentHash) {
      const newUrl = '/entities/';
      window.history.replaceState({}, '', newUrl);
      setRouteState({ route: 'entities' });
    } else {
      // 设置解析的路由状态，但不强制修改URL
      setRouteState(parsedRoute);
    }
  }, []);

  // 监听浏览器前进后退和hash变化
  useEffect(() => {
    const handleLocationChange = () => {
      setRouteState(parseUrl(window.location.pathname, window.location.hash));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // 导航到指定路由
  const navigate = useCallback((newRouteState: RouteState) => {
    const url = generateUrl(newRouteState);
    window.history.pushState({}, '', url);
    setRouteState(newRouteState);
  }, []);

  // 替换当前路由（不添加历史记录）
  const replace = useCallback((newRouteState: RouteState) => {
    const url = generateUrl(newRouteState);
    window.history.replaceState({}, '', url);
    setRouteState(newRouteState);
  }, []);

  return {
    routeState,
    navigate,
    replace,
  };
};
